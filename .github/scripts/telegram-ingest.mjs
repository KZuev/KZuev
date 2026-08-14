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
