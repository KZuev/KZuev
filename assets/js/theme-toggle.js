(function () {
  "use strict";

  function effectiveTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncMeta(theme) {
    var meta = document.getElementById("theme-color-meta");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
  }

  function syncButton(button, theme) {
    var toDark = button.getAttribute("data-label-to-dark");
    var toLight = button.getAttribute("data-label-to-light");
    button.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    button.setAttribute("aria-label", theme === "dark" ? toLight : toDark);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector(".theme-toggle");
    if (button) {
      var current = effectiveTheme();
      syncButton(button, current);
      syncMeta(current);

      button.addEventListener("click", function () {
        var next = effectiveTheme() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try {
          localStorage.setItem("theme", next);
        } catch (err) {
          /* приватный режим или заблокированное хранилище — тема просто не запомнится */
        }
        syncButton(button, next);
        syncMeta(next);
      });
    }

    // Ручное переключение языка — тоже осознанный выбор, запоминаем его
    // так же, как тему. Целевой язык уже лежит в hreflang этой ссылки.
    var langSwitch = document.querySelector(".lang-switch");
    if (langSwitch) {
      langSwitch.addEventListener("click", function () {
        var target = langSwitch.getAttribute("hreflang");
        if (target === "ru" || target === "en") {
          try {
            localStorage.setItem("lang", target);
          } catch (err) {
            /* приватный режим или заблокированное хранилище — выбор просто не запомнится */
          }
        }
      });
    }
  });
})();
