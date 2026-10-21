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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Replies = void 0;
const discord_js_1 = require("discord.js");
const theme_1 = require("../../core/config/theme");
const usages_1 = require("./usages");
class Replies {
    static async build(guildId, title, content) {
        const col = theme_1.ThemeManager.getColorSync(guildId);
        let accentHex = null;
        if (typeof col === "string" && col.startsWith("#"))
            accentHex = col;
        else if (typeof col === "number")
            accentHex = `#${col.toString(16).padStart(6, "0")}`;
        const parts = content ? [title, content] : [title];
        const container = (0, usages_1.createMultiContainer)(parts, accentHex);
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container],
            allowedMentions: { parse: [] }
        };
    }
    static async create(guildId, title, description) {
        const header = `## ${usages_1.Usages.getActionEmoji("info", guildId)} ${title}`;
        const body = description ? `- __${description}__  ⁘` : undefined;
        return this.build(guildId, header, body);
    }
    static async error(guildId, title, description) {
        const header = `## ${usages_1.Usages.getActionEmoji("reject", guildId)} ${title}`;
        const body = description ? `- __${description}__  ⁘` : undefined;
        return this.build(guildId, header, body);
    }
    static async success(guildId, title, description) {
        const header = `## ${usages_1.Usages.getActionEmoji("info", guildId)} ${title}`;
        const body = description ? `- __${description}__  ⁘` : undefined;
        return this.build(guildId, header, body);
    }
    static async notInVoice(guildId) {
        return usages_1.Usages.notInVoice(guildId);
    }
    static async notAuthorized(guildId) {
        return usages_1.Usages.notManagerOrOwner(guildId);
    }
    static async notOwner(guildId) {
        return usages_1.Usages.impossible(guildId, "Only the owner or co-owners can use this");
    }
}
exports.Replies = Replies;
__exportStar(require("./usages"), exports);
