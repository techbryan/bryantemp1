"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotVoicePersistModel = void 0;
const mongoose_1 = require("mongoose");
const BotVoicePersistSchema = new mongoose_1.Schema({
    botType: { type: String, required: true, unique: true, enum: ["main", "worker"] },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true }
}, { timestamps: true });
exports.BotVoicePersistModel = (0, mongoose_1.model)("BotVoicePersist", BotVoicePersistSchema);
