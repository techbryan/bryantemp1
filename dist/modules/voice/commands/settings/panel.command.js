"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.panelCommand = void 0;
const voice_store_1 = require("../../cache/voice.store");
const panel_builder_1 = require("../../../../core/interactions/panel.builder");
const usages_1 = require("../../../../shared/embeds/usages");
exports.panelCommand = {
    name: "panel",
    prefixAliases: ["panel", "controlpanel"],
    async executePrefix(message) {
        const member = message.member;
        const channel = member?.voice?.channel;
        const guildId = message.guildId;
        if (!channel) {
            await message.reply({
                ...(await usages_1.Usages.notInVoice(guildId)),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const session = voice_store_1.VoiceMemoryStore.get(channel.id);
        if (!session) {
            await message.reply({
                ...(await usages_1.Usages.impossible(guildId, "**__This voice channel is not managed by the bot :__**")),
                allowedMentions: { parse: [] }
            });
            return;
        }
        const fullPayload = await panel_builder_1.PanelBuilder.createFullPanelPayload(guildId, session.ownerId);
        await message.reply(fullPayload).catch(() => { });
    }
};
