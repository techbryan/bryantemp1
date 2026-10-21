"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panelimageCommand = void 0;
const discord_js_1 = require("discord.js");
const guild_config_schema_1 = require("../../../../database/schemas/guild-config.schema");
const guild_store_1 = require("../../cache/guild.store");
const webhook_logger_1 = require("../../../../core/logger/webhook.logger");
const usages_1 = require("../../../../shared/embeds/usages");
const safe_fetch_1 = require("../../../../shared/utils/safe-fetch");
exports.panelimageCommand = {
    name: "panelimage",
    prefixAliases: ["panelimage", "pimage", "setimage"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        if (!message.member?.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator permissions to use this")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const sub = args[0]?.toLowerCase();
        if (sub === "reset" || sub === "remove" || sub === "clear") {
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, { $unset: { panelImageUrl: 1 } }).exec();
            const cfg = await guild_store_1.GuildMemoryStore.resolve(guildId);
            if (cfg) {
                delete cfg.panelImageUrl;
            }
            guild_store_1.GuildMemoryStore.purge(guildId);
            const embed = await usages_1.Usages.executedAction(guildId, "Panel Image", "Panel image has been removed. The voice panel will now show without a custom image.");
            await message.reply({
                ...embed,
                allowedMentions: { parse: [] }
            });
            return;
        }
        const attachment = message.attachments.first();
        const possibleUrl = args.find((a) => /^https?:\/\/.+/i.test(a));
        if (!attachment && !possibleUrl) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v panelimage`", "<attach media | url>")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const imageUrl = attachment ? attachment.url : possibleUrl;
        if (!imageUrl)
            return;
        const processingMsg = await message.reply({
            ...(await usages_1.Usages.executedAction(guildId, "Panel Image", "Uploading your image to storage...")),
            allowedMentions: { parse: [] }
        });
        try {
            const fetchRes = await (0, safe_fetch_1.safeFetchImage)(imageUrl);
            const buffer = fetchRes.buffer;
            let ext = fetchRes.extension || "png";
            if (attachment?.name) {
                const attachExt = attachment.name.split(".").pop();
                if (attachExt)
                    ext = attachExt;
            }
            const filename = `panel_${guildId}.${ext}`;
            const permanentUrl = await webhook_logger_1.WebhookLogger.uploadImage(buffer, filename);
            const finalUrl = permanentUrl || imageUrl;
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, { $set: { panelImageUrl: finalUrl } }, { upsert: false }).exec();
            guild_store_1.GuildMemoryStore.purge(guildId);
            await processingMsg.edit(await usages_1.Usages.executedAction(guildId, "Panel Image", "Panel image has been updated and is now active for voice panels in this server."));
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            await processingMsg.edit({
                ...(await usages_1.Usages.impossible(guildId, `Error uploading image: ${errorMessage}`)),
            });
        }
    }
};
