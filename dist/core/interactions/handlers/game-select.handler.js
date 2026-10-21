"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSelectHandler = void 0;
const discord_js_1 = require("discord.js");
const voice_auth_service_1 = require("../../../modules/voice/services/voice-auth.service");
const voice_store_1 = require("../../../modules/voice/cache/voice.store");
const guild_store_1 = require("../../../modules/voice/cache/guild.store");
const usages_1 = require("../../../shared/embeds/usages");
const theme_1 = require("../../config/theme");
const action_logger_1 = require("../../logger/action.logger");
const logger_1 = require("../../logger/logger");
class GameSelectHandler {
    static cooldowns = new Map();
    static COOLDOWN_MS = 15 * 60 * 1000;
    static async handle(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        const roleId = interaction.values[0];
        if (!roleId)
            return;
        let channel = member.voice.channel;
        if (!channel && interaction.channel && interaction.channel.isVoiceBased()) {
            channel = interaction.channel;
        }
        if (!channel) {
            const payload = await usages_1.Usages.notInVoice(guildId);
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            const payload = await usages_1.Usages.impossible(guildId, "This is not a managed temporary voice channel");
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
            const payload = await usages_1.Usages.impossible(guildId, "Only the channel owner can mention game roles");
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const now = Date.now();
        if (this.cooldowns.size > 200) {
            for (const [key, expires] of this.cooldowns) {
                if (now >= expires) {
                    this.cooldowns.delete(key);
                }
            }
        }
        const cooldownExpires = this.cooldowns.get(channel.id);
        if (cooldownExpires && now < cooldownExpires) {
            const remainingTotalSeconds = Math.ceil((cooldownExpires - now) / 1000);
            const minutes = Math.floor(remainingTotalSeconds / 60);
            const seconds = remainingTotalSeconds % 60;
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            const payload = await usages_1.Usages.impossible(guildId, `Wait until the game mention cooldown finishes (${timeStr}).`);
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        this.cooldowns.set(channel.id, now + this.COOLDOWN_MS);
        const config = await guild_store_1.GuildMemoryStore.resolve(guildId);
        const gameConfig = config?.games?.find((g) => g.roleId === roleId);
        const emojiPrefix = gameConfig?.emoji ? `${gameConfig.emoji} ` : "🎮 ";
        let gameImageUrl = null;
        if (gameConfig?.emoji) {
            const customEmojiMatch = gameConfig.emoji.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/);
            if (customEmojiMatch && customEmojiMatch[1]) {
                const emojiId = customEmojiMatch[1];
                const isAnimated = gameConfig.emoji.startsWith("<a:");
                gameImageUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? "gif" : "png"}?size=256&quality=lossless`;
            }
        }
        if (!gameImageUrl) {
            const roleObj = interaction.guild?.roles.cache.get(roleId);
            if (roleObj?.iconURL()) {
                gameImageUrl = roleObj.iconURL({ size: 256 }) || null;
            }
        }
        const color = await theme_1.ThemeManager.getColor(guildId);
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const container = new discord_js_1.ContainerBuilder();
        if (accentColor)
            container.setAccentColor(accentColor);
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${emojiPrefix}⌇ __Looking For Teammates..!!__`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        const infoContent = `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Player :__** <@${member.id}>\n` +
            `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Game :__** <@&${roleId}> ${gameConfig?.name ? `(\`${gameConfig.name}\`)` : ""}\n` +
            `> ⟢ <a:pink_Heartjump:1546859773721444382>・ **__Room :__** <#${channel.id}>`;
        if (gameImageUrl) {
            const section = new discord_js_1.SectionBuilder()
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(infoContent))
                .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(gameImageUrl));
            container.addSectionComponents(section);
        }
        else {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(infoContent));
        }
        container
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> ✦ ・ **__Click to join the channel and play together!__**`));
        await interaction.deferUpdate().catch(() => { });
        try {
            await channel.permissionOverwrites.edit(roleId, {
                ViewChannel: true
            }).catch((permError) => {
                logger_1.FastLogger.warn(`Failed to set ViewChannel on game mention: ${String(permError)}`);
            });
            await channel.send({
                allowedMentions: { roles: [roleId] },
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container]
            });
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to send game role mention message", err);
        }
        const roleName = interaction.guild?.roles.cache.get(roleId)?.name || roleId;
        action_logger_1.ActionLogger.logAction({
            guildId,
            executorId: member.id,
            action: "Game Role Mentioned",
            channelName: channel.name,
            details: `Role: \`@${roleName}\` (${roleId})`
        }).catch((logError) => {
            logger_1.FastLogger.warn(`Failed to log game role mention: ${String(logError)}`);
        });
    }
}
exports.GameSelectHandler = GameSelectHandler;
