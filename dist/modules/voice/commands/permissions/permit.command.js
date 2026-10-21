"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permitCommand = void 0;
const voice_auth_service_1 = require("../../services/voice-auth.service");
const voice_permission_service_1 = require("../../services/voice-permission.service");
const voice_store_1 = require("../../cache/voice.store");
const usages_1 = require("../../../../shared/embeds/usages");
const member_parser_1 = require("../../../../shared/utils/member-parser");
exports.permitCommand = {
    name: "permit",
    prefixAliases: ["permit", "perm", "pemir"],
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
        const { members: targetMembers, roles: targetRoles } = await (0, member_parser_1.extractTargets)(message, args, 4);
        if (targetMembers.length === 0 && targetRoles.length === 0) {
            await message.reply({
                ...(await usages_1.Usages.invalidCommand(guildId, "`.v permit`", "@user | username | `ID`\n`.v permit` @role | rolename | `ID`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const appliedMentions = [];
        if (targetRoles.length > 0) {
            for (const role of targetRoles) {
                await channel.permissionOverwrites.edit(role, {
                    Connect: true,
                    ViewChannel: true,
                    SendMessages: true,
                    Speak: true,
                    Stream: true
                }).catch(() => { });
                appliedMentions.push(`<@&${role.id}>`);
            }
        }
        if (targetMembers.length > 0) {
            if (targetMembers.some((t) => t.id === member.id)) {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Permit yourself")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const notYetPermitted = targetMembers.filter((m) => {
                const overwrite = channel.permissionOverwrites.cache.get(m.id);
                return !overwrite || overwrite.allow.has("Connect") === false;
            });
            if (notYetPermitted.length === 0 && targetRoles.length === 0) {
                await message.reply({
                    ...(await usages_1.Usages.stopDoingThat(guildId, "You Can't Permit someone he is already Permitted")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            if (notYetPermitted.length > 0) {
                await voice_permission_service_1.VoicePermissionsManager.bulkPermit(channel, notYetPermitted);
                const session = voice_store_1.VoiceMemoryStore.get(channel.id);
                if (session) {
                    for (const m of notYetPermitted) {
                        session.whitelist.add(m.id);
                    }
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                for (const m of notYetPermitted) {
                    appliedMentions.push(`<@${m.id}>`);
                }
            }
        }
        const embed = await usages_1.Usages.executedAction(guildId, "Permit", `__Target has been permitted:__ ${appliedMentions.join(" ")}`);
        await message.reply({ ...embed, allowedMentions: { parse: [] } });
    }
};
