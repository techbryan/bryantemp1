"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalMusicBotModel = void 0;
const mongoose_1 = require("mongoose");
const GlobalMusicBotSchema = new mongoose_1.Schema({
    botId: { type: String, required: true, unique: true },
    prefix: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});
exports.GlobalMusicBotModel = (0, mongoose_1.model)("GlobalMusicBot", GlobalMusicBotSchema);
