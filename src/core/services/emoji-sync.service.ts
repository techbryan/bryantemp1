import { REST, Routes } from "discord.js";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { get as httpsGet } from "node:https";
import { join } from "node:path";
import { ENV } from "../config/env";
import { ACTION_EMOJIS, EmojiItem, EmojiManager } from "../config/emojies";
import { SystemEmojis } from "../config/assets.config";
import { DEFAULT_EMOJIS, THEME_BUTTON_EMOJIS } from "../config/theme";
import { FastLogger } from "../logger/logger";

interface DiscordEmojiItem {
  id: string;
  name: string;
  animated?: boolean;
}

export class EmojiSyncService {
  private static readonly mappingPath = join(process.cwd(), "data", "application-emojis.json");
  private static readonly rewrittenRestClients = new WeakSet<object>();

  public static async syncConfiguredEmojis(clientToken: string, clientId: string, botRest?: REST): Promise<void> {
    if (!ENV.AUTO_LOAD_EMOJIS || !clientToken || !clientId) return;

    const sources = await this.getConfiguredEmojis();
    const replacements = await this.loadSavedMappings();
    this.applyReplacements(replacements);
    if (botRest) this.installPayloadRewriter(botRest, replacements);

    const rest = new REST({ version: "10" }).setToken(clientToken);

    let items: DiscordEmojiItem[];
    try {
      const emojiRes = (await rest.get(Routes.applicationEmojis(clientId))) as { items?: DiscordEmojiItem[] } | DiscordEmojiItem[];
      items = Array.isArray(emojiRes) ? emojiRes : (emojiRes?.items || []);
    } catch (err: unknown) {
      FastLogger.warn(`Failed to fetch application emojis: ${err instanceof Error ? err.message : String(err)}`);
      if (replacements.size > 0) {
        FastLogger.info(`Restored ${replacements.size} saved application emoji mappings`);
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
          applicationEmoji = (await rest.post(Routes.applicationEmojis(clientId), {
            body: {
              name: source.name,
              image: `data:image/${source.animated ? "gif" : "png"};base64,${image.toString("base64")}`
            }
          })) as DiscordEmojiItem;
          byName.set(applicationEmoji.name.toLowerCase(), applicationEmoji);
          items.push(applicationEmoji);
          uploaded++;
        } catch (err: unknown) {
          FastLogger.warn(`Failed to sync configured emoji ${source.name}: ${err instanceof Error ? err.message : String(err)}`);
          continue;
        }
      }

      const replacement = `<${applicationEmoji.animated ? "a" : ""}:${applicationEmoji.name}:${applicationEmoji.id}>`;
      replacements.set(source.id, replacement);
    }

    await this.saveMappings(replacements);
    this.applyReplacements(replacements);
    if (botRest) this.installPayloadRewriter(botRest, replacements);

