"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveVoiceModel = void 0;
const mongoose_1 = require("mongoose");
const ActiveVoiceSchema = new mongoose_1.Schema({
    channelId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    originalOwnerId: { type: String, required: true },
    coOwners: { type: [String], default: [] },
    whitelist: { type: [String], default: [] },
    isLocked: { type: Boolean, default: false },
    isTextLocked: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    antiAbuseEnabled: { type: Boolean, default: true }
});
ActiveVoiceSchema.index({ guildId: 1, ownerId: 1 });
exports.ActiveVoiceModel = (0, mongoose_1.model)("ActiveVoice", ActiveVoiceSchema);
