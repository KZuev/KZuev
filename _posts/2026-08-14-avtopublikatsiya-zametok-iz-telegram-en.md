---
layout: post
title: "Auto-publishing notes from Telegram"
date: 2026-08-14
lang: en
locale: en_US
permalink: /en/notes/2026/08/14/avtopublikatsiya-zametok-iz-telegram/
categories: [notes]
tags: ["Web", "GitHub", "Automation"]
excerpt: ""
---

Built this for convenience — instead of opening an editor, committing markdown, and pushing, I now just write notes straight into a Telegram channel, like a notebook. But for it to actually land on the site instead of just sitting in the channel, it needed some automation.

I put it together with GitHub Actions: every hour, an Action polls the Telegram Bot API, looks for new posts in the channel, parses the first line as the title and trailing hashtags as tags, and commits the finished note straight to the main branch.

Along the way I ran into a couple of non-obvious things. Turns out GitHub Actions doesn't trigger other workflows on push if the commit was made with the default GITHUB_TOKEN — that's a safeguard against infinite chains.
