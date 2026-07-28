(() => {
  try {
    const saved = localStorage.getItem("jfb_theme_v1");
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.dataset.theme = saved || preferred;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
