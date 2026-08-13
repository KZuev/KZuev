---
layout: default
title: Записи
permalink: /blog/
description: Заметки о разработке, инструментах и собственных проектах.
---

<div class="shell">
  <header class="page-head">
    <h1>Записи</h1>
    <p class="lead">Заметки о разработке, инструментах и собственных проектах. Есть <a href="{{ '/feed.xml' | relative_url }}">RSS</a>.</p>
  </header>

  {%- if site.posts.size > 0 %}
  <div class="entries">
    {%- for post in site.posts %}
      {% include post-card.html post=post %}
    {%- endfor %}
  </div>
  {%- else %}
  <p class="muted">Пока пусто.</p>
  {%- endif %}
</div>
