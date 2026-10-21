"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpCommand = void 0;
const help_builder_1 = require("../interactions/help.builder");
exports.helpCommand = {
    name: "help",
    prefixAliases: ["help", "commands", "cmd", "cmds", "h"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        const query = args.join(" ").toLowerCase().trim();
        if (!query) {
            const payload = await help_builder_1.HelpBuilder.buildHelpPayload(guildId, "home", 0);
            await message.reply({ ...payload, allowedMentions: { parse: [] } });
            return;
        }
        if (query.startsWith("search ")) {
            const searchQuery = query.replace("search ", "").trim();
            const payload = await help_builder_1.HelpBuilder.buildSearchPayload(guildId, searchQuery);
            await message.reply({ ...payload, allowedMentions: { parse: [] } });
            return;
        }
        const foundCategory = help_builder_1._CATEGORIES.find((c) => c.id.toLowerCase() === query ||
            c.name.toLowerCase() === query ||
            c.name.toLowerCase().replace(/\s+/g, "") === query.replace(/\s+/g, ""));
        if (foundCategory) {
            const payload = await help_builder_1.HelpBuilder.buildHelpPayload(guildId, foundCategory.id, 0);
            await message.reply({ ...payload, allowedMentions: { parse: [] } });
            return;
        }
        const payload = await help_builder_1.HelpBuilder.buildSearchPayload(guildId, query);
        await message.reply({ ...payload, allowedMentions: { parse: [] } });
    }
};
