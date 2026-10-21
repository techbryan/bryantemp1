"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPreferencesModel = void 0;
const mongoose_1 = require("mongoose");
const UserPreferencesSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    blacklist: { type: [String], default: [] },
    trusted: { type: [String], default: [] },
    whitelist: { type: [String], default: [] }
});
UserPreferencesSchema.index({ userId: 1, guildId: 1 }, { unique: true });
exports.UserPreferencesModel = (0, mongoose_1.model)("UserPreferences", UserPreferencesSchema);
