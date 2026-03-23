const root = document.documentElement;
const toggle = document.querySelector("[data-theme-toggle]");
const media = window.matchMedia("(prefers-color-scheme: light)");

function applyTheme(theme, persist = false) {
  root.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));

  if (toggle) {
    toggle.setAttribute("aria-pressed", String(theme === "light"));
  }

  if (persist) {
    window.localStorage.setItem("theme", theme);
  }
}

if (toggle) {
  const storedTheme = window.localStorage.getItem("theme");
  applyTheme(storedTheme || root.dataset.theme || (media.matches ? "light" : "dark"));

  toggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme, true);
  });
}

media.addEventListener("change", (event) => {
  if (window.localStorage.getItem("theme")) {
    return;
  }

  applyTheme(event.matches ? "light" : "dark");
});
