"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blacklistCommand = void 0;
const preferences_store_1 = require("../cache/preferences.store");
const usages_1 = require("../../../shared/embeds/usages");
const member_parser_1 = require("../../../shared/utils/member-parser");
const voice_permission_service_1 = require("../../voice/services/voice-permission.service");
exports.blacklistCommand = {
    name: "bl",
    prefixAliases: ["bl", "blacklist"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        const userId = message.author.id;
        const sub = args[0]?.toLowerCase();
        if (!sub) {
            await message.reply({
                ...(await usages_1.Usages.whatDidYouMean(guildId, ".v bl", "add | remove | list | clear")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "list") {
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            if (prefs.blacklist.size === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Blacklist", "**__No users or roles in your personal blacklist :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            const list = Array.from(prefs.blacklist).map((id) => {
                if (message.guild?.roles.cache.has(id))
                    return `<@&${id}>`;
                return `<@${id}>`;
            }).join(" ");
            const embed = await usages_1.Usages.executedAction(guildId, `Blacklist (${prefs.blacklist.size})`, `**__Blacklisted Users & Roles :__** ${list}`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "clear") {
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            if (prefs.blacklist.size === 0) {
                const embed = await usages_1.Usages.alreadyAction(guildId, "Your list is already clear");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            const member = message.member;
            const voiceChannel = member?.voice.channel;
            if (voiceChannel) {
                for (const blockedId of prefs.blacklist) {
                    await voiceChannel.permissionOverwrites.delete(blockedId).catch(() => { });
                }
            }
            await preferences_store_1.PreferencesStore.clearBlacklist(guildId, userId);
            const embed = await usages_1.Usages.executedAction(guildId, "Blacklist Cleared", "**__Blacklist has been cleared.__**");
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "add") {
            const { members: extractedMembers, roles: targetRoles } = await (0, member_parser_1.extractTargets)(message, args.slice(1), 5);
            const validTargets = extractedMembers.filter((t) => !t.user.bot);
            if (validTargets.length === 0 && targetRoles.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, ".v bl add")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            if (validTargets.some((t) => t.id === userId)) {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Blacklist yourself")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            const nonBlacklistedMembers = validTargets.filter((t) => !prefs.blacklist.has(t.id));
            const nonBlacklistedRoles = targetRoles.filter((r) => !prefs.blacklist.has(r.id));
            if (nonBlacklistedMembers.length === 0 && nonBlacklistedRoles.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Blacklist someone who is already Blacklisted")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const addedMentions = [];
            const member = message.member;
            const voiceChannel = member?.voice.channel;
            for (const r of nonBlacklistedRoles) {
                if (prefs.blacklist.size >= 10)
                    break;
                await preferences_store_1.PreferencesStore.addBlacklist(guildId, userId, r.id);
                if (voiceChannel) {
                    await voiceChannel.permissionOverwrites.edit(r, {
                        Connect: false,
                        ViewChannel: true,
                        SendMessages: false
                    }).catch(() => { });
                }
                addedMentions.push(`<@&${r.id}>`);
            }
            for (const t of nonBlacklistedMembers) {
                if (prefs.blacklist.size >= 10)
                    break;
                await preferences_store_1.PreferencesStore.addBlacklist(guildId, userId, t.id);
                if (voiceChannel) {
                    try {
                        await voice_permission_service_1.VoicePermissionsManager.rejectMember(voiceChannel, t);
                    }
                    catch { }
                }
                addedMentions.push(`<@${t.id}>`);
            }
            if (addedMentions.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Limit Reached. You can only have a maximum of blacklisted entries :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const embed = await usages_1.Usages.executedAction(guildId, "Blacklisted", `**__Added to permanent blacklist :__** ${addedMentions.join(" ")}`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "remove" || sub === "del") {
            const { members: extractedMembers, roles: targetRoles } = await (0, member_parser_1.extractTargets)(message, args.slice(1), 5);
            if (extractedMembers.length === 0 && targetRoles.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, ".v bl remove")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            const inBlacklistMembers = extractedMembers.filter((t) => prefs.blacklist.has(t.id));
            const inBlacklistRoles = targetRoles.filter((r) => prefs.blacklist.has(r.id));
            if (inBlacklistMembers.length === 0 && inBlacklistRoles.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Selected users or roles are not in your blacklist :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const member = message.member;
            const voiceChannel = member?.voice.channel;
            const removedMentions = [];
            for (const r of inBlacklistRoles) {
                await preferences_store_1.PreferencesStore.removeBlacklist(guildId, userId, r.id);
                if (voiceChannel) {
                    await voiceChannel.permissionOverwrites.delete(r).catch(() => { });
                }
                removedMentions.push(`<@&${r.id}>`);
            }
            for (const t of inBlacklistMembers) {
                await preferences_store_1.PreferencesStore.removeBlacklist(guildId, userId, t.id);
                if (voiceChannel) {
                    try {
                        await voice_permission_service_1.VoicePermissionsManager.resetMember(voiceChannel, t);
                    }
                    catch { }
                }
                removedMentions.push(`<@${t.id}>`);
            }
            const embed = await usages_1.Usages.executedAction(guildId, "Blacklist Removed", `**__Removed from permanent blacklist :__** ${removedMentions.join(" ")}`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        await message.reply({
            ...(await usages_1.Usages.whatDidYouMean(guildId, ".v bl", "add | remove | list")),
            allowedMentions: { parse: [] }
        });
    }
};
