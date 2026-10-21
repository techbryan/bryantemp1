"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bluCommand = void 0;
const global_blacklist_store_1 = require("../cache/global-blacklist.store");
const bot_developer_store_1 = require("../cache/bot-developer.store");
const usages_1 = require("../../../shared/embeds/usages");
const member_parser_1 = require("../../../shared/utils/member-parser");
exports.bluCommand = {
    name: "blu",
    prefixAliases: ["blu"],
    async executePrefix(message, args) {
        if (!bot_developer_store_1.BotDeveloperStore.isDeveloper(message.author.id))
            return;
        const action = args[0]?.toLowerCase();
        const guildId = message.guildId;
        if (action === "list") {
            const list = global_blacklist_store_1.GlobalBlacklistStore.getUserBlacklist();
            if (list.length === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Global Blacklist Users", "No users are globally blacklisted.");
                await message.reply({ ...embed });
                return;
            }
            const formatted = list.map((id) => `• <@${id}> (\`${id}\`)`).join("\n");
            const embed = await usages_1.Usages.executedAction(guildId, `Global Blacklist Users (${list.length})`, formatted);
            await message.reply({ ...embed });
            return;
        }
        if (action === "add") {
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 1);
            let targetId = targets[0]?.id;
            if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
                targetId = args[1];
            }
            if (!targetId) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v blu add <@user | username | id>`");
                await message.reply({ ...embed });
                return;
            }
            if (targetId === message.author.id) {
                const embed = await usages_1.Usages.impossible(guildId, "**__You cannot blacklist yourself :__**");
                await message.reply({ ...embed });
                return;
            }
            if (global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(targetId)) {
                const embed = await usages_1.Usages.alreadyAction(guildId, "This user is already globally blacklisted");
                await message.reply({ ...embed });
                return;
            }
            await global_blacklist_store_1.GlobalBlacklistStore.addUser(targetId);
            const embed = await usages_1.Usages.executedAction(guildId, "Global User Blacklist", `**__User has been globally blacklisted from the bot :__** <@${targetId}> (\`${targetId}\`)`);
            await message.reply({ ...embed });
            return;
        }
        if (action === "remove") {
            const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 1);
            let targetId = targets[0]?.id;
            if (!targetId && args[1] && /^\d{17,20}$/.test(args[1])) {
                targetId = args[1];
            }
            if (!targetId) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v blu remove <@user | username | id>`");
                await message.reply({ ...embed });
                return;
            }
            if (!global_blacklist_store_1.GlobalBlacklistStore.isUserBlacklisted(targetId)) {
                const embed = await usages_1.Usages.impossible(guildId, "**__This user is not globally blacklisted :__**");
                await message.reply({ ...embed });
                return;
            }
            await global_blacklist_store_1.GlobalBlacklistStore.removeUser(targetId);
            const embed = await usages_1.Usages.executedAction(guildId, "Global User Blacklist", `**__User has been removed from the global bot blacklist :__** <@${targetId}> (\`${targetId}\`)`);
            await message.reply({ ...embed });
            return;
        }
        const embed = await usages_1.Usages.invalidCommand(guildId, "`.v blu <add | remove | list>`");
        await message.reply({ ...embed });
    }
};
