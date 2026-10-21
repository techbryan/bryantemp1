"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceWorkerQueue = void 0;
const active_voice_schema_1 = require("../../database/schemas/active-voice.schema");
const user_profile_schema_1 = require("../../database/schemas/user-profile.schema");
const logger_1 = require("../logger/logger");
class PersistenceWorkerQueue {
    static queue = [];
    static isFlushing = false;
    static MAX_QUEUE_SIZE = 10000;
    static CONCURRENCY = 20;
    static activeKeys = new Set();
    static runningCount = 0;
    static getTaskKey(task) {
        if (task.type === "CREATE_ROOM")
            return `room:${task.data.channelId}`;
        if (task.type === "UPDATE_ROOM")
            return `room:${task.channelId}`;
        if (task.type === "DELETE_ROOM")
            return `room:${task.channelId}`;
        if (task.type === "INCREMENT_CHANNELS_CREATED")
            return `user:${task.guildId}:${task.userId}`;
        return "global";
    }
    static dispatch(task) {
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            logger_1.FastLogger.warn(`Persistence queue near max capacity (${this.queue.length})`);
        }
        this.queue.push(task);
        if (!this.isFlushing) {
            queueMicrotask(() => void this.flush());
        }
    }
    static async flush() {
        while (this.queue.length > 0 || this.runningCount > 0) {
            this.drain();
            await new Promise((res) => setTimeout(res, 50));
        }
    }
    static drain() {
        if (this.runningCount >= this.CONCURRENCY || this.queue.length === 0)
            return;
        for (let i = 0; i < this.queue.length; i++) {
            if (this.runningCount >= this.CONCURRENCY)
                break;
            const task = this.queue[i];
            const key = this.getTaskKey(task);
            if (this.activeKeys.has(key)) {
                continue;
            }
            this.queue.splice(i, 1);
            i--;
            this.activeKeys.add(key);
            this.runningCount++;
            void this.executeTask(task)
                .catch((err) => {
                logger_1.FastLogger.error(`Persistence task failed [${task.type}]`, err);
            })
                .finally(() => {
                this.activeKeys.delete(key);
                this.runningCount--;
                if (this.queue.length > 0) {
                    queueMicrotask(() => this.drain());
                }
            });
        }
    }
    static async executeTask(task) {
        if (task.type === "CREATE_ROOM") {
            await active_voice_schema_1.ActiveVoiceModel.updateOne({ channelId: task.data.channelId }, { $set: task.data }, { upsert: true }).exec();
            return;
        }
        if (task.type === "UPDATE_ROOM") {
            await active_voice_schema_1.ActiveVoiceModel.updateOne({ channelId: task.channelId }, { $set: task.update }, { upsert: false }).exec();
            return;
        }
        if (task.type === "DELETE_ROOM") {
            await active_voice_schema_1.ActiveVoiceModel.deleteOne({ channelId: task.channelId }).exec();
            return;
        }
        if (task.type === "INCREMENT_CHANNELS_CREATED") {
            await user_profile_schema_1.UserProfileModel.updateOne({ userId: task.userId, guildId: task.guildId }, { $inc: { channelsCreated: 1 } }, { upsert: true }).exec();
            return;
        }
    }
}
exports.PersistenceWorkerQueue = PersistenceWorkerQueue;
