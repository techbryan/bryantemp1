"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trustedCommand = void 0;
const preferences_store_1 = require("../cache/preferences.store");
const replies_1 = require("../../../shared/embeds/replies");
const member_parser_1 = require("../../../shared/utils/member-parser");
exports.trustedCommand = {
    name: "trusted",
    prefixAliases: ["trusted", "trust"],
    async executePrefix(message, args) {
        const guildId = message.guildId;
        if (!guildId)
            return;
        const userId = message.author.id;
        const sub = args[0]?.toLowerCase();
        if (!sub || sub === "list") {
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            if (prefs.trusted.size === 0) {
                await message.reply({
                    ...(await replies_1.Replies.create(guildId, "Your Trusted Managers", "You have no trusted managers set.")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const list = Array.from(prefs.trusted).map((id) => `• <@${id}>`).join("\n");
            await message.reply({
                ...(await replies_1.Replies.create(guildId, `Your Trusted Managers (${prefs.trusted.size})`, list)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const targets = await (0, member_parser_1.extractTargetMembers)(message, args.slice(1));
        if (targets.length === 0) {
            await message.reply({
                ...(await replies_1.Replies.error(guildId, "Syntax Error", "Usage:\n• `.v trusted add @user`\n• `.v trusted remove @user`\n• `.v trusted list`")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "add") {
            const prefs = await preferences_store_1.PreferencesStore.get(guildId, userId);
            const filtered = targets.filter((t) => t.id !== userId);
            const added = [];
            for (const t of filtered) {
                if (prefs.trusted.size >= 3 && !prefs.trusted.has(t.id))
                    break;
                await preferences_store_1.PreferencesStore.addTrusted(guildId, userId, t.id);
                added.push(t.id);
            }
            if (added.length === 0) {
                await message.reply({
                    ...(await replies_1.Replies.error(guildId, "Limit Reached", "You can only have a maximum of 3 managers.")),
                    allowedMentions: { parse: [] }
                });
                return;
            }
            const mentions = added.map((id) => `<@${id}>`).join(", ");
            await message.reply({
                ...(await replies_1.Replies.success(guildId, "Trusted Managers Added", `Added as trusted managers for your rooms: ${mentions}\n(They can rename and reject members, but cannot touch you or each other).`)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (sub === "remove" || sub === "del") {
            for (const t of targets) {
                await preferences_store_1.PreferencesStore.removeTrusted(guildId, userId, t.id);
            }
            const mentions = targets.map((t) => `<@${t.id}>`).join(", ");
            await message.reply({
                ...(await replies_1.Replies.success(guildId, "Trusted Managers Removed", `Removed from your trusted managers: ${mentions}`)),
                allowedMentions: { parse: [] }
            });
            return;
        }
    }
};
