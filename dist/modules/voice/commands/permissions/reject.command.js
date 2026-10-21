"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_permission_service_1 = require("../../services/voice-permission.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.rejectCommand = {
    name: "reject",
    prefixAliases: ["reject", "block"],
    async executePrefix(message, args) {
        const member = message.member;
        const channel = member.voice.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({ ...(await usages_1.Usages.notInVoice(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            await message.reply({ ...(await usages_1.Usages.notManagerOrOwner(guildId)), allowedMentions: { parse: [] } });
            return;
        }
        const { members: extractedMembers, roles: targetRoles } = await (0, member_parser_1.extractTargets)(message, args, 4);
        if (extractedMembers.some((t) => t.id === member.id)) {
            await message.reply({
                ...(await usages_1.Usages.selfReject(guildId)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const targetMembers = extractedMembers.filter((target) => voice_auth_service_1.VoiceAuthService.canManageTarget(channel.id, member.id, target.id, message.guild));
        if (targetMembers.length === 0 && targetRoles.length === 0) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v reject`", "@user | username | `ID`\n`.v reject` @role | rolename | `ID`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const appliedMentions = [];
        if (targetRoles.length > 0) {
            for (const role of targetRoles) {
                await channel.permissionOverwrites.edit(role, {
                    Connect: false,
                    ViewChannel: true,
                    SendMessages: false
                }).catch(() => { });
                for (const [, chMember] of channel.members) {
                    if (chMember.roles.cache.has(role.id) && chMember.id !== member.id) {
                        chMember.voice.disconnect().catch(() => { });
                    }
                }
                appliedMentions.push(`<@&${role.id}>`);
            }
        }
        if (targetMembers.length > 0) {
            const notYetRejected = targetMembers.filter((m) => {
                const overwrite = channel.permissionOverwrites.cache.get(m.id);
                return !overwrite || overwrite.deny.has("Connect") === false;
            });
            if (notYetRejected.length === 0 && targetRoles.length === 0) {
                const embed = await usages_1.Usages.stopDoingThat(guildId, "You Can't Reject someone he is already Rejected");
                await message.reply({ ...embed, allowedMentions: { parse: [] } });
                return;
            }
            if (notYetRejected.length > 0) {
                await voice_permission_service_1.VoicePermissionsManager.bulkReject(channel, notYetRejected);
                const session = voice_store_1.VoiceMemoryStore.get(channel.id);
                if (session) {
                    for (const m of notYetRejected) {
                        session.whitelist.delete(m.id);
                    }
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                for (const m of notYetRejected) {
                    appliedMentions.push(`<@${m.id}>`);
                }
            }
        }
        const embed = await usages_1.Usages.executedAction(guildId, "Reject", `__Target has been rejected:__ ${appliedMentions.join(" ")}`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
