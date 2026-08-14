#!/usr/bin/env node
// Забирает новые посты из Telegram-канала (через getUpdates) и превращает
// их в _posts/*.md. Каждый вызов запоминает, до какого update_id дошёл,
// в .github/telegram-state.json, чтобы не публиковать повторно.
//
// Формат поста в канале:
//   Первая строка — заголовок.
//   Дальше — текст заметки.
//   Последней строкой (необязательно) — хэштеги: #iOS #Lampa #Trakt

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // например -1001234567890
const API_BASE = process.env.TELEGRAM_API_BASE || "https://api.telegram.org";
const STATE_PATH = path.resolve(".github/telegram-state.json");
const POSTS_DIR = path.resolve("_posts");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_BASE = process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN не задан");
  process.exit(1);
}

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(title) {
  const translit = [...title.toLowerCase()]
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("");
  return (
    translit
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "post"
  );
}

function loadState() {
  if (!existsSync(STATE_PATH)) return { offset: 0 };
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

function saveState(state) {
  mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

function parsePost(rawText) {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");
  const title = lines[0].trim();
  let bodyLines = lines.slice(1);

  // Убираем пустые строки сразу после заголовка.
  while (bodyLines.length && bodyLines[0].trim() === "") bodyLines.shift();

  let tags = [];
  const lastIdx = (() => {
    for (let i = bodyLines.length - 1; i >= 0; i--) {
      if (bodyLines[i].trim() !== "") return i;
    }
    return -1;
  })();

  if (lastIdx >= 0) {
    const lastLine = bodyLines[lastIdx].trim();
    if (/^(#\S+\s*)+$/.test(lastLine)) {
      tags = [...lastLine.matchAll(/#(\S+)/g)].map((m) => m[1]);
      bodyLines = bodyLines.slice(0, lastIdx);
    }
  }

  const body = bodyLines.join("\n").replace(/\s+$/, "");
  return { title, body, tags };
}

function yamlString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function yamlList(items) {
  return `[${items.map(yamlString).join(", ")}]`;
}

async function translateToEnglish(title, tags, body) {
  const prompt = [
    "Translate this personal tech-blog note from Russian to English.",
    "Keep the tone casual, first-person, concise — a personal engineering",
    "blog, not a tutorial or marketing copy. Keep product/technology names",
    "as-is (Trakt, Lampa, iOS, GitHub, etc). Preserve paragraph breaks",
    "(blank line between paragraphs), plain text, no added markdown.",
    "Translate the tags too, unless they're proper nouns.",
    "",
    'Reply with ONLY strict JSON, no code fences, no commentary:',
    '{"title": string, "tags": string[], "body": string}',
    "",
    "---",
    `title: ${title}`,
    `tags: ${tags.join(", ")}`,
    "body:",
    body,
  ].join("\n");

  const res = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.title || !parsed.body) {
    throw new Error("Некорректный ответ перевода: нет title/body");
  }
  return {
    title: parsed.title,
    tags: Array.isArray(parsed.tags) ? parsed.tags : tags,
    body: parsed.body,
  };
}

async function fetchUpdates(offset) {
  const url = `${API_BASE}/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=0&allowed_updates=${encodeURIComponent(
    JSON.stringify(["channel_post"])
  )}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }
  return data.result;
}

async function main() {
  const state = loadState();
  const updates = await fetchUpdates(state.offset);

  if (updates.length === 0) {
    console.log("Новых обновлений нет");
    return;
  }

  let lastOffset = state.offset;
  const createdFiles = [];

  for (const update of updates) {
    lastOffset = update.update_id + 1;

    const post = update.channel_post;
    if (!post) continue;
    if (CHANNEL_ID && String(post.chat.id) !== String(CHANNEL_ID)) continue;

    const rawText = post.text || post.caption;
    if (!rawText || !rawText.trim()) continue;

    const { title, body, tags } = parsePost(rawText);
    if (!title || !body) {
      console.log(`Пропускаю пост без заголовка/текста (update ${update.update_id})`);
      continue;
    }

    const date = new Date(post.date * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    let slug = slugify(title);
    let filename = `${dateStr}-${slug}.md`;
    let filePath = path.join(POSTS_DIR, filename);
    let suffix = 2;
    while (existsSync(filePath)) {
      filename = `${dateStr}-${slug}-${suffix}.md`;
      filePath = path.join(POSTS_DIR, filename);
      suffix += 1;
    }

    const frontMatter = [
      "---",
      "layout: post",
      `title: ${yamlString(title)}`,
      `date: ${dateStr}`,
      "categories: [notes]",
      `tags: ${yamlList(tags)}`,
      'excerpt: ""',
      "---",
      "",
      body,
      "",
    ].join("\n");

    mkdirSync(POSTS_DIR, { recursive: true });
    writeFileSync(filePath, frontMatter);
    createdFiles.push(filePath);
    console.log(`Создан ${filePath}`);

    if (ANTHROPIC_API_KEY) {
      try {
        const en = await translateToEnglish(title, tags, body);
        const finalSlug = filename.slice(dateStr.length + 1, -3);
        const enFilename = filename.replace(/\.md$/, "-en.md");
        const enFilePath = path.join(POSTS_DIR, enFilename);
        const enPermalink = `/en/notes/${dateStr.split("-").join("/")}/${finalSlug}/`;

        const enFrontMatter = [
          "---",
          "layout: post",
          `title: ${yamlString(en.title)}`,
          `date: ${dateStr}`,
          "lang: en",
          "locale: en_US",
          `permalink: ${enPermalink}`,
          "categories: [notes]",
          `tags: ${yamlList(en.tags)}`,
          'excerpt: ""',
          "---",
          "",
          en.body,
          "",
        ].join("\n");

        writeFileSync(enFilePath, enFrontMatter);
        createdFiles.push(enFilePath);
        console.log(`Создан ${enFilePath}`);
      } catch (err) {
        console.error(`Перевод не удался, публикую только RU: ${err.message}`);
      }
    }
  }

  saveState({ offset: lastOffset });

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `has_new_posts=${createdFiles.length > 0}\n`,
      { flag: "a" }
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
