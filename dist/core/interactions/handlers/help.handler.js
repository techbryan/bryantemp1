"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpInteractionHandler = void 0;
const help_builder_1 = require("../../../modules/user/interactions/help.builder");
class HelpInteractionHandler {
    static async handleButton(interaction) {
        const parts = interaction.customId.split(":");
        if (parts[0] !== "help")
            return;
        const action = parts[1];
        if (action === "home") {
            const payload = await help_builder_1.HelpBuilder.buildHelpPayload(interaction.guildId, "home", 0);
            await interaction.update(payload).catch(() => { });
            return;
        }
        if (action === "page") {
            const categoryId = parts[2];
            const pageIndex = parseInt(parts[3], 10);
            const payload = await help_builder_1.HelpBuilder.buildHelpPayload(interaction.guildId, categoryId, pageIndex);
            await interaction.update(payload).catch(() => { });
            return;
        }
        await interaction.deferUpdate().catch(() => { });
    }
    static async handleSelectMenu(interaction) {
        if (interaction.customId !== "help:category_select")
            return;
        const selectedCategory = interaction.values[0];
        const payload = await help_builder_1.HelpBuilder.buildHelpPayload(interaction.guildId, selectedCategory, 0);
        await interaction.update(payload).catch(() => { });
    }
}
exports.HelpInteractionHandler = HelpInteractionHandler;
