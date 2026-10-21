"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotDeveloperModel = void 0;
const mongoose_1 = require("mongoose");
const BotDeveloperSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, default: Date.now }
});
exports.BotDeveloperModel = (0, mongoose_1.model)("BotDeveloper", BotDeveloperSchema);
