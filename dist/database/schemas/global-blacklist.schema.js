"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalBlacklistModel = void 0;
const mongoose_1 = require("mongoose");
const GlobalBlacklistSchema = new mongoose_1.Schema({
    targetId: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ["user", "server"] },
    reason: { type: String },
    addedAt: { type: Date, default: Date.now }
});
exports.GlobalBlacklistModel = (0, mongoose_1.model)("GlobalBlacklist", GlobalBlacklistSchema);
