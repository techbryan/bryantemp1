"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanelBuilder = void 0;
const discord_js_1 = require("discord.js");
const theme_1 = require("../config/theme");
const guild_store_1 = require("../../modules/voice/cache/guild.store");
const user_profile_store_1 = require("../../modules/user/cache/user-profile.store");
const default_assets_service_1 = require("../services/default-assets.service");
class PanelBuilder {
    static getPanelRow1(guildId) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("modal_open:rename").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "rename")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("btn:lock").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "lock")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("btn:unlock").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "unlock")).setStyle(discord_js_1.ButtonStyle.Secondary));
    }
    static getPanelRow2(guildId) {
        return new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId("btn:hide").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "hide")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("btn:unhide").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "unhide")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("modal_open:limit").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "limit")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("btn:antiabuse").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "antiabuse")).setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder().setCustomId("btn:info").setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "info")).setStyle(discord_js_1.ButtonStyle.Secondary));
    }
    static async createPanel(guildId, memberId) {
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const guildConfig = guild_store_1.GuildMemoryStore.resolve(guildId);
        let panelImageUrl = guildConfig?.panelImageUrl;
        if (memberId) {
            const profile = user_profile_store_1.UserProfileStore.getSync(memberId, guildId) || await user_profile_store_1.UserProfileStore.get(memberId, guildId);
            if (profile?.equippedBannerUrl) {
                panelImageUrl = profile.equippedBannerUrl;
            }
        }
        if (!panelImageUrl) {
            panelImageUrl = default_assets_service_1.DefaultAssetService.getDefaultPanelImageSync() || (await default_assets_service_1.DefaultAssetService.getDefaultPanelImageUrl()) || undefined;
        }
        const resolvedColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const container = new discord_js_1.ContainerBuilder();
        if (resolvedColor)
            container.setAccentColor(resolvedColor);
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## __**<@${memberId}> Enjoy**__`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        if (panelImageUrl) {
            container.addMediaGalleryComponents(new discord_js_1.MediaGalleryBuilder().addItems(new discord_js_1.MediaGalleryItemBuilder().setURL(panelImageUrl)));
            container.addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        }
        const supportBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("btn:need_help")
            .setLabel("Need Help")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const ticketBtnRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("btn:ticket")
            .setLabel("Ticket")
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`✦ ・ For voice assistance, join a support voice channel`))
            .addActionRowComponents(supportBtnRow)
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`✦ ・ To report any issues on the server, please open a ticket.`))
            .addActionRowComponents(ticketBtnRow)
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(this.getPanelRow1(guildId))
            .addActionRowComponents(this.getPanelRow2(guildId))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`-# Enjoy your voice channel`));
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container]
        };
    }
    static async createExtraPanel(guildId) {
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const extraEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, "extra");
        const muteRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("modal_open:mute")
            .setLabel("Mute")
            .setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "mute"))
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId("modal_open:deafen")
            .setLabel("Deafen")
            .setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "deafen"))
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const rejectRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("modal_open:temp_reject")
            .setLabel("Temp Reject")
            .setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "tempreject"))
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId("btn:random_reject")
            .setLabel("Random Reject")
            .setEmoji(theme_1.ThemeManager.getThemeEmoji(guildId, "randomreject"))
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const container = new discord_js_1.ContainerBuilder();
        if (accentColor)
            container.setAccentColor(accentColor);
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${extraEmoji} Extra Voice Features`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Voice Moderation Tools: Mute or deafen members inside your voice room__  ⁘`))
            .addActionRowComponents(muteRow)
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Advanced Rejection Tools: Temporarily or randomly remove users__  ⁘`))
            .addActionRowComponents(rejectRow);
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container]
        };
    }
    static async createMusicActivityPanel(guildId) {
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const resolvedColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const musicEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, "music");
        const activityEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, "activity");
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("btn:music_get")
            .setLabel("Get.B")
            .setEmoji(musicEmoji)
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId("btn:activity_launch")
            .setLabel("Launch.A")
            .setEmoji(activityEmoji)
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        const container = new discord_js_1.ContainerBuilder();
        if (resolvedColor)
            container.setAccentColor(resolvedColor);
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## <a:anim_extra_cb:1546633992030265507> Music & Activities`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Click the first button to get a music bot, or the second button to launch a voice activity__  ⁘`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(actionRow)
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container]
        };
    }
    static async createFullPanelPayload(guildId, memberId) {
        const config = guild_store_1.GuildMemoryStore.resolve(guildId) ?? await guild_store_1.GuildMemoryStore.resolveAsync(guildId);
        const panelPayload = await this.createPanel(guildId, memberId);
        if (config?.twoPanelsEnabled) {
            const musicActivityPayload = await this.createMusicActivityPanel(guildId);
            return {
                flags: discord_js_1.MessageFlags.IsComponentsV2,
                components: [
                    ...panelPayload.components,
                    ...musicActivityPayload.components
                ],
                allowedMentions: { parse: [] }
            };
        }
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: panelPayload.components,
            allowedMentions: { parse: [] }
        };
    }
}
exports.PanelBuilder = PanelBuilder;
