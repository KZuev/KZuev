---
title: Lampa-Trakt
lang: en
locale: en_US
permalink: /en/projects/lampa-trakt/
date: 2026-05-21
summary: A Trakt.tv plugin for Lampa — watch history, show statuses, multiple accounts and shared viewing.
status: In progress
status_kind: active
stack: [JavaScript, Trakt API]
repo: https://github.com/KZuev/Lampa-Trakt
redirect_from:
  - /en/projects/lampatrakt/
---

## About the project

**Lampa-Trakt** is a plugin for [Lampa](https://github.com/immisterio/Lampa) that syncs it with
[Trakt.tv](https://trakt.tv): watch history, show statuses, up to six accounts at once, and
shared viewing across profiles.

It's a fork of the [original LampaME plugin](https://lampame.github.io/main/trakttv.js) —
I keep developing it further.

## Features

- Up to six Trakt accounts at once, with a quick switcher
- Shared viewing: lists show only what's on every selected account's watchlist
- Automatic torrent selection and playback, with progress synced to TorrServer
- Poster badges: watched, in progress, on watchlist, digital release date
- Watch history, show statuses (watching / dropped / completed), upcoming episode schedule
- Personal recommendations and custom lists

## Installing

In Lampa: **Settings → Plugins → Add Plugin Manually**, then paste this file's address:

```
https://raw.githubusercontent.com/KZuev/Lampa-Trakt/main/trakttv.js
```

After Lampa reloads, enter your Trakt app's Client ID and Secret once.

Source and discussion — on [GitHub](https://github.com/KZuev/Lampa-Trakt).
