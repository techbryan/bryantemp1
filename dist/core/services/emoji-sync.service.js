"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmojiSyncService = void 0;
const discord_js_1 = require("discord.js");
const promises_1 = require("node:fs/promises");
const node_https_1 = require("node:https");
const node_path_1 = require("node:path");
const env_1 = require("../config/env");
const emojies_1 = require("../config/emojies");
const assets_config_1 = require("../config/assets.config");
const theme_1 = require("../config/theme");
const logger_1 = require("../logger/logger");
class EmojiSyncService {
    static mappingPath = (0, node_path_1.join)(process.cwd(), "data", "application-emojis.json");
    static rewrittenRestClients = new WeakSet();
    static async syncConfiguredEmojis(clientToken, clientId, botRest) {
        if (!env_1.ENV.AUTO_LOAD_EMOJIS || !clientToken || !clientId)
            return;
        const sources = await this.getConfiguredEmojis();
        const replacements = await this.loadSavedMappings();
        this.applyReplacements(replacements);
        if (botRest)
            this.installPayloadRewriter(botRest, replacements);
        const rest = new discord_js_1.REST({ version: "10" }).setToken(clientToken);
        let items;
        try {
            const emojiRes = (await rest.get(discord_js_1.Routes.applicationEmojis(clientId)));
            items = Array.isArray(emojiRes) ? emojiRes : (emojiRes?.items || []);
        }
        catch (err) {
            logger_1.FastLogger.warn(`Failed to fetch application emojis: ${err instanceof Error ? err.message : String(err)}`);
            if (replacements.size > 0) {
                logger_1.FastLogger.info(`Restored ${replacements.size} saved application emoji mappings`);
            }
            return;
        }
        const byName = new Map(items.map((item) => [item.name.toLowerCase(), item]));
        let uploaded = 0;
        for (const source of sources.values()) {
            let applicationEmoji = byName.get(source.name.toLowerCase());
            if (!applicationEmoji) {
                try {
                    const image = await this.downloadEmoji(source);
                    if (image.length > 256 * 1024) {
                        throw new Error("image exceeds Discord's 256 KB emoji limit");
                    }
                    applicationEmoji = (await rest.post(discord_js_1.Routes.applicationEmojis(clientId), {
                        body: {
                            name: source.name,
                            image: `data:image/${source.animated ? "gif" : "png"};base64,${image.toString("base64")}`
                        }
                    }));
                    byName.set(applicationEmoji.name.toLowerCase(), applicationEmoji);
                    items.push(applicationEmoji);
                    uploaded++;
                }
                catch (err) {
                    logger_1.FastLogger.warn(`Failed to sync configured emoji ${source.name}: ${err instanceof Error ? err.message : String(err)}`);
                    continue;
                }
            }
            const replacement = `<${applicationEmoji.animated ? "a" : ""}:${applicationEmoji.name}:${applicationEmoji.id}>`;
            replacements.set(source.id, replacement);
        }
        await this.saveMappings(replacements);
        this.applyReplacements(replacements);
        if (botRest)
            this.installPayloadRewriter(botRest, replacements);
        const formatted = items.map((item) => ({
            id: item.id,
            name: item.name,
            animated: Boolean(item.animated)
        }));
        emojies_1.EmojiManager.setDynamicEmojis(formatted);
        logger_1.FastLogger.info(`Synchronized project emojis: discovered ${sources.size}, mapped ${replacements.size}, uploaded ${uploaded}, available ${formatted.length}`);
    }
    static async getConfiguredEmojis() {
        const configuredValues = [...Object.values(assets_config_1.SystemEmojis), ...Object.values(emojies_1.ACTION_EMOJIS)];
        const sourceDirectory = (0, node_path_1.join)(process.cwd(), "src");
        try {
            await this.collectSourceTexts(sourceDirectory, configuredValues);
        }
        catch {
            await this.collectSourceTexts((0, node_path_1.join)(process.cwd(), "dist"), configuredValues, ".js");
        }
        const sources = new Map();
        for (const value of configuredValues) {
            const matches = value.matchAll(/<(a?):([A-Za-z0-9_]{2,32}):(\d+)>/g);
            for (const match of matches) {
                sources.set(match[3], { id: match[3], name: match[2], animated: match[1] === "a" });
            }
        }
        return sources;
    }
    static async collectSourceTexts(directory, texts, extension) {
        const entries = await (0, promises_1.readdir)(directory, { withFileTypes: true });
        for (const entry of entries) {
            const path = (0, node_path_1.join)(directory, entry.name);
            if (entry.isDirectory()) {
                await this.collectSourceTexts(path, texts, extension);
            }
            else if (entry.isFile() && (extension ? entry.name.endsWith(extension) : /\.(?:ts|js)$/.test(entry.name))) {
                texts.push(await (0, promises_1.readFile)(path, "utf8"));
            }
        }
    }
    static installPayloadRewriter(rest, replacements) {
        if (this.rewrittenRestClients.has(rest))
            return;
        this.rewrittenRestClients.add(rest);
        const originalRequest = rest.request.bind(rest);
        rest.request = ((options) => {
            const body = options.body;
            if (body && typeof body === "object" && !(body instanceof Buffer) && !(body instanceof URLSearchParams)) {
                const prototype = Object.getPrototypeOf(body);
                if (prototype === Object.prototype || prototype === null || Array.isArray(body)) {
                    options.body = this.replacePayloadValue(body, replacements);
                }
            }
            else if (typeof body === "string") {
                try {
                    options.body = JSON.stringify(this.replacePayloadValue(JSON.parse(body), replacements));
                }
                catch {
                    options.body = this.replaceEmojiReferences(body, replacements);
                }
            }
            return originalRequest(options);
        });
    }
    static replacePayloadValue(value, replacements) {
        if (typeof value === "string")
            return this.replaceEmojiReferences(value, replacements);
        if (Array.isArray(value))
            return value.map((item) => this.replacePayloadValue(item, replacements));
        if (value && typeof value === "object") {
            const prototype = Object.getPrototypeOf(value);
            if (prototype !== Object.prototype && prototype !== null)
                return value;
            return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.replacePayloadValue(item, replacements)]));
        }
        return value;
    }
    static async loadSavedMappings() {
        try {
            const contents = await (0, promises_1.readFile)(this.mappingPath, "utf8");
            const parsed = JSON.parse(contents);
            return new Map(Object.entries(parsed).filter((entry) => typeof entry[1] === "string"));
        }
        catch {
            return new Map();
        }
    }
    static async saveMappings(replacements) {
        try {
            await (0, promises_1.mkdir)((0, node_path_1.join)(process.cwd(), "data"), { recursive: true });
            await (0, promises_1.writeFile)(this.mappingPath, `${JSON.stringify(Object.fromEntries(replacements), null, 2)}\n`, "utf8");
        }
        catch (err) {
            logger_1.FastLogger.warn(`Failed to save application emoji mappings: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    static applyReplacements(replacements) {
        for (const key of Object.keys(emojies_1.ACTION_EMOJIS)) {
            emojies_1.ACTION_EMOJIS[key] = this.replaceEmojiReferences(emojies_1.ACTION_EMOJIS[key], replacements);
        }
        const systemEmojis = assets_config_1.SystemEmojis;
        for (const key of Object.keys(systemEmojis)) {
            systemEmojis[key] = this.replaceEmojiReferences(systemEmojis[key], replacements);
        }
        for (const key of Object.keys(theme_1.DEFAULT_EMOJIS)) {
            theme_1.DEFAULT_EMOJIS[key] = this.replaceEmojiReferences(theme_1.DEFAULT_EMOJIS[key], replacements);
        }
        for (const themeEmojis of Object.values(theme_1.THEME_BUTTON_EMOJIS)) {
            for (const key of Object.keys(themeEmojis)) {
                themeEmojis[key] = this.replaceEmojiReferences(themeEmojis[key], replacements);
            }
        }
    }
    static downloadEmoji(source) {
        const extension = source.animated ? "gif" : "png";
        const url = `https://cdn.discordapp.com/emojis/${source.id}.${extension}?size=128&quality=lossless`;
        return new Promise((resolve, reject) => {
            const request = (0, node_https_1.get)(url, (response) => {
                if (response.statusCode !== 200) {
                    response.resume();
                    reject(new Error(`Discord CDN returned HTTP ${response.statusCode}`));
                    return;
                }
                const chunks = [];
                let size = 0;
                response.on("data", (chunk) => {
                    size += chunk.length;
                    if (size > 256 * 1024) {
                        request.destroy(new Error("image exceeds Discord's 256 KB emoji limit"));
                        return;
                    }
                    chunks.push(chunk);
                });
                response.on("end", () => resolve(Buffer.concat(chunks)));
            });
            request.setTimeout(15_000, () => request.destroy(new Error("emoji download timed out")));
            request.on("error", reject);
        });
    }
    static replaceEmojiReferences(value, replacements) {
        return value.replace(/<(?:a?):[A-Za-z0-9_]{2,32}:(\d+)>/g, (emoji, id) => replacements.get(id) || emoji);
    }
}
exports.EmojiSyncService = EmojiSyncService;
