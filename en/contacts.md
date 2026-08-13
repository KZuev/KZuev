---
layout: page
title: Contact
permalink: /en/contacts/
lead: Write — I reply. Email and Telegram are fastest.
description: How to reach Kirill Zuev — email, Telegram, and social media.
---

<ul class="contact-list">
  {%- for link in site.data.social %}
  <li>
    <span class="contact-list__name">{{ link.name }}</span>
    <a href="{{ link.url }}"{% unless link.url contains 'mailto:' %} rel="me noopener"{% endunless %}>{{ link.handle }}</a>
    {%- if link.note %}<span class="contact-list__note">{{ link.note.en }}</span>{% endif %}
  </li>
  {%- endfor %}
</ul>

If your question is about a specific project, it's best to open an issue
in its repository on [GitHub](https://github.com/{{ site.github_username }}) —
that keeps the discussion next to the code, where it can help someone else too.
