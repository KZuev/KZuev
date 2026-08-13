---
layout: default
title: Проекты
permalink: /projects/
description: Открытые ИТ-проекты Кирилла Зуева — исходный код и демо.
---

<div class="shell">
  <header class="page-head">
    <h1>Проекты</h1>
    <p class="lead">То, что я делаю в свободное время. Исходники открыты, замечания и пулл-реквесты приветствуются.</p>
  </header>

  {%- assign projects = site.projects | sort: "order" %}
  {%- if projects.size > 0 %}
  <ul class="cards">
    {%- for project in projects %}
    <li class="card">
      <a class="card__link" href="{{ project.url | relative_url }}">
        <h2 class="card__title">{{ project.title }}</h2>
        <p class="card__text">{{ project.summary }}</p>
      </a>
      {%- if project.stack %}
      <ul class="tags">
        {%- for item in project.stack %}
        <li>{{ item }}</li>
        {%- endfor %}
      </ul>
      {%- endif %}
    </li>
    {%- endfor %}
  </ul>
  {%- else %}
  <p class="muted">Пока пусто.</p>
  {%- endif %}
</div>
