(function () {
  try {
    var raw = localStorage.getItem("cesizen-a11y")
    if (!raw) return
    var preferences = JSON.parse(raw)
    var classes = document.documentElement.classList
    if (preferences.textSize === "large") classes.add("a11y-text-large")
    if (preferences.textSize === "xlarge") classes.add("a11y-text-xlarge")
    if (preferences.highContrast) classes.add("a11y-high-contrast")
    if (preferences.underlineLinks) classes.add("a11y-underline-links")
    if (preferences.reduceMotion) classes.add("a11y-reduce-motion")
    if (preferences.dyslexia) classes.add("a11y-dyslexia")
    if (preferences.spacing) classes.add("a11y-spacing")
  } catch (_) {
    // Une préférence locale invalide ne doit jamais empêcher le rendu du site.
  }
})()
