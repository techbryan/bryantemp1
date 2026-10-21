"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookLogger = void 0;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
class WebhookLogger {
    static client = null;
    static getClient() {
        if (this.client)
            return this.client;
        if (env_1.ENV.WEBHOOK_LOG_URL && env_1.ENV.WEBHOOK_LOG_URL.startsWith("http")) {
            try {
                this.client = new discord_js_1.WebhookClient({ url: env_1.ENV.WEBHOOK_LOG_URL });
            }
            catch {
                this.client = null;
            }
        }
        return this.client;
    }
    static async log(title, description, color) {
        const webhook = this.getClient();
        if (!webhook)
            return;
        try {
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();
            await webhook.send({ embeds: [embed] });
        }
        catch (error) {
            console.error("Failed to deliver webhook log", error);
        }
    }
    static async logError(errorTitle, error) {
        const message = error instanceof Error ? error.stack || error.message : String(error);
        await this.log(`Bot Error: ${errorTitle}`, `\`\`\`\n${message.slice(0, 4000)}\n\`\`\``, 0xff0000);
    }
    static async logGuildJoin(guildName, guildId, memberCount, ownerId) {
        await this.log(`📥 Joined Server: ${guildName}`, `- **Server ID:** \`${guildId}\`\n- **Owner:** <@${ownerId}> (\`${ownerId}\`)\n- **Members:** \`${memberCount}\``, 0x00ff00);
    }
    static async uploadImage(buffer, filename) {
        const webhook = this.getClient();
        if (!webhook)
            return null;
        try {
            const attachment = new discord_js_1.AttachmentBuilder(buffer, { name: filename });
            const messageResult = await webhook.send({ files: [attachment] });
            if (!messageResult || typeof messageResult !== "object") {
                return null;
            }
            if ("attachments" in messageResult) {
                const rawAttachments = messageResult.attachments;
                if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
                    const firstAttachment = rawAttachments[0];
                    if (firstAttachment && typeof firstAttachment === "object" && "url" in firstAttachment && typeof firstAttachment.url === "string") {
                        return firstAttachment.url;
                    }
                }
                if (rawAttachments && typeof rawAttachments === "object" && "values" in rawAttachments && typeof rawAttachments.values === "function") {
                    const firstAttachment = rawAttachments.values().next().value;
                    if (firstAttachment && typeof firstAttachment === "object" && "url" in firstAttachment && typeof firstAttachment.url === "string") {
                        return firstAttachment.url;
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error("Failed to upload image via webhook", error);
            return null;
        }
    }
    static async logGuildLeave(guildName, guildId, memberCount) {
        await this.log(`Left Server: ${guildName}`, `- **Server ID:** \`${guildId}\`\n- **Members at departure:** \`${memberCount}\``, 0xffaa00);
    }
}
exports.WebhookLogger = WebhookLogger;
