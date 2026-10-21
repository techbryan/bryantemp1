"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceMemoryStore = void 0;
const active_voice_schema_1 = require("../../../database/schemas/active-voice.schema");
const persistence_worker_1 = require("../../../core/workers/persistence.worker");
const logger_1 = require("../../../core/logger/logger");
class VoiceMemoryStore {
    static channels = new Map();
    static ownerLookup = new Map();
    static get(channelId) {
        return this.channels.get(channelId);
    }
    static getByOwner(guildId, userId) {
        const channelId = this.ownerLookup.get(`${guildId}:${userId}`);
        return channelId ? this.channels.get(channelId) : undefined;
    }
    static set(session) {
        const ownerKey = `${session.guildId}:${session.ownerId}`;
        const existingChannelId = this.ownerLookup.get(ownerKey);
        if (existingChannelId && existingChannelId !== session.channelId) {
            this.channels.delete(existingChannelId);
            persistence_worker_1.PersistenceWorkerQueue.dispatch({ type: "DELETE_ROOM", channelId: existingChannelId });
        }
        this.channels.set(session.channelId, session);
        this.ownerLookup.set(ownerKey, session.channelId);
    }
    static reassignOwner(channelId, newOwnerId) {
        const session = this.channels.get(channelId);
        if (!session)
            return;
        this.ownerLookup.delete(`${session.guildId}:${session.ownerId}`);
        session.ownerId = newOwnerId;
        this.ownerLookup.set(`${session.guildId}:${newOwnerId}`, channelId);
        persistence_worker_1.PersistenceWorkerQueue.dispatch({
            type: "UPDATE_ROOM",
            channelId,
            update: { ownerId: newOwnerId }
        });
    }
    static remove(channelId) {
        const session = this.channels.get(channelId);
        if (session) {
            this.ownerLookup.delete(`${session.guildId}:${session.ownerId}`);
            this.channels.delete(channelId);
        }
        persistence_worker_1.PersistenceWorkerQueue.dispatch({ type: "DELETE_ROOM", channelId });
    }
    static async preload() {
        try {
            const records = await active_voice_schema_1.ActiveVoiceModel.find().lean();
            for (const item of records) {
                const session = {
                    channelId: item.channelId,
                    guildId: item.guildId,
                    ownerId: item.ownerId,
                    originalOwnerId: item.originalOwnerId,
                    coOwners: new Set(item.coOwners || []),
                    whitelist: new Set(item.whitelist || []),
                    isLocked: Boolean(item.isLocked),
                    isTextLocked: Boolean(item.isTextLocked),
                    isHidden: Boolean(item.isHidden),
                    antiAbuseEnabled: item.antiAbuseEnabled !== false
                };
                this.channels.set(item.channelId, session);
                this.ownerLookup.set(`${item.guildId}:${item.ownerId}`, item.channelId);
            }
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to preload ActiveVoiceModel", err);
        }
    }
    static async reconcileWithDiscord(client) {
        try {
            const staleChannelIds = [];
            for (const [channelId, session] of this.channels.entries()) {
                const guild = client.guilds.cache.get(session.guildId);
                if (!guild) {
                    staleChannelIds.push(channelId);
                    continue;
                }
                let ch = guild.channels.cache.get(channelId);
                if (!ch) {
                    try {
                        ch = (await guild.channels.fetch(channelId).catch(() => null)) ?? undefined;
                    }
                    catch {
                        ch = undefined;
                    }
                }
                if (!ch) {
                    staleChannelIds.push(channelId);
                }
                else if (ch.isVoiceBased() && ch.members.size === 0) {
                    const { VoiceLifecycleService } = await Promise.resolve().then(() => __importStar(require("../services/voice-lifecycle.service")));
                    void VoiceLifecycleService.checkEmpty(ch).catch(() => { });
                }
            }
            for (const staleId of staleChannelIds) {
                this.remove(staleId);
            }
            if (staleChannelIds.length > 0) {
                logger_1.FastLogger.info(`Cleaned up ${staleChannelIds.length} stale voice sessions during startup reconciliation.`);
            }
        }
        catch (err) {
            logger_1.FastLogger.error("Error during VoiceMemoryStore discord reconciliation", err);
        }
    }
    static sweepInterval = null;
    static startPeriodicSweep(client, intervalMs = 180_000) {
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
        }
        this.sweepInterval = setInterval(() => {
            void this.reconcileWithDiscord(client);
        }, intervalMs);
    }
    static stopPeriodicSweep() {
        if (this.sweepInterval) {
            clearInterval(this.sweepInterval);
            this.sweepInterval = null;
        }
    }
    static sync(channelId) {
        const session = this.channels.get(channelId);
        if (!session)
            return;
        persistence_worker_1.PersistenceWorkerQueue.dispatch({
            type: "UPDATE_ROOM",
            channelId,
            update: {
                ownerId: session.ownerId,
                coOwners: Array.from(session.coOwners),
                whitelist: Array.from(session.whitelist),
                isLocked: session.isLocked,
                isTextLocked: session.isTextLocked,
                isHidden: session.isHidden,
                antiAbuseEnabled: session.antiAbuseEnabled !== false
            }
        });
    }
}
exports.VoiceMemoryStore = VoiceMemoryStore;
