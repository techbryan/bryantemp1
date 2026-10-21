"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildThemeModel = void 0;
const mongoose_1 = require("mongoose");
const GuildThemeSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true },
    embedColor: { type: String, default: "#5865F2" }
});
exports.GuildThemeModel = (0, mongoose_1.model)("GuildTheme", GuildThemeSchema);
