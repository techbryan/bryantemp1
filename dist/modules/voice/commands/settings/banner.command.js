"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bannerCommand = void 0;
const discord_js_1 = require("discord.js");
const user_profile_schema_1 = require("../../../../database/schemas/user-profile.schema");
const webhook_logger_1 = require("../../../../core/logger/webhook.logger");
const member_parser_1 = require("../../../../shared/utils/member-parser");
const usages_1 = require("../../../../shared/embeds/usages");
const theme_1 = require("../../../../core/config/theme");
const bot_developer_store_1 = require("../../../user/cache/bot-developer.store");
const safe_fetch_1 = require("../../../../shared/utils/safe-fetch");
exports.bannerCommand = {
    name: "banner",
    prefixAliases: ["banner", "setbanner", "mybanner", "custombanner", "pimage2"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        const userId = message.author.id;
        if (!guildId)
            return;
        const sub = args[0]?.toLowerCase();
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const starEmoji = "<a:white_stars:1547180877962944585>";
        const isBotDev = bot_developer_store_1.BotDeveloperStore.isDeveloper(message.author.id);
        if (sub === "list") {
            const bannerUsers = await user_profile_schema_1.UserProfileModel.find({
                guildId,
                $or: [{ equippedBannerUrl: { $exists: true, $ne: "" } }, { hasBannerAccess: true }]
            }).lean();
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            if (bannerUsers.length === 0) {
                container
                    .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Custom Voice Banners List__`))
                    .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                    .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> -# __No users have custom panel banners or access in this server.__\n\n- __Grant access using:__ \`.v banner allow @User\``))
                    .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            }
            else {
                container
                    .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${starEmoji} __Custom Voice Banners (${bannerUsers.length})__`))
                    .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
                for (const user of bannerUsers.slice(0, 15)) {
                    const userMention = `<@${user.userId}>`;
                    const hasEquipped = Boolean(user.equippedBannerUrl);
                    const bannerDisplay = hasEquipped
                        ? `[**\`Click to View Banner\`**](${user.equippedBannerUrl})`
                        : "*No banner set yet*";
                    const statusText = user.hasBannerAccess ? "Granted Access" : "Bot Developer";
                    container
                        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- **User :** ${userMention} (\`${user.userId}\`)\n- **Status :** \`${statusText}\`\n- **Banner :** ${bannerDisplay}`))
                        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
                }
            }
            await message.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container],
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "allow" || sub === "grant" || sub === "add") {
            if (!isBotDev) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Only Bot Owner & Developers can grant banner access")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 10);
            if (targets.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v banner allow @user`", "Example: `.v banner allow @User`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            for (const target of targets) {
                await user_profile_schema_1.UserProfileModel.updateOne({ userId: target.id, guildId }, { $set: { hasBannerAccess: true } }, { upsert: true });
            }
            const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
            const embed = await usages_1.Usages.executedAction(guildId, "Banner Access Granted", `**__Banner access has been granted to :__** ${mentions}\n> ⟢ They can now set their custom voice panel banner using \`.v banner <url | attach>\`.`);
            await message.reply({
                ...embed,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "revoke" || sub === "deny" || sub === "disallow") {
            if (!isBotDev) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Only Bot Owner & Developers can revoke banner access")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 10);
            if (targets.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v banner revoke @user`", "Example: `.v banner revoke @User`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            for (const target of targets) {
                await user_profile_schema_1.UserProfileModel.updateOne({ userId: target.id, guildId }, { $set: { hasBannerAccess: false } }, { upsert: true });
            }
            const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
            const embed = await usages_1.Usages.executedAction(guildId, "Banner Access Revoked", `**__Banner access has been revoked from :__** ${mentions}`);
            await message.reply({
                ...embed,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "reset" || sub === "remove" || sub === "clear") {
            await user_profile_schema_1.UserProfileModel.updateOne({ userId, guildId }, { $unset: { equippedBannerUrl: 1 } }, { upsert: true });
            const embed = await usages_1.Usages.executedAction(guildId, "Custom Banner Reset", "**__Your voice panel banner has been reset :__** Your voice rooms will now display the server default banner.");
            await message.reply({
                ...embed,
                allowedMentions: { parse: [] }
            });
            return;
        }
        const profile = await user_profile_schema_1.UserProfileModel.findOne({ userId, guildId });
        const hasAccess = profile?.hasBannerAccess || isBotDev;
        if (!hasAccess) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__Access Denied :__** You don't have permission to set a custom voice panel banner.\n> ⟢ Ask a Bot Developer to grant you access using \`.v banner allow @You\`.")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const attachment = message.attachments.first();
        const possibleUrl = args.find((a) => /^https?:\/\/.+/i.test(a));
        if (!attachment && !possibleUrl) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v banner <url | attach image/GIF>`", "Example: `.v banner https://example.com/banner.gif` or attach an image")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const imageUrl = attachment ? attachment.url : possibleUrl;
        if (!imageUrl)
            return;
        const processingMsg = await message.reply({
            ...(await usages_1.Usages.executedAction(guildId, "Processing Banner", "**__Uploading your custom banner to Discord permanent CDN storage...__**")),
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
            const filename = `userbanner_${guildId}_${userId}.${ext}`;
            const permanentUrl = await webhook_logger_1.WebhookLogger.uploadImage(buffer, filename);
            const finalUrl = permanentUrl || imageUrl;
            await user_profile_schema_1.UserProfileModel.updateOne({ userId, guildId }, { $set: { equippedBannerUrl: finalUrl } }, { upsert: true });
            await processingMsg.edit({
                ...(await usages_1.Usages.executedAction(guildId, "Custom Banner Saved", `**__Your custom voice panel banner has been updated and is active!__**\n> ⟢ Saved to Database.\n> ⟢ To reset back to default: \`.v banner reset\`.`)),
                allowedMentions: { parse: [] }
            });
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            await processingMsg.edit({
                ...(await usages_1.Usages.impossible(guildId, `Error uploading banner: ${errorMessage}`)),
                allowedMentions: { parse: [] }
            });
        }
    }
};
