"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceClaimService = void 0;
const voice_store_1 = require("../cache/voice.store");
const voice_permission_service_1 = require("./voice-permission.service");
const logger_1 = require("../../../core/logger/logger");
class VoiceClaimService {
    static async claimChannel(channel, member) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            return { status: "not_active_voice" };
        }
        if (session.ownerId === member.id) {
            return { status: "already_owner" };
        }
        const ownerInChannel = channel.members.has(session.ownerId);
        if (ownerInChannel) {
            return { status: "owner_still_present" };
        }
        try {
            await voice_permission_service_1.VoicePermissionsManager.transferOwnership(channel, session.ownerId, member);
            return { status: "claimed", channelId: channel.id };
        }
        catch (err) {
            logger_1.FastLogger.error("Failed to claim channel", {
                channelId: channel.id,
                guildId: channel.guildId,
                actorId: member.id,
                err
            });
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
}
exports.VoiceClaimService = VoiceClaimService;
