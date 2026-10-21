"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildConfigModel = void 0;
const mongoose_1 = require("mongoose");
const GuildConfigSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true },
    generatorId: { type: String, required: true },
    voiceChannelId: { type: String },
    categoryId: { type: String },
    logsChannelId: { type: String },
    rejectChannelId: { type: String },
    supportVoiceChannelId: { type: String },
    ticketTextChannelId: { type: String },
    defaultLimit: { type: Number, default: 0 },
    panelImageUrl: { type: String },
    nameTemplate: { type: String },
    channelNameTemplate: { type: String },
    defaultStatus: { type: String },
    defaultChannelStatus: { type: String },
    defaultVoiceStatus: { type: String },
    twoPanelsEnabled: { type: Boolean, default: false },
    games: [{
            name: { type: String, required: true },
            roleId: { type: String, required: true },
            emoji: { type: String }
        }]
});
GuildConfigSchema.index({ generatorId: 1 });
exports.GuildConfigModel = (0, mongoose_1.model)("GuildConfig", GuildConfigSchema);
