"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsCommand = void 0;
exports.buildChannelInfoPayload = buildChannelInfoPayload;
const discord_js_1 = require("discord.js");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const theme_1 = require("../../../../core/config/theme");
async function buildChannelInfoPayload(channel, guildId) {
    const session = voice_store_1.VoiceMemoryStore.get(channel.id);
    const color = await theme_1.ThemeManager.getColor(guildId);
    const infoEmoji = usages_1.Usages.getActionEmoji("info", guildId);
    const ownerId = session ? session.ownerId : channel.guild.ownerId;
    const channelName = channel.name;
    const limitText = channel.userLimit === 0 ? "Unlimited" : channel.userLimit.toString();
    const createdTimestamp = channel.createdTimestamp || Date.now();
    const uptimeSeconds = Math.max(0, Math.floor((Date.now() - createdTimestamp) / 1000));
    const activeForText = usages_1.Usages.formatDuration(uptimeSeconds);
    const coOwnersCount = session?.coOwners ? session.coOwners.size : 0;
    const isHiddenText = session?.isHidden ? "Yes" : "No";
    const isLockedText = session?.isLocked ? "Yes" : "No";
    const block1 = `- **Owner** : <@${ownerId}>\n- **Name** : ${channelName}\n- **Limit** : \`${limitText}\``;
    const block2 = `- **Active For** : \`${activeForText}\`\n- **Co-Owners** : \`${coOwnersCount}/10\`\n- **Hidden** : \`${isHiddenText}\`\n- **Locked** : \`${isLockedText}\``;
    const block3 = `-# Enjoy For You Channel`;
    const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
    const container = new discord_js_1.ContainerBuilder();
    if (accentColor)
        container.setAccentColor(accentColor);
    container
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${infoEmoji} Channel Info`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(block1))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(block2))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(block3));
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [container]
    };
}
exports.statsCommand = {
    name: "info",
    prefixAliases: ["info", "channelinfo"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member instanceof discord_js_1.GuildMember ? member.voice.channel : null;
        const guildId = message.guildId;
        if (!guildId)
            return;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const payload = await buildChannelInfoPayload(channel, guildId);
        await message.reply({ ...payload, allowedMentions: { parse: [] } });
    }
};
