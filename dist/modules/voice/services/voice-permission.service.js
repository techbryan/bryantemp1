"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoicePermissionsManager = void 0;
const voice_store_1 = require("../cache/voice.store");
const voice_auth_service_1 = require("./voice-auth.service");
class VoicePermissionsManager {
    static async setConnectionLock(channel, lock) {
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
            Connect: lock ? false : null,
            SendMessages: lock ? false : null
        });
    }
    static async setTextLock(channel, lock) {
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
            SendMessages: lock ? false : null
        });
    }
    static async setVisibility(channel, hidden) {
        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
            ViewChannel: hidden ? false : null
        });
    }
    static async permitMember(channel, member) {
        await channel.permissionOverwrites.edit(member, {
            Connect: true,
            ViewChannel: true,
            SendMessages: true,
            Speak: true,
            Stream: true
        });
    }
    static permitMemberSync(channel, member) {
        void channel.permissionOverwrites.edit(member, {
            Connect: true,
            ViewChannel: true,
            SendMessages: true,
            Speak: true,
            Stream: true
        }).catch(() => { });
    }
    static async rejectMember(channel, member) {
        const disconnect = member.voice.channelId === channel.id;
        await channel.permissionOverwrites.edit(member, {
            Connect: false,
            ViewChannel: true,
            SendMessages: false
        });
        if (disconnect)
            await member.voice.disconnect().catch(() => { });
    }
    static async kickMember(_channel, member) {
        if (member.voice.channelId) {
            await member.voice.disconnect().catch(() => { });
        }
    }
    static async resetMember(channel, member) {
        await channel.permissionOverwrites.delete(member);
    }
    static async muteUserText(channel, member, mute) {
        await channel.permissionOverwrites.edit(member, { SendMessages: mute ? false : null });
    }
    static async muteVcMember(guildId, memberId, mute) {
        const { BotGateway } = await Promise.resolve().then(() => __importStar(require("../../../core/gateway/bot.gateway")));
        const guild = BotGateway.client?.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(memberId);
        if (member?.voice) {
            await member.voice.setMute(mute).catch(() => { });
        }
    }
    static async deafenVcMember(guildId, memberId, deaf) {
        const { BotGateway } = await Promise.resolve().then(() => __importStar(require("../../../core/gateway/bot.gateway")));
        const guild = BotGateway.client?.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(memberId);
        if (member?.voice) {
            await member.voice.setDeaf(deaf).catch(() => { });
        }
    }
    static async bulkPermit(channel, members) {
        if (members.length === 0)
            return;
        await Promise.all(members.map((m) => channel.permissionOverwrites.edit(m, { Connect: true, ViewChannel: true, SendMessages: true, Speak: true, Stream: true })));
    }
    static async bulkReject(channel, members) {
        if (members.length === 0)
            return;
        await Promise.all(members.map(async (m) => {
            await channel.permissionOverwrites.edit(m, { Connect: false, ViewChannel: true, SendMessages: false });
            if (m.voice.channelId === channel.id)
                await m.voice.disconnect().catch(() => { });
        }));
    }
    static async transferOwnership(channel, oldOwnerId, newOwner) {
        const { PreferencesStore } = await Promise.resolve().then(() => __importStar(require("../../user/cache/preferences.store")));
        const { VoiceMemoryStore } = await Promise.resolve().then(() => __importStar(require("../cache/voice.store")));
        const session = VoiceMemoryStore.get(channel.id);
        if (session) {
            for (const oldCoOwnerId of session.coOwners) {
                await channel.permissionOverwrites.delete(oldCoOwnerId).catch(() => { });
            }
            session.coOwners.clear();
            if (session.channelMutes) {
                for (const mutedId of session.channelMutes) {
                    const m = channel.members.get(mutedId);
                    if (m)
                        await m.voice.setMute(false).catch(() => { });
                }
                session.channelMutes.clear();
            }
            if (session.channelDeafens) {
                for (const deafId of session.channelDeafens) {
                    const m = channel.members.get(deafId);
                    if (m)
                        await m.voice.setDeaf(false).catch(() => { });
                }
                session.channelDeafens.clear();
            }
        }
        await channel.permissionOverwrites.delete(oldOwnerId).catch(() => { });
        await channel.permissionOverwrites.edit(newOwner.id, {
            Connect: true,
            Speak: true,
            Stream: true,
            ViewChannel: true,
            MoveMembers: true,
            SendMessages: true
        }).catch(() => { });
        const prefs = PreferencesStore.getSync(channel.guildId, newOwner.id);
        for (const blockedId of prefs.blacklist) {
            await channel.permissionOverwrites.edit(blockedId, {
                ViewChannel: true,
                Connect: false,
                SendMessages: false
            }).catch(() => { });
        }
        for (const trustedId of prefs.trusted) {
            await channel.permissionOverwrites.edit(trustedId, {
                Connect: true,
                Speak: true,
                Stream: true,
                ViewChannel: true,
                SendMessages: true
            }).catch(() => { });
            session?.coOwners.add(trustedId);
        }
        for (const wlId of prefs.whitelist) {
            await channel.permissionOverwrites.edit(wlId, {
                Connect: true,
                Speak: true,
                Stream: true,
                ViewChannel: true,
                SendMessages: true
            }).catch(() => { });
            session?.whitelist.add(wlId);
        }
        VoiceMemoryStore.reassignOwner(channel.id, newOwner.id);
        VoiceMemoryStore.sync(channel.id);
    }
    static async executeLock(channel, member, lock) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (lock) {
            if (session && session.isLocked) {
                return { status: "already_locked" };
            }
            try {
                await this.setConnectionLock(channel, true);
                if (session) {
                    session.isLocked = true;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "locked" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
        else {
            if (session && !session.isLocked) {
                return { status: "already_unlocked" };
            }
            try {
                await this.setConnectionLock(channel, false);
                if (session) {
                    session.isLocked = false;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "unlocked" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
    }
    static async executeHide(channel, member, hide) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (hide) {
            if (session && session.isHidden) {
                return { status: "already_hidden" };
            }
            try {
                await this.setVisibility(channel, true);
                if (session) {
                    session.isHidden = true;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "hidden" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
        else {
            if (session && !session.isHidden) {
                return { status: "already_unhidden" };
            }
            try {
                await this.setVisibility(channel, false);
                if (session) {
                    session.isHidden = false;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "unhidden" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
    }
    static async executeTextLock(channel, member, lock) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isManager(channel.id, member.id)) {
            return { status: "not_manager" };
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (lock) {
            if (session && session.isTextLocked) {
                return { status: "already_locked" };
            }
            try {
                await this.setTextLock(channel, true);
                if (session) {
                    session.isTextLocked = true;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "locked" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
        else {
            if (session && !session.isTextLocked) {
                return { status: "already_unlocked" };
            }
            try {
                await this.setTextLock(channel, false);
                if (session) {
                    session.isTextLocked = false;
                    voice_store_1.VoiceMemoryStore.sync(channel.id);
                }
                return { status: "unlocked" };
            }
            catch (err) {
                return { status: "failed", error: err instanceof Error ? err.message : String(err) };
            }
        }
    }
    static async executeTransferOwner(channel, actor, target) {
        if (!channel) {
            return { status: "not_in_voice" };
        }
        if (!voice_auth_service_1.VoiceAuthService.isOwner(channel.id, actor.id)) {
            return { status: "not_owner" };
        }
        if (target.id === actor.id) {
            return { status: "target_is_self" };
        }
        if (target.user.bot) {
            return { status: "target_is_bot" };
        }
        if (!channel.members.has(target.id)) {
            return { status: "target_not_in_channel" };
        }
        try {
            await this.transferOwnership(channel, actor.id, target);
            return { status: "transferred", newOwner: target };
        }
        catch (err) {
            return { status: "failed", error: err instanceof Error ? err.message : String(err) };
        }
    }
}
exports.VoicePermissionsManager = VoicePermissionsManager;
