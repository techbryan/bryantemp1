"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefixCommandMap = exports.commandMap = exports.commandRegistry = void 0;
const lock_command_1 = require("../../modules/voice/commands/access/lock.command");
const unlock_command_1 = require("../../modules/voice/commands/access/unlock.command");
const tlock_command_1 = require("../../modules/voice/commands/access/tlock.command");
const tunlock_command_1 = require("../../modules/voice/commands/access/tunlock.command");
const tmute_command_1 = require("../../modules/voice/commands/access/tmute.command");
const tunmute_command_1 = require("../../modules/voice/commands/access/tunmute.command");
const hide_command_1 = require("../../modules/voice/commands/access/hide.command");
const unhide_command_1 = require("../../modules/voice/commands/access/unhide.command");
const permit_command_1 = require("../../modules/voice/commands/permissions/permit.command");
const reject_command_1 = require("../../modules/voice/commands/permissions/reject.command");
const kick_command_1 = require("../../modules/voice/commands/permissions/kick.command");
const mute_command_1 = require("../../modules/voice/commands/permissions/mute.command");
const unmute_command_1 = require("../../modules/voice/commands/permissions/unmute.command");
const deafen_command_1 = require("../../modules/voice/commands/permissions/deafen.command");
const undeafen_command_1 = require("../../modules/voice/commands/permissions/undeafen.command");
const owner_command_1 = require("../../modules/voice/commands/ownership/owner.command");
const claim_command_1 = require("../../modules/voice/commands/ownership/claim.command");
const unclaim_command_1 = require("../../modules/voice/commands/ownership/unclaim.command");
const vc_command_1 = require("../../modules/voice/commands/ownership/vc.command");
const cowner_command_1 = require("../../modules/voice/commands/management/cowner.command");
const whitelist_command_1 = require("../../modules/voice/commands/management/whitelist.command");
const onetap_command_1 = require("../../modules/voice/commands/management/onetap.command");
const setup_command_1 = require("../../modules/voice/commands/management/setup.command");
const setbot_command_1 = require("../../modules/voice/commands/management/setbot.command");
const name_command_1 = require("../../modules/voice/commands/settings/name.command");
const limit_command_1 = require("../../modules/voice/commands/settings/limit.command");
const stats_command_1 = require("../../modules/voice/commands/settings/stats.command");
const fixlag_command_1 = require("../../modules/voice/commands/settings/fixlag.command");
const theme_command_1 = require("../../modules/voice/commands/settings/theme.command");
const panelimage_command_1 = require("../../modules/voice/commands/settings/panelimage.command");
const alias_command_1 = require("../../modules/user/commands/alias.command");
const blacklist_command_1 = require("../../modules/user/commands/blacklist.command");
const trusted_command_1 = require("../../modules/user/commands/trusted.command");
const blu_command_1 = require("../../modules/user/commands/blu.command");
const bls_command_1 = require("../../modules/user/commands/bls.command");
const servers_command_1 = require("../../modules/user/commands/servers.command");
const dev_command_1 = require("../../modules/user/commands/dev.command");
const bitrate_command_1 = require("../../modules/voice/commands/settings/bitrate.command");
const region_command_1 = require("../../modules/voice/commands/settings/region.command");
const status_command_1 = require("../../modules/voice/commands/settings/status.command");
const game_command_1 = require("../../modules/voice/commands/management/game.command");
const music_command_1 = require("../../modules/voice/commands/management/music.command");
const panel_command_1 = require("../../modules/voice/commands/settings/panel.command");
const join_command_1 = require("../../modules/voice/commands/management/join.command");
const help_command_1 = require("../../modules/user/commands/help.command");
const ping_command_1 = require("../../modules/user/commands/ping.command");
const banner_command_1 = require("../../modules/voice/commands/settings/banner.command");
const ab_command_1 = require("../../modules/voice/commands/access/ab.command");
const needhelp_command_1 = require("../../modules/voice/commands/management/needhelp.command");
exports.commandRegistry = [
    help_command_1.helpCommand,
    ping_command_1.pingCommand,
    banner_command_1.bannerCommand,
    ab_command_1.abCommand,
    lock_command_1.lockCommand,
    unlock_command_1.unlockCommand,
    tlock_command_1.tlockCommand,
    tunlock_command_1.tunlockCommand,
    tmute_command_1.tmuteCommand,
    tunmute_command_1.tunmuteCommand,
    hide_command_1.hideCommand,
    unhide_command_1.unhideCommand,
    permit_command_1.permitCommand,
    reject_command_1.rejectCommand,
    kick_command_1.kickCommand,
    mute_command_1.muteCommand,
    unmute_command_1.unmuteCommand,
    deafen_command_1.deafenCommand,
    undeafen_command_1.undeafenCommand,
    owner_command_1.ownerCommand,
    claim_command_1.claimCommand,
    unclaim_command_1.unclaimCommand,
    vc_command_1.vcCommand,
    cowner_command_1.cownerCommand,
    whitelist_command_1.whitelistCommand,
    game_command_1.gameCommand,
    music_command_1.musicCommand,
    panel_command_1.panelCommand,
    join_command_1.joinCommand,
    onetap_command_1.onetapCommand,
    setup_command_1.setupCommand,
    setbot_command_1.setbotCommand,
    needhelp_command_1.needhelpCommand,
    name_command_1.nameCommand,
    limit_command_1.limitCommand,
    status_command_1.statusCommand,
    stats_command_1.statsCommand,
    fixlag_command_1.fixlagCommand,
    bitrate_command_1.bitrateCommand,
    region_command_1.regionCommand,
    theme_command_1.themeCommand,
    panelimage_command_1.panelimageCommand,
    alias_command_1.aliasCommand,
    blacklist_command_1.blacklistCommand,
    trusted_command_1.trustedCommand,
    blu_command_1.bluCommand,
    bls_command_1.blsCommand,
    servers_command_1.serversCommand,
    dev_command_1.devCommand
];
exports.commandMap = new Map(exports.commandRegistry.map((cmd) => [cmd.name, cmd]));
exports.prefixCommandMap = new Map();
for (const cmd of exports.commandRegistry) {
    exports.prefixCommandMap.set(cmd.name, cmd);
    if (cmd.prefixAliases) {
        for (const alias of cmd.prefixAliases) {
            exports.prefixCommandMap.set(alias, cmd);
        }
    }
}
