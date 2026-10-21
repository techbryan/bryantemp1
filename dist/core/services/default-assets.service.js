"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAssetService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const webhook_logger_1 = require("../logger/webhook.logger");
const logger_1 = require("../logger/logger");
class DefaultAssetService {
    static defaultPanelUrl = null;
    static isUploading = false;
    static localImagePath = path_1.default.join(process.cwd(), "src", "assets", "default_panel.jpg");
    static async getDefaultPanelImageUrl() {
        if (this.defaultPanelUrl) {
            return this.defaultPanelUrl;
        }
        if (this.isUploading) {
            return this.defaultPanelUrl;
        }
        this.isUploading = true;
        try {
            if (fs_1.default.existsSync(this.localImagePath)) {
                const buffer = fs_1.default.readFileSync(this.localImagePath);
                const uploadedUrl = await webhook_logger_1.WebhookLogger.uploadImage(buffer, "default_panel_marlboro.jpg");
                if (uploadedUrl) {
                    this.defaultPanelUrl = uploadedUrl;
                    logger_1.FastLogger.success(`Default panel image uploaded and cached: ${uploadedUrl}`);
                    return this.defaultPanelUrl;
                }
            }
        }
        catch (err) {
            logger_1.FastLogger.warn(`Failed to upload default panel image: ${err}`);
        }
        finally {
            this.isUploading = false;
        }
        return this.defaultPanelUrl;
    }
    static getDefaultPanelImageSync() {
        return this.defaultPanelUrl;
    }
    static setDefaultPanelImageUrl(url) {
        this.defaultPanelUrl = url;
    }
}
exports.DefaultAssetService = DefaultAssetService;
