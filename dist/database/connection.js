"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = initDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../core/config/env");
const logger_1 = require("../core/logger/logger");
const active_voice_schema_1 = require("./schemas/active-voice.schema");
const user_preferences_schema_1 = require("./schemas/user-preferences.schema");
const guild_config_schema_1 = require("./schemas/guild-config.schema");
const user_profile_schema_1 = require("./schemas/user-profile.schema");
const global_blacklist_schema_1 = require("./schemas/global-blacklist.schema");
const bot_voice_persist_schema_1 = require("./schemas/bot-voice-persist.schema");
const bot_developer_schema_1 = require("./schemas/bot-developer.schema");
const global_music_bot_schema_1 = require("./schemas/global-music-bot.schema");
const guild_theme_schema_1 = require("./schemas/guild-theme.schema");
const user_alias_schema_1 = require("./schemas/user-alias.schema");
async function initDatabase() {
    try {
        await mongoose_1.default.connect(env_1.ENV.MONGO_URI, {
            maxPoolSize: 20,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            autoIndex: false
        });
        logger_1.FastLogger.success("Database pool initialized");
        await Promise.allSettled([
            active_voice_schema_1.ActiveVoiceModel.syncIndexes(),
            user_preferences_schema_1.UserPreferencesModel.syncIndexes(),
            guild_config_schema_1.GuildConfigModel.syncIndexes(),
            user_profile_schema_1.UserProfileModel.syncIndexes(),
            global_blacklist_schema_1.GlobalBlacklistModel.syncIndexes(),
            bot_voice_persist_schema_1.BotVoicePersistModel.syncIndexes(),
            bot_developer_schema_1.BotDeveloperModel.syncIndexes(),
            global_music_bot_schema_1.GlobalMusicBotModel.syncIndexes(),
            guild_theme_schema_1.GuildThemeModel.syncIndexes(),
            user_alias_schema_1.UserAliasModel.syncIndexes()
        ]);
    }
    catch (err) {
        logger_1.FastLogger.error("Database connection failed", err);
        process.exit(1);
    }
}
