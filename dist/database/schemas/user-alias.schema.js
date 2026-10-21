"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAliasModel = void 0;
const mongoose_1 = require("mongoose");
const UserAliasSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    aliases: { type: Map, of: String, default: () => new Map() }
});
UserAliasSchema.index({ userId: 1, guildId: 1 }, { unique: true });
exports.UserAliasModel = (0, mongoose_1.model)("UserAlias", UserAliasSchema);
