---
layout: post
title: "My own Lampa client for iOS"
date: 2026-08-14
lang: en
locale: en_US
permalink: /en/notes/2026/08/14/lampa-ios-client/
categories: [notes]
tags: ["iOS", "Lampa", "Trakt"]
excerpt: ""
---

Trakt.tv recently limited its free-tier API to one active connection at a
time. That used to be fine — Lampa-Trakt in the plugin and an external
player like Infuse would sync with the same account side by side without
issues. Not anymore: the moment one connects, the other loses its sync
with Trakt.

So I've decided to try building my own Lampa client for iOS, where
playback and Trakt sync live in one app instead of competing for the
single connection.

Still very much at the experimental stage.
