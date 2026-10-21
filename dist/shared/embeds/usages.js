"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usages = exports.createMultiContainer = void 0;
exports.noPermissionReply = noPermissionReply;
exports.botNoPermissionReply = botNoPermissionReply;
exports.usageExampleReply = usageExampleReply;
exports.errorReply = errorReply;
exports.alreadyJailedReply = alreadyJailedReply;
exports.alreadyVerifiedReply = alreadyVerifiedReply;
exports.alreadyVerifiedGirlReply = alreadyVerifiedGirlReply;
exports.notJailedReply = notJailedReply;
exports.notVerifiedReply = notVerifiedReply;
exports.processingReply = processingReply;
exports.executedReply = executedReply;
exports.hierarchyErrorReply = hierarchyErrorReply;
exports.configErrorReply = configErrorReply;
exports.boostTierRequiredReply = boostTierRequiredReply;
exports.invalidEmojiReply = invalidEmojiReply;
exports.buildInfoContainer = buildInfoContainer;
const discord_js_1 = require("discord.js");
const theme_1 = require("../../core/config/theme");
const emojies_1 = require("../../core/config/emojies");
const getLocalRGB = (color) => {
    if (typeof color === "number") {
        return [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
    }
    if (Array.isArray(color) && color.length === 3) {
        return color;
    }
    if (!color || typeof color !== "string")
        return [0, 0, 0];
    const cleanHex = color.replace("#", "");
    return [
        parseInt(cleanHex.substring(0, 2), 16) || 0,
        parseInt(cleanHex.substring(2, 4), 16) || 0,
        parseInt(cleanHex.substring(4, 6), 16) || 0
    ];
};
const getAccentColorInt = (color) => {
    const [r, g, b] = getLocalRGB(color);
    return (r << 16) + (g << 8) + b;
};
const stripMarkdownDecorators = (str) => {
    if (typeof str !== "string")
        return str;
    return str
        .replace(/`/g, "")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .trim();
};
const isMentionToken = (token) => /^<@!?\d+>$|^<@&\d+>$|^<#\d+>$/.test(token);
const mentionSafeToken = (token) => {
    const clean = stripMarkdownDecorators(token);
    if (isMentionToken(clean))
        return clean;
    return `\`${clean}\``;
};
const formatUsageLine = (str) => {
    if (typeof str !== "string")
        return str;
    const tokens = str.split(/\s+/).filter(Boolean).filter((t) => t !== "|");
    return tokens.map((t) => mentionSafeToken(t)).join(" ");
};
const createMultiContainer = (parts, accentColorHex) => {
    const builder = new discord_js_1.ContainerBuilder();
    if (accentColorHex) {
        builder.setAccentColor(getAccentColorInt(accentColorHex));
    }
    parts.forEach((part, index) => {
        builder.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(part));
        if (index < parts.length - 1) {
            builder.addSeparatorComponents(new discord_js_1.SeparatorBuilder());
        }
    });
    return builder.toJSON();
};
exports.createMultiContainer = createMultiContainer;
const COMMAND_DESCRIPTIONS = {
    reject: "Deny permission to join channel",
    block: "Deny permission to join channel",
    permit: "Allow permission to join channel",
    perm: "Allow permission to join channel",
    lock: "Lock the voice channel",
    unlock: "Unlock the voice channel",
    hide: "Hide the voice channel",
    unhide: "Unhide the voice channel",
    mute: "Server mute members in voice channel",
    vmute: "Server mute members in voice channel",
    unmute: "Server unmute members in voice channel",
    vunmute: "Server unmute members in voice channel",
    deafen: "Server deafen members in voice channel",
    deaf: "Server deafen members in voice channel",
    undeafen: "Server undeafen members in voice channel",
    undeaf: "Server undeafen members in voice channel",
    kick: "Disconnect members from voice channel",
    kkick: "Disconnect members from voice channel",
    dc: "Disconnect members from voice channel",
    name: "Rename the voice channel",
    rename: "Rename the voice channel",
    limit: "Set member limit for voice channel",
    status: "Set custom status for voice channel",
    vstatus: "Set custom status for voice channel",
    setstatus: "Set custom status for voice channel",
    tmute: "Mute members from sending text messages",
    tunmute: "Unmute members in text chat",
    tlock: "Lock text chat in voice channel",
    tunlock: "Unlock text chat in voice channel",
    cowner: "Manage co-owners/managers for voice channel",
    coowner: "Manage co-owners/managers for voice channel",
    manager: "Manage co-owners/managers for voice channel",
    man: "Manage co-owners/managers for voice channel",
    whitelist: "Manage channel whitelist",
    wl: "Manage channel whitelist",
    owner: "Transfer channel ownership",
    transfer: "Transfer channel ownership",
    claim: "Claim ownership of voice channel",
    unclaim: "Relinquish channel ownership",
    ab: "Toggle anti abuse system",
    antiabuse: "Toggle anti abuse system",
    fixlag: "Reset voice channel region to resolve lag",
    bitrate: "Adjust voice channel bitrate",
    region: "Change voice channel RTC region"
};
const NO_PARSE_MENTIONS = { parse: [] };
class Usages {
    static sanitize(text) {
        return text.replace(/@everyone/gi, "@\u200beveryone").replace(/@here/gi, "@\u200bhere");
    }
    static isValidChannelName(name) {
        if (!name || typeof name !== "string")
            return false;
        const stripped = name.trim();
        if (stripped.length === 0 || stripped.length > 100)
            return false;
        const withoutMarks = stripped.replace(/[\p{M}\p{C}\p{Z}\u2800\u3164\uFFA0\u180E]/gu, "");
        if (withoutMarks.length === 0)
            return false;
        const marksCount = (stripped.match(/\p{M}/gu) || []).length;
        if (marksCount > 10)
            return false;
        return true;
    }
    static resolveAccent(guildId) {
        const col = theme_1.ThemeManager.getColorSync(guildId);
        if (!col)
            return null;
        if (typeof col === "string" && col.startsWith("#"))
            return col;
        if (typeof col === "number")
            return `#${col.toString(16).padStart(6, "0")}`;
        return null;
    }
    static getThemeHeart(guildId) {
        return "<a:pink_Heartjump:1546859773721444382>";
    }
    static getActionEmoji(actionName, guildId) {
        const key = actionName.toLowerCase().trim();
        if (guildId) {
            const themeEmoji = theme_1.ThemeManager.getThemeEmoji(guildId, key);
            if (themeEmoji)
                return themeEmoji;
        }
        return emojies_1.EmojiManager.get(key);
    }
    static async build(guildId, title, content) {
        const accent = this.resolveAccent(guildId);
        const container = (0, exports.createMultiContainer)([title, content], accent);
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container],
            allowedMentions: NO_PARSE_MENTIONS
        };
    }
    static async invalidCommand(guildId, commandUsage, customExample) {
        const cleanCmd = commandUsage
            .replace(/^`|`$/g, "")
            .replace(/^\.v\s+/i, "")
            .replace(/^\./, "")
            .split(/\s+/)[0]
            .toLowerCase();
        const emoji = this.getActionEmoji(cleanCmd, guildId);
        const capitalizedCmd = cleanCmd.length > 0 ? (cleanCmd.charAt(0).toUpperCase() + cleanCmd.slice(1)) : "Command";
        const title = `# ${emoji} ${capitalizedCmd} Command`;
        const cleanUsageText = commandUsage.replace(/^`|`$/g, "");
        let baseCmd = cleanUsageText;
        if (!baseCmd.startsWith("."))
            baseCmd = `.v ${cleanCmd}`;
        let usageLine = "";
        if (cleanCmd === "reject") {
            usageLine = `- __\`.v reject <@member|username|ID>|@role|rolename|roleID>\`__`;
        }
        else if (cleanCmd === "permit" || cleanCmd === "perm") {
            usageLine = `- __\`.v permit <@member|username|ID>|@role|rolename|roleID>\`__`;
        }
        else if (cleanCmd === "name" || cleanCmd === "rename") {
            usageLine = `- __\`${baseCmd} <newname>\`__`;
        }
        else if (cleanCmd === "limit") {
            usageLine = `- __\`${baseCmd} <0-99>\`__`;
        }
        else if (cleanCmd === "status" || cleanCmd === "vstatus" || cleanCmd === "setstatus") {
            usageLine = `- __\`${baseCmd} <newstatus>\`__`;
        }
        else if (cleanCmd === "kick" || cleanCmd === "mute" || cleanCmd === "unmute" || cleanCmd === "deafen" || cleanCmd === "undeafen" || cleanCmd === "tmute" || cleanCmd === "tunmute") {
            usageLine = `- __\`${baseCmd} <@member|username|ID>\`__`;
        }
        else if (cleanUsageText.includes("wl") || cleanUsageText.includes("whitelist")) {
            if (cleanUsageText.includes("add")) {
                usageLine = `- __\`.v wl add <@member|username|ID|@role>\` — Add user or role to whitelist__`;
            }
            else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
                usageLine = `- __\`.v wl remove <@member|username|ID|@role>\` — Remove user or role from whitelist__`;
            }
            else {
                usageLine = `- __\`${cleanUsageText}\`__`;
            }
        }
        else if (cleanUsageText.includes("bl") || cleanUsageText.includes("blacklist")) {
            if (cleanUsageText.includes("add")) {
                usageLine = `- __\`.v bl add <@member|username|ID|@role>\` — Add user or role to blacklist__`;
            }
            else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
                usageLine = `- __\`.v bl remove <@member|username|ID|@role>\` — Remove user or role from blacklist__`;
            }
            else {
                usageLine = `- __\`${cleanUsageText}\`__`;
            }
        }
        else if (cleanUsageText.includes("man") || cleanUsageText.includes("manager") || cleanUsageText.includes("cowner") || cleanUsageText.includes("coowner")) {
            if (cleanUsageText.includes("add")) {
                usageLine = `- __\`.v man add <@member|username|ID>\` — Add manager to channel__`;
            }
            else if (cleanUsageText.includes("remove") || cleanUsageText.includes("del")) {
                usageLine = `- __\`.v man remove <@member|username|ID>\` — Remove manager from channel__`;
            }
            else {
                usageLine = `- __\`${cleanUsageText}\`__`;
            }
        }
        else {
            usageLine = `- __\`${cleanUsageText}\`__`;
        }
        if (cleanUsageText.includes(" — ")) {
            return this.build(guildId, title, usageLine);
        }
        const desc = COMMAND_DESCRIPTIONS[cleanCmd] || "Command instructions and usage information";
        const descLine = `- __${desc}__`;
        const content = usageLine.includes(" — ") ? usageLine : `${usageLine}\n${descLine}`;
        return this.build(guildId, title, content);
    }
    static async whatDidYouMean(guildId, commandUsage, optionsText = "add | remove | list") {
        const cleanCmd = commandUsage
            .replace(/^`|`$/g, "")
            .replace(/^\.v\s+/i, "")
            .replace(/^\./, "")
            .split(/\s+/)[0]
            .toLowerCase();
        const emoji = this.getActionEmoji(cleanCmd, guildId);
        if (cleanCmd === "wl" || cleanCmd === "whitelist") {
            const title = `# ${emoji} Whitelist Command`;
            const lines = [
                `- __\`.v wl add <@member|username|ID|@role>\` — Add to whitelist__`,
                `- __\`.v wl remove <@member|username|ID|@role>\` — Remove from whitelist__`,
                `- __\`.v wl list\` — View whitelisted members & roles__`,
                `- __\`.v wl clear\` — Clear the channel whitelist__`
            ];
            return this.build(guildId, title, lines.join("\n"));
        }
        if (cleanCmd === "bl" || cleanCmd === "blacklist") {
            const title = `# ${emoji} Blacklist Command`;
            const lines = [
                `- __\`.v bl add <@member|username|ID|@role>\` — Add to blacklist__`,
                `- __\`.v bl remove <@member|username|ID|@role>\` — Remove from blacklist__`,
                `- __\`.v bl list\` — View blacklisted members & roles__`,
                `- __\`.v bl clear\` — Clear your blacklist__`
            ];
            return this.build(guildId, title, lines.join("\n"));
        }
        if (cleanCmd === "man" || cleanCmd === "manager" || cleanCmd === "cowner" || cleanCmd === "coowner") {
            const title = `# ${emoji} Managers Command`;
            const lines = [
                `- __\`.v man add <@member|username|ID>\` — Add channel manager__`,
                `- __\`.v man remove <@member|username|ID>\` — Remove channel manager__`,
                `- __\`.v man list\` — View channel managers__`,
                `- __\`.v man clear\` — Clear all managers__`
            ];
            return this.build(guildId, title, lines.join("\n"));
        }
        const title = `# ${emoji} Notice`;
        const cleanUsage = commandUsage.replace(/^`|`$/g, "");
        const content = `- __\`${cleanUsage}\` ${optionsText}__`;
        return this.build(guildId, title, content);
    }
    static formatCleanLine(text) {
        let clean = text.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
        clean = clean.replace(/\s*⁘\s*$/, "").trim();
        if (clean.includes(" :__") || clean.includes(" :") || clean.includes(":__") || clean.includes(":")) {
            const match = clean.match(/^(.*?)(?::__|:\s*|\s*:\s*)(.*)$/);
            if (match) {
                let prefix = match[1].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
                let suffix = match[2].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
                return `- __${prefix}:__ ${suffix}`;
            }
        }
        if (clean.includes(" has been changed to") || clean.includes(" updated to")) {
            const match = clean.match(/^(.*?)(has been changed to|updated to)\s*(.*)$/i);
            if (match) {
                const prefix = match[1].replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
                const mid = match[2].trim();
                let suffix = match[3].trim();
                suffix = suffix.replace(/^(\*\*__|__\*\*|__|\*\*)+/, "").replace(/(\*\*__|__\*\*|__|\*\*)+$/, "").trim();
                const fullPrefix = prefix ? `${prefix} ${mid}:__` : `${mid}:__`;
                return `- __${fullPrefix} ${suffix}`;
            }
        }
        clean = clean.replace(/^(\*\*__|__\*\*)+/, "").replace(/(\*\*__|__\*\*)+$/, "").trim();
        clean = clean.replace(/^(__|\*\*)+/, "").replace(/(__|\*\*)+$/, "").trim();
        return `- __${clean}__`;
    }
    static async executedAction(guildId, actionName, detailText) {
        const emoji = this.getActionEmoji(actionName, guildId);
        const title = `# ${emoji} ${actionName}`;
        let content = detailText;
        if (detailText.includes("\n")) {
            const lines = detailText.split("\n").map((l) => l.trim()).filter(Boolean);
            content = lines.map((l) => this.formatCleanLine(l)).join("\n");
        }
        else {
            content = this.formatCleanLine(detailText);
        }
        return this.build(guildId, title, content);
    }
    static async notManagerOrOwner(guildId) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const content = `- __Only the owner or co-owners can use this__`;
        return this.build(guildId, title, content);
    }
    static async impossible(guildId, reason) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
        const content = `- __${cleanReason}__`;
        return this.build(guildId, title, content);
    }
    static async permissionError(guildId, action, missingPermissions) {
        const emoji = this.getActionEmoji("reject", guildId);
        const title = `# ${emoji} Missing Permissions`;
        const permsText = missingPermissions.map((p) => `\`${p}\``).join(", ");
        const content = `- __Cannot complete action: ${action}__\n- __Required Discord permissions missing: ${permsText}__`;
        return this.build(guildId, title, content);
    }
    static async invalidInputWarning(guildId) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const content = `- __Please provide a valid and safe input__`;
        return this.build(guildId, title, content);
    }
    static async notInVoice(guildId) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const content = `- __You Need To Be in Voice Channel to use that__`;
        return this.build(guildId, title, content);
    }
    static formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0 && secs > 0) {
            return `${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m`;
        }
        return `${secs}s`;
    }
    static async renameCooldown(guildId, remainingSeconds) {
        const emoji = this.getActionEmoji("rename", guildId);
        const title = `# ${emoji} Notice`;
        const formattedTime = this.formatDuration(remainingSeconds);
        const content = `- __Channel rename is on cooldown: ${formattedTime} remaining__`;
        return this.build(guildId, title, content);
    }
    static async alreadyAction(guildId, message) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const clean = message.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
        const content = `- __${clean}__`;
        return this.build(guildId, title, content);
    }
    static async selfReject(guildId) {
        const emoji = this.getActionEmoji("reject", guildId);
        const title = `# ${emoji} Notice`;
        const content = `- __You cannot reject yourself__`;
        return this.build(guildId, title, content);
    }
    static async stopDoingThat(guildId, reason) {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Notice`;
        const cleanReason = reason.replace(/^\*\*__|\*\*__|__\*\*|:\s*$/g, "").replace(/\s*⁘\s*$/, "").trim();
        const content = `- __${cleanReason}__`;
        return this.build(guildId, title, content);
    }
    static async claimPrompt(guildId, ownerId) {
        const accent = this.resolveAccent(guildId);
        const container = new discord_js_1.ContainerBuilder();
        if (accent) {
            container.setAccentColor(getAccentColorInt(accent));
        }
        const claimEmoji = this.getActionEmoji("claim", guildId);
        const ownerMention = ownerId ? `<@${ownerId}>` : "Owner";
        const lines = [
            `-# __${ownerMention} has left the channel__ ⁘`,
            `-# __You can now claim ownership__ ⁘`
        ].join("\n");
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`## ${claimEmoji} Owner Left Channel`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(lines))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId("btn:claim")
            .setLabel("Claim")
            .setEmoji(claimEmoji)
            .setStyle(discord_js_1.ButtonStyle.Secondary)));
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container.toJSON()],
            allowedMentions: NO_PARSE_MENTIONS
        };
    }
    static async ownerReturned(guildId, ownerId) {
        const emoji = this.getActionEmoji("owner", guildId);
        const title = `## ${emoji} Owner Returned`;
        const content = `-# <@${ownerId}> __has returned to the channel__ ⁘`;
        return this.build(guildId, title, content);
    }
    static async claimedChannel(guildId, claimantId) {
        const emoji = this.getActionEmoji("claim", guildId);
        const title = `## ${emoji} Channel Claimed`;
        const content = `-# <@${claimantId}> __has claimed the channel__ ⁘`;
        return this.build(guildId, title, content);
    }
    static async cooldownNotice(guildId, durationStr = "5s") {
        const emoji = this.getActionEmoji("info", guildId);
        const title = `# ${emoji} Cooldown Notice`;
        const content = `- __You are on cooldown for \`${durationStr}\`__`;
        return this.build(guildId, title, content);
    }
    static async antiAbuseNotice(guildId, ownerId, targetId, channelId) {
        const accent = this.resolveAccent(guildId);
        const container = new discord_js_1.ContainerBuilder();
        if (accent)
            container.setAccentColor(getAccentColorInt(accent));
        const emoji = this.getActionEmoji("antiabuse", guildId);
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${emoji} <@${ownerId}> Anti Abuse Detected`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- __<@${targetId}> keeps repeatedly joining your voice channel. Take action below__`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addActionRowComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`antiabuse_permit:${channelId}:${targetId}`)
            .setLabel("Permit")
            .setEmoji("<a:anim_permit_cb:1546636691845152838>")
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`antiabuse_deny:${channelId}:${targetId}`)
            .setLabel("Deny")
            .setEmoji("<a:anim_reject_cb:1546634011315806218>")
            .setStyle(discord_js_1.ButtonStyle.Secondary)));
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container.toJSON()],
            allowedMentions: { users: [ownerId] }
        };
    }
    static async antiAbuseActionCompleted(guildId, action, ownerId, targetId) {
        const accent = this.resolveAccent(guildId);
        const container = new discord_js_1.ContainerBuilder();
        if (accent)
            container.setAccentColor(getAccentColorInt(accent));
        const emoji = action === "Permit" ? "<a:anim_permit_cb:1546636691845152838>" : "<a:anim_reject_cb:1546634011315806218>";
        const statusText = action === "Permit" ? `Permitted <@${targetId}> to join` : `Denied access for <@${targetId}>`;
        container
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${emoji} Anti Abuse Handled`))
            .addSeparatorComponents(new discord_js_1.SeparatorBuilder().setDivider(true))
            .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`- <@${ownerId}> __has ${statusText}__`));
        return {
            flags: discord_js_1.MessageFlags.IsComponentsV2,
            components: [container.toJSON()],
            allowedMentions: { users: [ownerId] }
        };
    }
    static formatUserTarget(verb, ids) {
        const mentions = ids.map((id) => `<@${id}>`).join(" ");
        return `Target has been ${verb}: ${mentions}`;
    }
}
exports.Usages = Usages;
function noPermissionReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __Only the owner or co-owners can use this__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function botNoPermissionReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("reject")} System Error`;
    const text = `- __I don't have enough permission to execute that action__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function usageExampleReply({ commandName, title, description = "Command usage information", usage, example, examples, accentColorHex = "#3b82f6" } = {}) {
    const cmd = commandName || title || "Command";
    const capitalizedCmd = typeof cmd === "string" && cmd.length ? (cmd.charAt(0).toUpperCase() + cmd.slice(1)) : "Command";
    const emoji = Usages.getActionEmoji(cmd.toLowerCase());
    const header = `# ${emoji} ${capitalizedCmd} Command`;
    const usageLines = [];
    if (usage) {
        usageLines.push(formatUsageLine(usage));
    }
    let exampleContent = "";
    if (example) {
        exampleContent = formatUsageLine(example);
    }
    else if (Array.isArray(examples) && examples.length > 0) {
        exampleContent = examples.map((e) => formatUsageLine(e)).join("\n");
    }
    if (exampleContent) {
        exampleContent.split("\n").forEach((line) => {
            if (!usageLines.includes(line))
                usageLines.push(line);
        });
    }
    if (usageLines.length === 0) {
        usageLines.push("`No usage provided.`");
    }
    const content = `- __${usageLines.join(" ")}__\n- __${description}__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([header, content], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function errorReply({ title = "Notice", errors, message, accentColorHex = "#ff0000" } = {}) {
    const emoji = Usages.getActionEmoji("info");
    const header = `# ${emoji} ${title}`;
    let body;
    if (message) {
        if (message.includes("\n")) {
            const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
            body = lines.map((l) => `- __${l}__`).join("\n");
        }
        else {
            body = `- __${message}__`;
        }
    }
    else if (Array.isArray(errors) && errors.length > 0) {
        body = errors.map((err) => `- __${err}__`).join("\n");
    }
    else {
        body = `- __An error occurred__`;
    }
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([header, body], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function alreadyJailedReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __User is already jailed__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function alreadyVerifiedReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __User is already verified__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function alreadyVerifiedGirlReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __User is already verified__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function notJailedReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __User is not jailed__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function notVerifiedReply(accentColorHex = "#ff0000") {
    const title = `# ${Usages.getActionEmoji("info")} Notice`;
    const text = `- __User is not verified__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function processingReply({ actionText, accentColorHex = "#3b82f6" }) {
    const title = `# ${Usages.getActionEmoji("info")} Processing`;
    const text = `- __${actionText}__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function executedReply({ resultText, action = "", accentColorHex = "#3b82f6" }) {
    const emoji = Usages.getActionEmoji(action);
    const title = `# ${emoji} ${action || "System Executed"}`;
    const cleanLine = (l) => {
        let clean = l.replace(/^- (?:<a?:[\w~]+:\d+>\s*)?/, "").trim();
        clean = clean.replace(/^(\*\*__|__\*\*)+/, "").replace(/(\*\*__|__\*\*)+$/, "").trim();
        clean = clean.replace(/^(__|\*\*)+/, "").replace(/(__|\*\*)+$/, "").trim();
        clean = clean.replace(/\s*⁘\s*$/, "").trim();
        return `- __${clean}__`;
    };
    let text;
    if (resultText.includes("\n")) {
        const lines = resultText.split("\n").map((l) => l.trim()).filter(Boolean);
        text = lines.map((l) => cleanLine(l)).join("\n");
    }
    else {
        text = cleanLine(resultText);
    }
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function hierarchyErrorReply({ message = "Role hierarchy error: Member has higher or equal permissions.", accentColorHex = "#ff0000" } = {}) {
    const title = `# ${Usages.getActionEmoji("reject")} Hierarchy Error`;
    const text = `- __${message}__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function configErrorReply({ message = "The system is not configured in this server yet.", accentColorHex = "#ff0000" } = {}) {
    const title = `# ${Usages.getActionEmoji("info")} Configuration Notice`;
    const text = `- __${message}__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function boostTierRequiredReply({ requiredLevel = 2, accentColorHex = "#ff0000" } = {}) {
    const title = `# ${Usages.getActionEmoji("info")} Boost Level Required`;
    const text = `- __This server must be at least Boost Tier ${requiredLevel} to set role icons!__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function invalidEmojiReply({ message = "Please provide an emoji from this server or a default Discord emoji.", accentColorHex = "#ff0000" } = {}) {
    const title = `# ${Usages.getActionEmoji("info")} Invalid Emoji`;
    const text = `- __${message}__`;
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [(0, exports.createMultiContainer)([title, text], accentColorHex)],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
function buildInfoContainer({ sections, banner, accentColorHex = "#3b82f6", headerEmoji = Usages.getActionEmoji("info") }) {
    const container = new discord_js_1.ContainerBuilder().setAccentColor(getAccentColorInt(accentColorHex));
    sections.forEach((section, idx) => {
        if (idx > 0)
            container.addSeparatorComponents(new discord_js_1.SeparatorBuilder());
        container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(`# ${section.emoji || headerEmoji} ${section.title}`));
        container.addSeparatorComponents(new discord_js_1.SeparatorBuilder());
        if (section.thumbnail) {
            container.addSectionComponents(new discord_js_1.SectionBuilder()
                .addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(section.content))
                .setThumbnailAccessory(new discord_js_1.ThumbnailBuilder().setURL(section.thumbnail)));
        }
        else {
            container.addTextDisplayComponents(new discord_js_1.TextDisplayBuilder().setContent(section.content));
        }
    });
    if (banner) {
        container.addSeparatorComponents(new discord_js_1.SeparatorBuilder());
        container.addMediaGalleryComponents(new discord_js_1.MediaGalleryBuilder().addItems((item) => item.setURL(banner)));
    }
    return {
        flags: discord_js_1.MessageFlags.IsComponentsV2,
        components: [container],
        allowedMentions: NO_PARSE_MENTIONS
    };
}
