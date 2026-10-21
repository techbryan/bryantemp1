"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionDispatcher = void 0;
const setup_handler_1 = require("./handlers/setup.handler");
const setbot_handler_1 = require("./handlers/setbot.handler");
const voice_button_handler_1 = require("./handlers/voice-button.handler");
const voice_modal_handler_1 = require("./handlers/voice-modal.handler");
const game_select_handler_1 = require("./handlers/game-select.handler");
const help_handler_1 = require("./handlers/help.handler");
const theme_handler_1 = require("./handlers/theme.handler");
const music_activity_handler_1 = require("./handlers/music-activity.handler");
class InteractionDispatcher {
    static async handleButton(interaction) {
        const id = interaction.customId;
        if (id === "btn:music_get") {
            await music_activity_handler_1.MusicActivityHandler.handleMusicGet(interaction);
            return;
        }
        if (id === "btn:activity_launch") {
            await music_activity_handler_1.MusicActivityHandler.handleActivityLaunch(interaction);
            return;
        }
        if (id.startsWith("help:")) {
            await help_handler_1.HelpInteractionHandler.handleButton(interaction);
            return;
        }
        if (id.startsWith("theme:")) {
            await theme_handler_1.ThemeInteractionHandler.handleButton(interaction);
            return;
        }
        if (id.startsWith("setup_") || id.startsWith("setup:")) {
            await setup_handler_1.SetupInteractionHandler.handleButton(interaction);
            return;
        }
        if (id.startsWith("setbot:")) {
            await setbot_handler_1.SetbotInteractionHandler.handleButton(interaction);
            return;
        }
        await voice_button_handler_1.VoiceButtonHandler.handle(interaction);
    }
    static async handleModal(interaction) {
        const id = interaction.customId;
        if (id.startsWith("theme:")) {
            await theme_handler_1.ThemeInteractionHandler.handleModal(interaction);
            return;
        }
        if (id.startsWith("setup_") || id.startsWith("setup:")) {
            await setup_handler_1.SetupInteractionHandler.handleModal(interaction);
            return;
        }
        if (id.startsWith("setbot:")) {
            await setbot_handler_1.SetbotInteractionHandler.handleModal(interaction);
            return;
        }
        await voice_modal_handler_1.VoiceModalHandler.handle(interaction);
    }
    static async handleSelectMenu(interaction) {
        const id = interaction.customId;
        if (id === "select:activity_launch" && interaction.isStringSelectMenu()) {
            await music_activity_handler_1.MusicActivityHandler.handleActivitySelect(interaction);
            return;
        }
        if (id.startsWith("help:") && interaction.isStringSelectMenu()) {
            await help_handler_1.HelpInteractionHandler.handleSelectMenu(interaction);
            return;
        }
        if (id.startsWith("theme:") && interaction.isStringSelectMenu()) {
            await theme_handler_1.ThemeInteractionHandler.handleSelectMenu(interaction);
            return;
        }
        if (id === "select:game_mention" && interaction.isStringSelectMenu()) {
            await game_select_handler_1.GameSelectHandler.handle(interaction);
            return;
        }
        await interaction.deferUpdate().catch(() => { });
    }
}
exports.InteractionDispatcher = InteractionDispatcher;
