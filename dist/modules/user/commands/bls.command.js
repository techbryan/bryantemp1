"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blsCommand = void 0;
const global_blacklist_store_1 = require("../cache/global-blacklist.store");
const bot_developer_store_1 = require("../cache/bot-developer.store");
const usages_1 = require("../../../shared/embeds/usages");
exports.blsCommand = {
    name: "bls",
    prefixAliases: ["bls"],
    async executePrefix(message, args) {
        if (!bot_developer_store_1.BotDeveloperStore.isDeveloper(message.author.id))
            return;
        const action = args[0]?.toLowerCase();
        const guildId = message.guildId;
        if (action === "list") {
            const list = global_blacklist_store_1.GlobalBlacklistStore.getServerBlacklist();
            if (list.length === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Global Blacklist Servers", "No servers are globally blacklisted.");
                await message.reply({ ...embed });
                return;
            }
            const formatted = list.map((id) => `• Server ID: \`${id}\``).join("\n");
            const embed = await usages_1.Usages.executedAction(guildId, `Global Blacklist Servers (${list.length})`, formatted);
            await message.reply({ ...embed });
            return;
        }
        if (action === "add") {
            const targetServerId = args[1]?.trim();
            if (!targetServerId || !/^\d{17,20}$/.test(targetServerId)) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bls add`", "`<serverId>`");
                await message.reply({ ...embed });
                return;
            }
            await global_blacklist_store_1.GlobalBlacklistStore.addServer(targetServerId);
            const targetGuild = message.client.guilds.cache.get(targetServerId);
            if (targetGuild) {
                await targetGuild.leave().catch(() => { });
            }
            const embed = await usages_1.Usages.executedAction(guildId, "Global Server Blacklist", `**__Server has been blacklisted and left :__** \`${targetServerId}\`${targetGuild ? ` (${targetGuild.name})` : ""}`);
            await message.reply({ ...embed });
            return;
        }
        if (action === "remove") {
            const targetServerId = args[1]?.trim();
            if (!targetServerId || !/^\d{17,20}$/.test(targetServerId)) {
                const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bls remove`", "`<serverId>`");
                await message.reply({ ...embed });
                return;
            }
            await global_blacklist_store_1.GlobalBlacklistStore.removeServer(targetServerId);
            const embed = await usages_1.Usages.executedAction(guildId, "Global Server Blacklist", `**__Server has been removed from blacklist :__** \`${targetServerId}\``);
            await message.reply({ ...embed });
            return;
        }
        const embed = await usages_1.Usages.invalidCommand(guildId, "`.v bls <add | remove | list>`");
        await message.reply({ ...embed });
    }
};
