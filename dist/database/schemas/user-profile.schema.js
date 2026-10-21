"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileModel = void 0;
const mongoose_1 = require("mongoose");
const UserProfileSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelsCreated: { type: Number, default: 0 },
    hasBannerAccess: { type: Boolean, default: false },
    equippedBannerUrl: { type: String }
});
UserProfileSchema.index({ userId: 1, guildId: 1 }, { unique: true });
exports.UserProfileModel = (0, mongoose_1.model)("UserProfile", UserProfileSchema);
