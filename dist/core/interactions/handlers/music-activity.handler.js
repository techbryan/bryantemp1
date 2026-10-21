"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MusicActivityHandler = void 0;
const discord_js_1 = require("discord.js");
const theme_1 = require("../../config/theme");
const global_music_bot_schema_1 = require("../../../database/schemas/global-music-bot.schema");
const logger_1 = require("../../logger/logger");
class MusicActivityHandler {
    static STAR_EMOJI = "<a:white_stars:1547180877962944585>";
    static WAIT_EMOJI = "<a:gh1y1ne:1546859779333292103>";
    static cachedBots = [];
    static lastBotFetch = 0;
    static async getMusicBots() {
        const now = Date.now();
        if (this.cachedBots.length > 0 && now - this.lastBotFetch < 60_000) {
            return this.cachedBots;
        }
        try {
            this.cachedBots = await global_music_bot_schema_1.GlobalMusicBotModel.find().lean();
            this.lastBotFetch = now;
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to fetch global music bots", err);
            if (this.cachedBots.length === 0)
                return [];
        }
        return this.cachedBots;
    }
    static ACTIVITIES = [
        {
            label: "YouTube Together",
            value: "youtube_together",
            description: "Watch YouTube videos with friends in voice",
            appId: "755600276941176913"
        },
        {
            label: "Watch Together",
            value: "watch_together",
            description: "Stream and watch videos together",
            appId: "755600276941176913"
        },
        {
            label: "Poker Night",
            value: "poker_night",
            description: "Play Texas Hold'em poker in voice chat",
            appId: "755827207812677713"
        },
        {
            label: "Checkers in the Park",
            value: "checkers_in_the_park",
            description: "Play classic board games with friends in voice",
            appId: "832013003968348200"
        },
        {
            label: "SpellCast",
            value: "spellcast",
            description: "Word puzzle and spellcasting battle with friends",
            appId: "852509694341283871"
        },
        {
            label: "Blazing 8s",
            value: "blazing_8s",
            description: "Fast-paced classic card game for everyone",
            appId: "832025144389533716"
        },
        {
            label: "Land-io",
            value: "land_io",
            description: "Territory conquest multiplayer game in voice",
            appId: "903769130790969345"
        }
    ];
    static async handleMusicGet(interaction) {
        const guildId = interaction.guildId;
        if (!guildId || !interaction.guild) {
            await interaction.reply({
                content: "This command can only be used in a server.",
                flags: discord_js_1.MessageFlags.Ephemeral
            }).catch((replyError) => {
                logger_1.FastLogger.warn(`Failed to send music get error: ${String(replyError)}`);
            });
            return;
        }
        const color = theme_1.ThemeManager.getColorSync(guildId);
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const allBots = await this.getMusicBots();
        let foundBotMember = null;
        let foundBotConfig = null;
        if (allBots.length > 0) {
            for (const bot of allBots) {
                const cached = interaction.guild.members.cache.get(bot.botId);
                if (cached) {
                    foundBotMember = cached;
                    foundBotConfig = bot;
                    break;
                }
            }
            if (!foundBotMember) {
                for (const bot of allBots) {
                    const fetched = await interaction.guild.members.fetch(bot.botId).catch(() => null);
                    if (fetched) {
                        foundBotMember = fetched;
                        foundBotConfig = bot;
                        break;
                    }
                }
            }
        }
        const container = new discord_js_1.ContainerBuilder();
        if (accentColor)
            container.setAccentColor(accentColor);
        if (foundBotMember && foundBotConfig) {
            const botName = foundBotMember.user.username;
            const avatarUrl = foundBotMember.user.displayAvatarURL({ extension: "png", size: 256 });
            const textSection = new discord_js_1.SectionBuilder()
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`### __${botName} is here to play music for you__\n> **__Type \`${foundBotConfig.prefix}\` to start listening to music.__**`));
            if (avatarUrl) {
                textSection.setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(avatarUrl));
            }
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${this.STAR_EMOJI}  __I Found a Bot For You!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addSectionComponents(textSection)
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        }
        else {
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# __Oops!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> -# __No registered global music bot was found in this server.__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Ask an administrator to add one using \`.v music add @Bot <prefix>\`.__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
        }
        await interaction.reply({
            flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
            components: [container]
        }).catch((replyError) => {
            logger_1.FastLogger.warn(`Failed to send music reply: ${String(replyError)}`);
        });
    }
    static async handleActivityLaunch(interaction) {
        const guildId = interaction.guildId;
        const color = guildId ? theme_1.ThemeManager.getColorSync(guildId) : null;
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const activityEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, "activity");
        const container = new discord_js_1.ContainerBuilder();
        if (accentColor)
            container.setAccentColor(accentColor);
        const options = this.ACTIVITIES.map((act) => new discord_js_1.StringSelectMenuOptionBuilder()
            .setLabel(act.label)
            .setValue(act.value)
            .setDescription(act.description));
        const selectMenu = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId("select:activity_launch")
            .setPlaceholder("Select an activity to launch...")
            .addOptions(options));
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${activityEmoji} __Launch a Voice Activity__`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Choose an activity below to play with your friends in voice chat and share great moments together.__`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(selectMenu);
        await interaction.reply({
            flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
            components: [container]
        }).catch((replyError) => {
            logger_1.FastLogger.warn(`Failed to send activity launch reply: ${String(replyError)}`);
        });
    }
    static async handleActivitySelect(interaction) {
        const member = interaction.member;
        if (!member || !(member instanceof discord_js_1.GuildMember))
            return;
        const voiceChannel = member.voice.channel;
        const guildId = interaction.guildId;
        const color = guildId ? theme_1.ThemeManager.getColorSync(guildId) : null;
        const accentColor = color ? (0, discord_js_1.resolveColor)(color) : null;
        const activityEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, "activity");
        if (!voiceChannel || !voiceChannel.isVoiceBased()) {
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${this.WAIT_EMOJI} __Voice Channel Required__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __Please join a voice channel first.__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.reply({
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                components: [container]
            }).catch((replyError) => {
                logger_1.FastLogger.warn(`Failed to send voice required reply: ${String(replyError)}`);
            });
            return;
        }
        const selectedValue = interaction.values[0];
        const activityConfig = this.ACTIVITIES.find((a) => a.value === selectedValue) || this.ACTIVITIES[0];
        if (!activityConfig)
            return;
        try {
            let inviteUrl = null;
            try {
                const restRes = (await interaction.client.rest.post(discord_js_1.Routes.channelInvites(voiceChannel.id), {
                    body: {
                        max_age: 86400,
                        max_uses: 0,
                        target_type: 2,
                        target_application_id: activityConfig.appId
                    }
                }));
                if (restRes?.code) {
                    inviteUrl = `https://discord.gg/${restRes.code}`;
                }
            }
            catch {
                try {
                    const standardInvite = await voiceChannel.createInvite({
                        maxAge: 86400,
                        maxUses: 0
                    });
                    inviteUrl = `https://discord.gg/${standardInvite.code}`;
                }
                catch (inviteErr) {
                    logger_1.FastLogger.error("Failed to create fallback invite", inviteErr);
                }
            }
            if (!inviteUrl) {
                throw new Error("Failed to create voice channel activity invite");
            }
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            const launchButtonRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setURL(inviteUrl)
                .setLabel(`Launch ${activityConfig.label}`)
                .setEmoji(activityEmoji));
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${activityEmoji} __Voice Activity Launched!__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- <@${member.user.id}> **__launched ${activityConfig.label} in__** <#${voiceChannel.id}>\n> ⟢ **__Click the button below to join the voice activity:__**`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addActionRowComponents(launchButtonRow)
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.deleteReply().catch(async () => {
                await interaction.deferUpdate().catch(() => { });
            });
            if (voiceChannel.isSendable()) {
                await voiceChannel.send({
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                    components: [container]
                }).catch((sendError) => {
                    logger_1.FastLogger.warn(`Failed to send activity announcement to channel: ${String(sendError)}`);
                });
            }
        }
        catch (err) {
            logger_1.FastLogger.error("Error launching activity", err);
            const container = new discord_js_1.ContainerBuilder();
            if (accentColor)
                container.setAccentColor(accentColor);
            container
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${this.WAIT_EMOJI} __Activity Launch Error__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`> -# __Could not create activity session. Ensure the bot has \`Create Instant Invite\` permissions in <#${voiceChannel.id}>.__`))
                .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true));
            await interaction.update({
                flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                components: [container]
            }).catch(async () => {
                await interaction.reply({
                    flags: discord_js_1.MessageFlags.IsComponentsV2 | discord_js_1.MessageFlags.Ephemeral,
                    components: [container]
                }).catch(() => { });
            });
        }
    }
}
exports.MusicActivityHandler = MusicActivityHandler;
