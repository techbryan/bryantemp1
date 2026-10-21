"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aliasCommand = void 0;
const alias_store_1 = require("../cache/alias.store");
const usages_1 = require("../../../shared/embeds/usages");
const command_registry_1 = require("../../../core/registry/command.registry");
exports.aliasCommand = {
    name: "alias",
    prefixAliases: ["alias", "aliases", "alaise", "alaises"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        const userId = message.author.id;
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === "list") {
            const aliases = await alias_store_1.AliasStore.getAliases(guildId, userId);
            if (aliases.size === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Aliases List", "**__You have no custom command shortcuts set.__**\nUse: `.v alias add <shortcut> <command>`");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            const formatted = Array.from(aliases.entries())
                .map((entry) => `> ### - **\`.v ${entry[0]}\`** ➜ **\`.v ${entry[1]}\`**`)
                .join("\n");
            const embed = await usages_1.Usages.executedAction(guildId, `Your Aliases (${aliases.size}/5)`, formatted);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "add") {
            const alias = args[1]?.toLowerCase();
            const target = args[2]?.toLowerCase();
            if (!alias || !target) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v alias add <shortcut> <command>`", "`.v alias add l lock`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const isCoreCommand = command_registry_1.commandRegistry.some((c) => c.name === alias || c.prefixAliases?.includes(alias));
            if (isCoreCommand) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `**__Cannot use core command name \`${alias}\` as an alias :__**`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const exists = command_registry_1.commandRegistry.some((c) => c.name === target || c.prefixAliases?.includes(target));
            if (!exists) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `**__Command \`${target}\` is not a registered command :__**`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const res = await alias_store_1.AliasStore.addAlias(guildId, userId, alias, target);
            if (!res.success) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `**__${res.reason} :__**`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const embed = await usages_1.Usages.executedAction(guildId, "Alias Added", `**__Shortcut \`.v ${alias}\` set to \`.v ${target}\`!__**`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "remove" || sub === "delete" || sub === "del") {
            const alias = args[1]?.toLowerCase();
            if (!alias) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, "`.v alias remove <shortcut>`", "`.v alias remove l`")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const removed = await alias_store_1.AliasStore.removeAlias(guildId, userId, alias);
            if (!removed) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `**__Alias \`${alias}\` was not found :__**`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const embed = await usages_1.Usages.executedAction(guildId, "Alias Removed", `**__Shortcut \`.v ${alias}\` deleted.__**`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (args.length >= 2) {
            const alias = args[0].toLowerCase();
            const target = args[1].toLowerCase();
            const isCoreCommand = command_registry_1.commandRegistry.some((c) => c.name === alias || c.prefixAliases?.includes(alias));
            if (isCoreCommand) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, `**__Cannot use core command name \`${alias}\` as an alias :__**`)),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const exists = command_registry_1.commandRegistry.some((c) => c.name === target || c.prefixAliases?.includes(target));
            if (exists) {
                const res = await alias_store_1.AliasStore.addAlias(guildId, userId, alias, target);
                if (res.success) {
                    const embed = await usages_1.Usages.executedAction(guildId, "Alias Added", `**__Shortcut \`.v ${alias}\` set to \`.v ${target}\`!__**`);
                    await message.reply({ ...embed, allowedMentions: { parse: [] } });
                    return;
                }
            }
        }
        await message.reply({
            ...(await usages_1.Usages.invalidCommand(guildId, "`.v alias <add | remove | list>`", "`.v alias add l lock`")),
            allowedMentions: { parse: [] }
        });
    }
};
