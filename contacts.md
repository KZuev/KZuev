---
layout: page
title: Контакты
permalink: /contacts/
lead: Пишите — отвечу. Быстрее всего получается в почте и Telegram.
description: Как связаться с Кириллом Зуевым — почта, Telegram и социальные сети.
redirect_from:
  - /contact/
---

<ul class="contact-list">
  {%- for link in site.data.social %}
  <li>
    <span class="contact-list__name">{{ link.name }}</span>
    <a href="{{ link.url }}"{% unless link.url contains 'mailto:' %} rel="me noopener"{% endunless %}>{{ link.handle }}</a>
    {%- if link.note %}<span class="contact-list__note">{{ link.note.ru }}</span>{% endif %}
  </li>
  {%- endfor %}
</ul>

Если вопрос по конкретному проекту, лучше сразу завести issue в его репозитории
на [GitHub](https://github.com/{{ site.github_username }}) — так обсуждение
останется рядом с кодом и пригодится кому-то ещё.
