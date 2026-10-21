"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cownerCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.cownerCommand = {
    name: "cowner",
    prefixAliases: ["cowner", "coowner", "manager", "man"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__Channel is not managed :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const sub = args[0]?.toLowerCase();
        if (!sub) {
            await message.reply({
                ...(await usages_1.Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "list") {
            if (session.coOwners.size === 0) {
                const embed = await usages_1.Usages.executedAction(guildId, "Managers", "**__No managers assigned to this channel :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            const list = Array.from(session.coOwners).map((id) => `<@${id}>`).join(" ");
            const embed = await usages_1.Usages.executedAction(guildId, `Managers (${session.coOwners.size})`, `**__Managers :__** ${list}`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, member.id)) {
            await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        if (sub === "clear") {
            if (session.coOwners.size === 0) {
                const embed = await usages_1.Usages.alreadyAction(guildId, "Your list is already clear");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            for (const coOwnerId of session.coOwners) {
                await channel.permissionOverwrites.delete(coOwnerId).catch(() => { });
            }
            session.coOwners.clear();
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embed = await usages_1.Usages.executedAction(guildId, "Managers Cleared", "**__All managers have been cleared.__**");
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
            return;
        }
        const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1), 1);
        if (targets.length === 0) {
            if (sub === "add") {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, ".v man add")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            if (sub === "remove" || sub === "del") {
                await message.reply({
                    ...(await usages_1.Usages.invalidCommand(guildId, ".v man remove")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            await message.reply({
                ...(await usages_1.Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const targetMember = targets[0];
        const targetId = targetMember.id;
        if (targetMember.user.bot) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__You cannot add a bot as a manager :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "add") {
            if (targetId === member.id) {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Add yourself as a Manager")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            if (session.coOwners.has(targetId)) {
                const embed = await usages_1.Usages.stopDoingThat(guildId, "You Can't Add someone who is already a Manager");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            if (session.coOwners.size >= 3) {
                await message.reply({
                    ...(await usages_1.Usages.impossible(guildId, "**__Limit Reached. You can only have a maximum of 3 managers :__**")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            session.coOwners.add(targetId);
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embed = await usages_1.Usages.executedAction(guildId, "Manager Added", `**__Manager has been added :__** <@${targetId}>`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
        }
        else if (sub === "remove" || sub === "del") {
            if (!session.coOwners.has(targetId)) {
                const embed = await usages_1.Usages.impossible(guildId, "**__This user is not a manager :__**");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            session.coOwners.delete(targetId);
            voice_store_1.VoiceMemoryStore.sync(channel.id);
            const embed = await usages_1.Usages.executedAction(guildId, "Manager Removed", `**__Manager has been removed :__** <@${targetId}>`);
            await message.reply({ ...embed, allowedMentions: { parse: [] } });
        }
        else {
            await message.reply({
                ...(await usages_1.Usages.whatDidYouMean(guildId, ".v man", "add | remove | list | clear")),
                allowedMentions: { parse: [] }
            });
        }
    }
};
