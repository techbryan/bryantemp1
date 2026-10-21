"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotGateway = void 0;
exports.handleInteractionEvent = handleInteractionEvent;
exports.handlePrefixMessage = handlePrefixMessage;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const logger_1 = require("../logger/logger");
const webhook_logger_1 = require("../logger/webhook.logger");
const command_registry_1 = require("../registry/command.registry");
const voice_state_event_1 = require("../../modules/voice/events/voice-state.event");
const guild_store_1 = require("../../modules/voice/cache/guild.store");
const voice_store_1 = require("../../modules/voice/cache/voice.store");
const alias_store_1 = require("../../modules/user/cache/alias.store");
const global_blacklist_store_1 = require("../../modules/user/cache/global-blacklist.store");
const usages_1 = require("../../shared/embeds/usages");
const interaction_dispatcher_1 = require("../interactions/interaction.dispatcher");
const voice_persist_manager_1 = require("../voice/voice-persist.manager");
const theme_1 = require("../config/theme");
const preferences_store_1 = require("../../modules/user/cache/preferences.store");
const bot_developer_store_1 = require("../../modules/user/cache/bot-developer.store");
const user_profile_store_1 = require("../../modules/user/cache/user-profile.store");
const emoji_sync_service_1 = require("../services/emoji-sync.service");
class BotGateway {
    static client;
    client;
    presenceInterval = null;
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildVoiceStates,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent
            ],
            partials: [discord_js_1.Partials.Channel]
        });
        BotGateway.client = this.client;
    }
    async start() {
        this.registerEvents();
        await this.client.login(env_1.ENV.TOKEN);
    }
    registerEvents() {
        this.client.once(discord_js_1.Events.ClientReady, async () => {
            logger_1.FastLogger.success(`Logged in as ${this.client.user?.tag}`);
            const applicationId = this.client.user?.id || env_1.ENV.CLIENT_ID;
            if (env_1.ENV.CLIENT_ID && applicationId !== env_1.ENV.CLIENT_ID) {
                logger_1.FastLogger.warn(`CLIENT_ID (${env_1.ENV.CLIENT_ID}) does not match the logged-in bot ID (${applicationId}); using the logged-in bot ID for application emojis`);
            }
            const statuses = ["Writed by bryan", "ブライアン", "作者：布莱恩"];
            let statusIndex = 0;
            const applyStatus = () => {
                this.client.user?.setPresence({
                    status: "dnd",
                    activities: [{ name: statuses[statusIndex], type: discord_js_1.ActivityType.Custom }]
                });
                statusIndex = (statusIndex + 1) % statuses.length;
            };
            if (this.presenceInterval) {
                clearInterval(this.presenceInterval);
                this.presenceInterval = null;
            }
            applyStatus();
            this.presenceInterval = setInterval(applyStatus, 30_000);
            void Promise.all([
                guild_store_1.GuildMemoryStore.preload(),
                voice_store_1.VoiceMemoryStore.preload(),
                global_blacklist_store_1.GlobalBlacklistStore.preload(),
                preferences_store_1.PreferencesStore.preload(),
                theme_1.ThemeManager.preload(),
                bot_developer_store_1.BotDeveloperStore.preload(),
                user_profile_store_1.UserProfileStore.preload(),
                emoji_sync_service_1.EmojiSyncService.syncConfiguredEmojis(env_1.ENV.TOKEN, applicationId, this.client.rest)
            ]).then(async () => {
                await voice_store_1.VoiceMemoryStore.reconcileWithDiscord(this.client);
                for (const [guildId, guild] of this.client.guilds.cache) {
                    if (global_blacklist_store_1.GlobalBlacklistStore.isServerBlacklisted(guildId)) {
                        await guild.leave().catch(() => { });
                    }
                }
                await voice_persist_manager_1.VoicePersistManager.reconnectAll().catch(() => { });
            });
            void this.deployCommands();
        });
        this.client.on("guildCreate", async (guild) => {
            if (global_blacklist_store_1.GlobalBlacklistStore.isServerBlacklisted(guild.id)) {
                await guild.leave().catch(() => { });
                return;
            }
            webhook_logger_1.WebhookLogger.logGuildJoin(guild.name, guild.id, guild.memberCount, guild.ownerId).catch(() => { });
        });
        this.client.on("guildDelete", async (guild) => {
            webhook_logger_1.WebhookLogger.logGuildLeave(guild.name, guild.id, guild.memberCount).catch(() => { });
        });
        this.client.on("voiceStateUpdate", (oldState, newState) => {
            if (oldState.member?.id === this.client.user?.id && !newState.channelId) {
                const data = voice_persist_manager_1.VoicePersistManager.load();
                if (data.mainBot && data.mainBot.guildId === oldState.guild.id) {
                    setTimeout(() => {
                        void voice_persist_manager_1.VoicePersistManager.joinVoice(this.client, data.mainBot.guildId, data.mainBot.channelId);
                    }, 1000);
                }
            }
            (0, voice_state_event_1.onVoiceStateUpdate)(oldState, newState).catch((err) => logger_1.FastLogger.error("VoiceStateUpdate Error", err));
        });
        this.client.on("interactionCreate", async (interaction) => {
            await handleInteractionEvent(interaction);
        });
        this.client.on("messageCreate", async (message) => {
            await handlePrefixMessage(message);
        });
    }
    async deployCommands() {
        try {
            const rest = new discord_js_1.REST({ version: "10" }).setToken(env_1.ENV.TOKEN);
            await rest.put(discord_js_1.Routes.applicationCommands(env_1.ENV.CLIENT_ID), { body: [] });
            logger_1.FastLogger.success("Unregistered all application commands (slash commands removed)");
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to clear application commands", err);
        }
    }
}
exports.BotGateway = BotGateway;
async function handleInteractionEvent(interaction) {
    try {
        if (global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(interaction.user.id)) {
            return;
        }
        if (interaction.isButton()) {
            await interaction_dispatcher_1.InteractionDispatcher.handleButton(interaction);
            return;
        }
        if (interaction.isModalSubmit()) {
            await interaction_dispatcher_1.InteractionDispatcher.handleModal(interaction);
            return;
        }
        if (interaction.isAnySelectMenu()) {
            await interaction_dispatcher_1.InteractionDispatcher.handleSelectMenu(interaction);
            return;
        }
    }
    catch (err) {
        logger_1.FastLogger.error(`Interaction Error`, err);
        const reply = await usages_1.Usages.impossible(interaction.guildId, "**__An error occurred while executing this action :__**");
        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ ...reply, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
            else {
                await interaction.reply({ ...reply, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
        }
    }
}
async function handlePrefixMessage(message) {
    if (message.author.bot || !message.guild)
        return;
    if (global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(message.author.id))
        return;
    const trimmed = message.content.trim();
    if (!trimmed.startsWith(".v ") && trimmed !== ".v")
        return;
    const restContent = trimmed === ".v" ? "help" : trimmed.slice(2).trim();
    const rawArgs = restContent.split(/\s+/);
    const rawCmdName = rawArgs[0]?.toLowerCase() || "help";
    const userAliasTarget = await alias_store_1.AliasStore.resolve(message.guild.id, message.author.id, rawCmdName);
    const commandName = userAliasTarget || rawCmdName;
    const cmd = command_registry_1.prefixCommandMap.get(commandName);
    if (cmd && cmd.executePrefix) {
        try {
            await cmd.executePrefix(message, rawArgs.slice(1));
            const { ActionLogger } = await Promise.resolve().then(() => __importStar(require("../logger/action.logger")));
            await ActionLogger.logAction({
                guildId: message.guild.id,
                executorId: message.author.id,
                action: `Command: .v ${commandName}`,
                details: rawArgs.slice(1).length > 0 ? `\`${rawArgs.slice(1).join(" ")}\`` : undefined
            }).catch(() => { });
        }
        catch (err) {
            logger_1.FastLogger.error(`Prefix Command Error: ${commandName}`, err);
            const reply = await usages_1.Usages.impossible(message.guildId, "An error occurred while executing this command.");
            await message.reply({ ...reply, allowedMentions: { parse: [] } }).catch(() => { });
        }
    }
}
