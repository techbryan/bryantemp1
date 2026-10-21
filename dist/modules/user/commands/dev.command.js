"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devCommand = void 0;
const bot_developer_store_1 = require("../cache/bot-developer.store");
const usages_1 = require("../../../shared/embeds/usages");
const member_parser_1 = require("../../../shared/utils/member-parser");
exports.devCommand = {
    name: "bryan",
    prefixAliases: ["bryan"],
    async executePrefix(message, args) {
        if (!bot_developer_store_1.BotDeveloperStore.isMainDev(message.author.id))
            return;
        const action = args[0]?.toLowerCase();
        const guildId = message.guildId;
        if (!action || action === "list") {
            const list = bot_developer_store_1.BotDeveloperStore.getDeveloperList();
            if (list.length === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Bot Developers", "No additional bot developers registered.");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            const formatted = list.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
            const embed = await usages_1.Usages.executedAction(guildId, `Bot Developers (${list.length})`, formatted);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (action === "add") {
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 1);
            let targetId = targets[0]?.id;
            if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
                targetId = args[1];
            }
            if (!targetId) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bryan add <@user | id>`");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            if (targetId === message.author.id) {
                const embed = await usages_1.Usages.impossible(guildId, "**__You are already the main bot developer :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            if (bot_developer_store_1.BotDeveloperStore.isDeveloper(targetId)) {
                const embed = await usages_1.Usages.alreadyAction(guildId, "This user is already a bot developer");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            await bot_developer_store_1.BotDeveloperStore.addDeveloper(targetId, message.author.id);
            const embed = await usages_1.Usages.executedAction(guildId, "Bot Developer Added", `**__User has been granted bot developer permissions :__** <@${targetId}> (\`${targetId}\`)`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (action === "remove" || action === "del") {
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 1);
            let targetId = targets[0]?.id;
            if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
                targetId = args[1];
            }
            if (!targetId) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bryan remove <@user | id>`");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            if (!bot_developer_store_1.BotDeveloperStore.isDeveloper(targetId)) {
                const embed = await usages_1.Usages.impossible(guildId, "**__This user is not a bot developer :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            await bot_developer_store_1.BotDeveloperStore.removeDeveloper(targetId);
            const embed = await usages_1.Usages.executedAction(guildId, "Bot Developer Removed", `**__User has been removed from bot developers :__** <@${targetId}> (\`${targetId}\`)`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bryan <add | remove | list>`");
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
