"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupInteractionHandler = void 0;
const discord_js_1 = require("discord.js");
const guild_config_schema_1 = require("../../../database/schemas/guild-config.schema");
const guild_store_1 = require("../../../modules/voice/cache/guild.store");
const usages_1 = require("../../../shared/embeds/usages");
const webhook_logger_1 = require("../../logger/webhook.logger");
const safe_fetch_1 = require("../../../shared/utils/safe-fetch");
const default_assets_service_1 = require("../../services/default-assets.service");
const theme_command_1 = require("../../../modules/voice/commands/settings/theme.command");
const setup_command_1 = require("../../../modules/voice/commands/management/setup.command");
class SetupInteractionHandler {
    static async handleButton(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const guildId = interaction.guildId;
        if (!guildId)
            return;
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator permissions to use this")),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const customId = interaction.customId;
        if (customId === "setup_btn:toggle_panels") {
            const config = guild_store_1.GuildMemoryStore.resolve(guildId);
            const current = config?.twoPanelsEnabled ?? false;
            const next = !current;
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, { $set: { twoPanelsEnabled: next } }, { upsert: true }).exec();
            if (config) {
                config.twoPanelsEnabled = next;
                guild_store_1.GuildMemoryStore.set(guildId, config);
            }
            const updatedPayload = (0, setup_command_1.buildSetupPayload)(guildId);
            await interaction.update(updatedPayload).catch(async () => {
                await interaction.message.edit(updatedPayload).catch(() => { });
            });
            return;
        }
        if (customId === "setup_btn:theme") {
            const payload = await (0, theme_command_1.buildThemeSelectPayload)(guildId);
            await interaction.reply({
                ...payload,
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        if (customId === "setup_modal:support_channels") {
            try {
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId("setup_submit:support_channels")
                    .setTitle("Set Ticket & Need Help Channels")
                    .addLabelComponents(new discord_js_1.LabelBuilder()
                    .setLabel("Need Help Voice Channel")
                    .setDescription("Select voice channel for user voice assistance")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_support_voice")
                    .setPlaceholder("Select Need Help Voice Channel...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildVoice])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Ticket Text Channel")
                    .setDescription("Select text channel to open support tickets")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_ticket_text")
                    .setPlaceholder("Select Ticket Text Channel...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildText])
                    .setMinValues(1)
                    .setMaxValues(1)));
                await interaction.showModal(modal);
                return;
            }
            catch {
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId("setup_submit:support_channels")
                    .setTitle("Set Ticket & Need Help Channels")
                    .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                    .setCustomId("text_support_voice")
                    .setLabel("Need Help Voice Channel ID")
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setPlaceholder("Voice Channel ID")
                    .setRequired(false)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                    .setCustomId("text_ticket_text")
                    .setLabel("Ticket Text Channel ID")
                    .setStyle(discord_js_1.TextInputStyle.Short)
                    .setPlaceholder("Text Channel ID")
                    .setRequired(false)));
                await interaction.showModal(modal);
                return;
            }
        }
        if (customId === "setup_modal:channels") {
            try {
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId("setup_submit:channels")
                    .setTitle("Channels Configuration")
                    .addLabelComponents(new discord_js_1.LabelBuilder()
                    .setLabel("Join To Create Voice Channel")
                    .setDescription("Select the main generator voice channel")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_generator")
                    .setPlaceholder("Select Generator Voice Channel...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildVoice])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Category For Temporary Rooms")
                    .setDescription("Select category to place created temp rooms")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_category")
                    .setPlaceholder("Select Category (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildCategory])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Logs Text Channel")
                    .setDescription("Select channel where room logs will be sent")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_logs")
                    .setPlaceholder("Select Logs Channel (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildText])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Rejected Voice Channel")
                    .setDescription("Select channel to move rejected users to")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_reject")
                    .setPlaceholder("Select Rejected Channel (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildVoice])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Panel Banner Image (Optional)")
                    .setDescription("Drop custom image or leave empty for default")
                    .setFileUploadComponent(new discord_js_1.FileUploadBuilder()
                    .setCustomId("setup_panelimage_file")
                    .setRequired(false)));
                await interaction.showModal(modal);
                return;
            }
            catch {
                const modal = new discord_js_1.ModalBuilder()
                    .setCustomId("setup_submit:channels")
                    .setTitle("Channels Configuration")
                    .addLabelComponents(new discord_js_1.LabelBuilder()
                    .setLabel("Join To Create Voice Channel")
                    .setDescription("Select the main generator voice channel")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_generator")
                    .setPlaceholder("Select Generator Voice Channel...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildVoice])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Category For Temporary Rooms")
                    .setDescription("Select category to place created temp rooms")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_category")
                    .setPlaceholder("Select Category (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildCategory])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Logs Text Channel")
                    .setDescription("Select channel where room logs will be sent")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_logs")
                    .setPlaceholder("Select Logs Channel (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildText])
                    .setMinValues(1)
                    .setMaxValues(1)), new discord_js_1.LabelBuilder()
                    .setLabel("Rejected Voice Channel")
                    .setDescription("Select channel to move rejected users to")
                    .setChannelSelectMenuComponent(new discord_js_1.ChannelSelectMenuBuilder()
                    .setCustomId("setup_reject")
                    .setPlaceholder("Select Rejected Channel (or None)...")
                    .setChannelTypes([discord_js_1.ChannelType.GuildVoice])
                    .setMinValues(1)
                    .setMaxValues(1)));
                await interaction.showModal(modal);
                return;
            }
        }
        if (customId === "setup_modal:nameplate") {
            const config = guild_store_1.GuildMemoryStore.resolve(guildId);
            const currentTemplate = config?.nameTemplate || "{username}'s Room";
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("setup_submit:nameplate")
                .setTitle("Setup Creation NamePlate")
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId("name_template")
                .setLabel("Channel Name Template")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(currentTemplate)
                .setPlaceholder("{username}'s Room | {user} Vc")
                .setMaxLength(100)
                .setRequired(true)));
            await interaction.showModal(modal);
            return;
        }
        if (customId === "setup_modal:status") {
            const config = guild_store_1.GuildMemoryStore.resolve(guildId);
            const currentStatus = config?.defaultStatus || "";
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId("setup_submit:status")
                .setTitle("Custom Status In User Vc")
                .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                .setCustomId("default_status")
                .setLabel("Voice Status Pattern")
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setValue(currentStatus)
                .setPlaceholder("Best {server} | Chilling with {username}")
                .setMaxLength(500)
                .setRequired(false)));
            await interaction.showModal(modal);
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
        if (!member.permissions.has(discord_js_1.PermissionFlagsBits.Administrator)) {
            await interaction.reply({
                ...(await usages_1.Usages.impossible(guildId, "You need Administrator permissions to use this")),
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral
            });
            return;
        }
        const customId = interaction.customId;
        if (["setup_submit:support_channels", "setup_submit:channels", "setup_submit:nameplate", "setup_submit:status"].includes(customId)) {
            await interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral | discord_js_1.MessageFlags.IsComponentsV2 });
        }
        if (customId === "setup_submit:support_channels") {
            let supportVoiceChannelId = "";
            let ticketTextChannelId = "";
            try {
                const supportChannels = interaction.fields.getSelectedChannels?.("setup_support_voice");
                if (supportChannels && supportChannels.size > 0)
                    supportVoiceChannelId = supportChannels.first()?.id ?? "";
            }
            catch { }
            try {
                const ticketChannels = interaction.fields.getSelectedChannels?.("setup_ticket_text");
                if (ticketChannels && ticketChannels.size > 0)
                    ticketTextChannelId = ticketChannels.first()?.id ?? "";
            }
            catch { }
            if (!supportVoiceChannelId) {
                try {
                    supportVoiceChannelId = interaction.fields.getTextInputValue("text_support_voice")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            if (!ticketTextChannelId) {
                try {
                    ticketTextChannelId = interaction.fields.getTextInputValue("text_ticket_text")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            const setFields = { guildId };
            const unsetFields = {};
            if (supportVoiceChannelId)
                setFields.supportVoiceChannelId = supportVoiceChannelId;
            else
                unsetFields.supportVoiceChannelId = 1;
            if (ticketTextChannelId)
                setFields.ticketTextChannelId = ticketTextChannelId;
            else
                unsetFields.ticketTextChannelId = 1;
            const updateQuery = { $set: setFields };
            if (Object.keys(unsetFields).length > 0) {
                updateQuery.$unset = unsetFields;
            }
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, updateQuery, { upsert: true }).exec();
            const existing = guild_store_1.GuildMemoryStore.resolve(guildId) || { guildId, defaultLimit: 0, generatorId: "" };
            Object.assign(existing, setFields);
            if (!supportVoiceChannelId)
                delete existing.supportVoiceChannelId;
            if (!ticketTextChannelId)
                delete existing.ticketTextChannelId;
            guild_store_1.GuildMemoryStore.set(guildId, existing);
            const helpChannelText = supportVoiceChannelId ? `<#${supportVoiceChannelId}>` : "`None`";
            const ticketChannelText = ticketTextChannelId ? `<#${ticketTextChannelId}>` : "`None`";
            const embed = await usages_1.Usages.executedAction(guildId, "Support Setup", `Need Help Voice Channel  : ${helpChannelText}\nTicket Text Channel  : ${ticketChannelText}`);
            await interaction.editReply({
                ...embed,
            });
            return;
        }
        if (customId === "setup_submit:channels") {
            let generatorId = "";
            let categoryId = "";
            let logsChannelId = "";
            let rejectChannelId = "";
            try {
                const genChannels = interaction.fields.getSelectedChannels?.("setup_generator");
                if (genChannels && genChannels.size > 0)
                    generatorId = genChannels.first()?.id ?? "";
            }
            catch { }
            try {
                const catChannels = interaction.fields.getSelectedChannels?.("setup_category");
                if (catChannels && catChannels.size > 0)
                    categoryId = catChannels.first()?.id ?? "";
            }
            catch { }
            try {
                const logChannels = interaction.fields.getSelectedChannels?.("setup_logs");
                if (logChannels && logChannels.size > 0)
                    logsChannelId = logChannels.first()?.id ?? "";
            }
            catch { }
            try {
                const rejChannels = interaction.fields.getSelectedChannels?.("setup_reject");
                if (rejChannels && rejChannels.size > 0)
                    rejectChannelId = rejChannels.first()?.id ?? "";
            }
            catch { }
            if (!generatorId) {
                try {
                    generatorId = interaction.fields.getTextInputValue("text_generator")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            if (!categoryId) {
                try {
                    categoryId = interaction.fields.getTextInputValue("text_category")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            if (!logsChannelId) {
                try {
                    logsChannelId = interaction.fields.getTextInputValue("text_logs")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            if (!rejectChannelId) {
                try {
                    rejectChannelId = interaction.fields.getTextInputValue("text_reject")?.trim().replace(/[<#>]/g, "") || "";
                }
                catch { }
            }
            if (!generatorId) {
                await interaction.editReply({
                    ...(await usages_1.Usages.impossible(guildId, "Join-To-Create channel is required")),
                });
                return;
            }
            let buffer = null;
            let uploadExt = "png";
            try {
                const files = interaction.fields.getUploadedFiles?.("setup_panelimage_file");
                if (files && files.size > 0) {
                    const file = files.first();
                    if (file?.url) {
                        const fetchRes = await (0, safe_fetch_1.safeFetchImage)(file.url);
                        buffer = fetchRes.buffer;
                        uploadExt = fetchRes.extension || "png";
                    }
                }
            }
            catch { }
            let panelImageUrl = undefined;
            if (buffer) {
                const uploadedUrl = await webhook_logger_1.WebhookLogger.uploadImage(buffer, `panel_${guildId}.${uploadExt}`);
                panelImageUrl = uploadedUrl || undefined;
            }
            if (!panelImageUrl) {
                const defaultImg = await default_assets_service_1.DefaultAssetService.getDefaultPanelImageUrl();
                if (defaultImg) {
                    panelImageUrl = defaultImg;
                }
            }
            const setFields = {
                guildId,
                generatorId,
                defaultLimit: 0
            };
            const unsetFields = {};
            if (categoryId)
                setFields.categoryId = categoryId;
            else
                unsetFields.categoryId = 1;
            if (logsChannelId)
                setFields.logsChannelId = logsChannelId;
            else
                unsetFields.logsChannelId = 1;
            if (rejectChannelId)
                setFields.rejectChannelId = rejectChannelId;
            else
                unsetFields.rejectChannelId = 1;
            if (panelImageUrl)
                setFields.panelImageUrl = panelImageUrl;
            const updateQuery = { $set: setFields };
            if (Object.keys(unsetFields).length > 0) {
                updateQuery.$unset = unsetFields;
            }
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, updateQuery, { upsert: true }).exec();
            const existing = guild_store_1.GuildMemoryStore.resolve(guildId) || { guildId, defaultLimit: 0, generatorId };
            Object.assign(existing, setFields);
            if (!categoryId)
                delete existing.categoryId;
            if (!logsChannelId)
                delete existing.logsChannelId;
            if (!rejectChannelId)
                delete existing.rejectChannelId;
            guild_store_1.GuildMemoryStore.set(guildId, existing);
            const embed = await usages_1.Usages.executedAction(guildId, "Setup", `**__One Tap Channels Configured :__**\n- **Join-To-Create:** <#${generatorId}>\n- **Category:** ${categoryId ? `<#${categoryId}>` : "`None`"}\n- **Logs Channel:** ${logsChannelId ? `<#${logsChannelId}>` : "`None`"}\n- **Reject Channel:** ${rejectChannelId ? `<#${rejectChannelId}>` : "`None`"}\n- **Panel Image:** ${panelImageUrl ? "[`Active Banner Image`](" + panelImageUrl + ")" : "`Default Aesthetic Banner`"}`);
            await interaction.editReply({
                ...embed,
            });
            return;
        }
        if (customId === "setup_submit:nameplate") {
            const template = interaction.fields.getTextInputValue("name_template").trim();
            const sanitized = usages_1.Usages.sanitize(template).slice(0, 100);
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, { $set: { nameTemplate: sanitized } }, { upsert: true }).exec();
            const existing = guild_store_1.GuildMemoryStore.resolve(guildId);
            if (existing)
                existing.nameTemplate = sanitized;
            const preview = sanitized
                .replace(/{username}/gi, member.displayName || "User")
                .replace(/{user}/gi, member.user.username)
                .replace(/{server}/gi, interaction.guild?.name || "Server");
            const embed = await usages_1.Usages.executedAction(guildId, "NamePlate Setup", `**__Channel Name Template Saved :__**\n- **Pattern:** \`${sanitized}\`\n- **Preview:** \`${preview}\``);
            await interaction.editReply({
                ...embed,
            });
            return;
        }
        if (customId === "setup_submit:status") {
            const rawStatus = interaction.fields.getTextInputValue("default_status")?.trim() || "";
            const sanitized = usages_1.Usages.sanitize(rawStatus).slice(0, 500);
            await guild_config_schema_1.GuildConfigModel.updateOne({ guildId }, { $set: { defaultStatus: sanitized } }, { upsert: true }).exec();
            const existing = guild_store_1.GuildMemoryStore.resolve(guildId);
            if (existing)
                existing.defaultStatus = sanitized;
            const preview = sanitized
                .replace(/{username}/gi, member.displayName || "User")
                .replace(/{user}/gi, member.user.username)
                .replace(/{server}/gi, interaction.guild?.name || "Server");
            const embed = await usages_1.Usages.executedAction(guildId, "Custom Status Setup", sanitized
                ? `**__Default Voice Status Saved :__**\n- **Pattern:** ${sanitized}\n- **Preview:** ${preview}`
                : "**__Default Voice Status has been cleared.__**");
            await interaction.editReply({
                ...embed,
            });
            return;
        }
    }
}
exports.SetupInteractionHandler = SetupInteractionHandler;
