"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeInteractionHandler = void 0;
const discord_js_1 = require("discord.js");
const theme_1 = require("../../config/theme");
const usages_1 = require("../../../shared/embeds/usages");
const theme_command_1 = require("../../../modules/voice/commands/settings/theme.command");
class ThemeInteractionHandler {
    static async handleButton(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator or Manage Server permissions to change the theme")),
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const customId = interaction.customId;
        if (customId.startsWith("theme:preset:")) {
            const hex = customId.replace("theme:preset:", "").trim();
            const preset = theme_command_1.THEME_PRESETS.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
            await theme_1.ThemeManager.setColor(guildId, hex);
            const embed = await usages_1.Usages.executedAction(guildId, "Theme Updated", `**__Server accent theme color has been set to \`${hex.toUpperCase()}\`${preset ? ` (${preset.name})` : ""} :__**`);
            const refreshedPayload = await (0, theme_command_1.buildThemeSelectPayload)(guildId);
            await interaction.update({
                ...refreshedPayload
            }).catch(async () => {
                await interaction.reply({ ...embed, flags: discord_js_1.MessageFlags.Ephemeral });
            });
            return;
        }
        if (customId === "theme:custom_hex") {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("theme:custom_hex_modal")
                .setTitle("Set Custom Theme Color")
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId("hex_input")
                .setLabel("Hex Color Code (#000000 - #FFFFFF)")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setPlaceholder("#00CCDF or #3949FF")
                .setMinLength(3)
                .setMaxLength(7)
                .setRequired(true)));
            await interaction.showModal(modal);
            return;
        }
    }
    static async handleSelectMenu(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator or Manage Server permissions to change the theme")),
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (interaction.customId === "theme:select_color") {
            const selectedHex = interaction.values[0];
            if (!selectedHex)
                return;
            const oldColor = (await theme_1.ThemeManager.getColor(guildId)) || "#a6c9cb";
            const oldPreset = theme_command_1.THEME_PRESETS.find((p) => p.hex.toLowerCase() === oldColor.toString().toLowerCase());
            const preset = theme_command_1.THEME_PRESETS.find((p) => p.hex.toLowerCase() === selectedHex.toLowerCase());
            const emojiOfColor = preset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
            const oldEmoji = oldPreset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
            await theme_1.ThemeManager.setColor(guildId, selectedHex);
            const colorInt = theme_1.ThemeManager.isValidHex(selectedHex) ? (0, discord_js_1.resolveColor)(selectedHex.startsWith("#") ? selectedHex : `#${selectedHex}`) : null;
            const container = new discord_js_1.ContainerBuilder();
            if (colorInt)
                container.setAccentColor(colorInt);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${emojiOfColor} ⌇ __System Color Updated..!!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> ⟢ ${oldEmoji}・ **__Old Color :__** \`${oldColor.toString().toUpperCase()}\` *(${oldPreset?.name || "Previous"})\*\n> ⟢ ${emojiOfColor}・ **__New Color :__** \`${selectedHex.toUpperCase()}\` *(${preset?.name || "Active"})\*`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> ✦ ・ **__All voice panel interfaces and control button animations have synchronized to \`${preset?.name || selectedHex.toUpperCase()}\`!__**`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.update({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container]
            }).catch(() => { });
            return;
        }
    }
    static async handleModal(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator) && !member.permissions.has(discord_js_1.PermissionFlagsBits.ManageGuild)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator or Manage Server permissions to change the theme")),
                flags: discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (interaction.customId === "theme:custom_hex_modal") {
            const rawHex = interaction.fields.getTextInputValue("hex_input").trim();
            if (!theme_1.ThemeManager.isValidHex(rawHex)) {
                await interaction.reply({
                    ...(await usages_1.Usages.impossible(guildId, "Invalid hex color format. Please enter a valid hex code (e.g. #00CCDF)")),
                    flags: discord_js_1.MessageFlags.Ephemeral
                });
                return;
            }
            const formatted = rawHex.startsWith("#") ? rawHex : `#${rawHex}`;
            const oldColor = (await theme_1.ThemeManager.getColor(guildId)) || "#a6c9cb";
            const oldPreset = theme_command_1.THEME_PRESETS.find((p) => p.hex.toLowerCase() === oldColor.toString().toLowerCase());
            const preset = theme_command_1.THEME_PRESETS.find((p) => p.hex.toLowerCase() === formatted.toLowerCase());
            const emojiOfColor = preset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
            const oldEmoji = oldPreset?.emoji || "<a:anim_sparkle_85:1546687452079722506>";
            await theme_1.ThemeManager.setColor(guildId, formatted);
            const colorInt = (0, discord_js_1.resolveColor)(formatted);
            const container = new discord_js_1.ContainerBuilder()
                .setAccentColor(colorInt)
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${emojiOfColor} ⌇ __System Color Updated..!!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> ⟢ ${oldEmoji}・ **__Old Color :__** \`${oldColor.toString().toUpperCase()}\` *(${oldPreset?.name || "Previous"})\*\n> ⟢ ${emojiOfColor}・ **__New Color :__** \`${formatted.toUpperCase()}\` *(${preset?.name || "Active"})\*`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> ✦ ・ **__All voice panel interfaces and control button animations have synchronized to \`${preset?.name || formatted.toUpperCase()}\`!__**`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [container]
            }).catch(() => { });
            return;
        }
    }
}
exports.ThemeInteractionHandler = ThemeInteractionHandler;
