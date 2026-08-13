---
title: Lampa-Plex
lang: en
locale: en_US
permalink: /en/projects/lampa-plex/
order: 3
summary: Personal Plex server integration for Lampa — a unified movie and show grid with direct playback.
status: In progress
status_kind: active
stack: [JavaScript, Plex API]
repo: https://github.com/KZuev/Lampa-Plex
---

## About the project

**Lampa-Plex** connects a personal [Plex](https://www.plex.tv/) server to
[Lampa](https://github.com/immisterio/Lampa): movies and shows from your libraries,
right inside Lampa's interface, playable through its own player or an external one.

## Features

- A dedicated "Plex" section in the menu: a unified content grid with filters by
  library, year, genre, country, and sorting
- Hybrid cards: Plex data layered onto TMDB cards, with a "Watch from Plex" button
- Direct Play — streams files straight from the server
- Watch progress synced between Lampa and Plex
- A local media cache — Plex availability badges show up across the whole app
- Watch status sync with Trakt.TV

## Limitations

- Direct Play only, no server-side transcoding
- External subtitles only
- One Plex server per session

## Installing

In Lampa: **Settings → Plugins → Add Plugin Manually**, then paste this address:

```
https://kzuev.github.io/Lampa-Plex/lampa-plex.js
```

After reloading, enter the server address and auth token in **Settings → Plex**,
then pick the libraries you want.

Source and discussion — on [GitHub](https://github.com/KZuev/Lampa-Plex).