    const formatted: EmojiItem[] = items.map((item) => ({
      id: item.id,
      name: item.name,
      animated: Boolean(item.animated)
    }));
    EmojiManager.setDynamicEmojis(formatted);
    FastLogger.info(`Synchronized project emojis: discovered ${sources.size}, mapped ${replacements.size}, uploaded ${uploaded}, available ${formatted.length}`);
  }

  private static async getConfiguredEmojis(): Promise<Map<string, { id: string; name: string; animated: boolean }>> {
    const configuredValues = [...Object.values(SystemEmojis), ...Object.values(ACTION_EMOJIS)];
    const sourceDirectory = join(process.cwd(), "src");
    try {
      await this.collectSourceTexts(sourceDirectory, configuredValues);
    } catch {
      await this.collectSourceTexts(join(process.cwd(), "dist"), configuredValues, ".js");
    }

    const sources = new Map<string, { id: string; name: string; animated: boolean }>();
    for (const value of configuredValues) {
      const matches = value.matchAll(/<(a?):([A-Za-z0-9_]{2,32}):(\d+)>/g);
      for (const match of matches) {
        sources.set(match[3], { id: match[3], name: match[2], animated: match[1] === "a" });
      }
    }
    return sources;
  }

  private static async collectSourceTexts(directory: string, texts: string[], extension?: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        await this.collectSourceTexts(path, texts, extension);
      } else if (entry.isFile() && (extension ? entry.name.endsWith(extension) : /\.(?:ts|js)$/.test(entry.name))) {
        texts.push(await readFile(path, "utf8"));
      }
    }
  }

  private static installPayloadRewriter(rest: REST, replacements: Map<string, string>): void {
    if (this.rewrittenRestClients.has(rest)) return;
    this.rewrittenRestClients.add(rest);

    const originalRequest = rest.request.bind(rest);
    rest.request = ((options) => {
      const body = options.body;
      if (body && typeof body === "object" && !(body instanceof Buffer) && !(body instanceof URLSearchParams)) {
        const prototype = Object.getPrototypeOf(body);
        if (prototype === Object.prototype || prototype === null || Array.isArray(body)) {
          options.body = this.replacePayloadValue(body, replacements);
        }
      } else if (typeof body === "string") {
        try {
          options.body = JSON.stringify(this.replacePayloadValue(JSON.parse(body), replacements));
        } catch {
          options.body = this.replaceEmojiReferences(body, replacements);
        }
      }
      return originalRequest(options);
    }) as typeof rest.request;
  }

  private static replacePayloadValue(value: unknown, replacements: Map<string, string>): unknown {
    if (typeof value === "string") return this.replaceEmojiReferences(value, replacements);
    if (Array.isArray(value)) return value.map((item) => this.replacePayloadValue(item, replacements));
    if (value && typeof value === "object") {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) return value;
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, this.replacePayloadValue(item, replacements)])
      );
    }
    return value;
  }

  private static async loadSavedMappings(): Promise<Map<string, string>> {
    try {
      const contents = await readFile(this.mappingPath, "utf8");
      const parsed = JSON.parse(contents) as Record<string, unknown>;
      return new Map(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
    } catch {
      return new Map();
    }
  }

  private static async saveMappings(replacements: Map<string, string>): Promise<void> {
    try {
      await mkdir(join(process.cwd(), "data"), { recursive: true });
      await writeFile(this.mappingPath, `${JSON.stringify(Object.fromEntries(replacements), null, 2)}\n`, "utf8");
    } catch (err: unknown) {
      FastLogger.warn(`Failed to save application emoji mappings: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private static applyReplacements(replacements: Map<string, string>): void {
    for (const key of Object.keys(ACTION_EMOJIS)) {
      ACTION_EMOJIS[key] = this.replaceEmojiReferences(ACTION_EMOJIS[key], replacements);
    }
    const systemEmojis = SystemEmojis as Record<string, string>;
    for (const key of Object.keys(systemEmojis)) {
      systemEmojis[key] = this.replaceEmojiReferences(systemEmojis[key], replacements);
    }
    for (const key of Object.keys(DEFAULT_EMOJIS)) {
      DEFAULT_EMOJIS[key] = this.replaceEmojiReferences(DEFAULT_EMOJIS[key], replacements);
    }
    for (const themeEmojis of Object.values(THEME_BUTTON_EMOJIS)) {
      for (const key of Object.keys(themeEmojis)) {
        themeEmojis[key] = this.replaceEmojiReferences(themeEmojis[key], replacements);
      }
    }
  }

  private static downloadEmoji(source: { id: string; animated: boolean }): Promise<Buffer> {
    const extension = source.animated ? "gif" : "png";
    const url = `https://cdn.discordapp.com/emojis/${source.id}.${extension}?size=128&quality=lossless`;

    return new Promise((resolve, reject) => {
      const request = httpsGet(url, (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Discord CDN returned HTTP ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
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

  private static replaceEmojiReferences(value: string, replacements: Map<string, string>): string {
    return value.replace(/<(?:a?):[A-Za-z0-9_]{2,32}:(\d+)>/g, (emoji, id: string) => replacements.get(id) || emoji);
  }
}
