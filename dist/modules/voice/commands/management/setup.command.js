"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupCommand = exports.SetupSessionStore = void 0;
exports.buildSetupPayload = buildSetupPayload;
const discord_js_1 = require("discord.js");
const usages_1 = require("../../../../shared/embeds/usages");
const theme_1 = require("../../../../core/config/theme");
const guild_store_1 = require("../../cache/guild.store");
class SetupSessionStore {
    static sessions = new Map();
    static get(guildId) {
        return this.sessions.get(guildId) || {};
    }
    static update(guildId, partial) {
        const existing = this.get(guildId);
        const updated = { ...existing, ...partial };
        this.sessions.set(guildId, updated);
        return updated;
    }
    static clear(guildId) {
        this.sessions.delete(guildId);
    }
}
exports.SetupSessionStore = SetupSessionStore;
function buildSetupPayload(guildId) {
    const color = theme_1.ThemeManager.getColorSync(guildId);
    const resolvedColor = color ? (0, discord_js_1.resolveColor)(color) : null;
    const container = new discord_js_1.ContainerBuilder();
    if (resolvedColor)
        container.setAccentColor(resolvedColor);
    const setupBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_modal:channels")
        .setLabel("Setup")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const supportBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_modal:support_channels")
        .setLabel("Support")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const nameBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_modal:nameplate")
        .setLabel("Name")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const statusBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_modal:status")
        .setLabel("Status")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const themeBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_btn:theme")
        .setLabel("Theme")
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    const config = guild_store_1.GuildMemoryStore.resolve(guildId);
    const isTwoPanels = config?.twoPanelsEnabled ?? false;
    const panelsBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId("setup_btn:toggle_panels")
        .setLabel(isTwoPanels ? "Two Panels: ON" : "Two Panels: OFF")
        .setStyle(isTwoPanels ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary));
    container
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${usages_1.Usages.getActionEmoji("info")} One Tap Creation`))
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__To Setup One Tap Click The Button__**`))
        .addActionRowComponents(setupBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__Set Ticket and Need Help Channels__**`))
        .addActionRowComponents(supportBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__Setup Creation NamePlate__**`))
        .addActionRowComponents(nameBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__Make a Custom Status In User Vc__**`))
        .addActionRowComponents(statusBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__Select Bot Theme & Accent__**`))
        .addActionRowComponents(themeBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
        .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> - **__Toggle Secondary Music & Activities Panel__**`))
        .addActionRowComponents(panelsBtnRow)
        .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [container]
    };
}
exports.setupCommand = {
    name: "setup",
    prefixAliases: ["setup"],
    async executePrefix(message, _args) {
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
        const payload = buildSetupPayload(guildId);
        await message.reply(payload);
    }
};
