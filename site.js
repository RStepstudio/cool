(function () {
  var baseTitle = document.title;

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem("pm_theme"); } catch (e) {}
  if (saved) root.setAttribute("data-theme", saved);

  function initTheme() {
    var btn = document.getElementById("themeBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("pm_theme", next); } catch (e) {}
    });
  }

  /* ---------- contextual window title ---------- */
  function pageKey() {
    var f = location.pathname.split("/").pop();
    return f && f !== "" ? f : "index.html";
  }

  function applyPageTitle() {
    var f = pageKey();
    if (f === "index.html") return; // handled live by the checker
    var map = {
      "password-strength-guide.html": "Password Strength Guide",
      "password-generator.html": "Password Generator",
      "password-crack-time.html": "Password Crack Time",
      "password-entropy-calculator.html": "Password Entropy Calculator",
      "have-i-been-pwned-checker.html": "Breach Checker",
      "common-passwords-list.html": "Common Passwords to Avoid",
      "strong-password-examples.html": "Strong Password Examples",
      "secure-password-tips.html": "Secure Password Tips",
      "password-security-guide.html": "Password Security Guide",
      "best-password-manager.html": "Best Password Managers",
      "password-checker-online.html": "Online Password Checker",
      "top-10-password-checkers.html": "Top 10 Password Checkers"
    };
    var label = map[f];
    if (label) document.title = label + " — PassMeter";
  }

  /* ---------- visit counter ---------- */
  function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function localCounts() {
    var now = new Date();
    var day = now.toISOString().slice(0, 10);
    var mon = new Date(now);
    mon.setUTCDate(mon.getUTCDate() - ((mon.getUTCDay() + 6) % 7));
    var week = mon.toISOString().slice(0, 10);
    var store = {};
    try { store = JSON.parse(localStorage.getItem("pm_stats") || "{}"); } catch (e) { store = {}; }
    store[day] = (store[day] || 0) + 1;
    store["w:" + week] = (store["w:" + week] || 0) + 1;
    store.total = (store.total || 0) + 1;
    try { localStorage.setItem("pm_stats", JSON.stringify(store)); } catch (e) {}
    return { today: store[day] || 0, week: store["w:" + week] || 0, total: store.total || 0 };
  }

  function ensureHost() {
    var host = document.querySelector("[data-visits]");
    if (host) return host;
    var f = document.querySelector("footer");
    if (!f) return null;
    var strip = document.createElement("div");
    strip.className = "visits";
    strip.setAttribute("data-visits", "");
    f.parentNode.insertBefore(strip, f);
    return strip;
  }

  function render(c, isLocal) {
    var host = ensureHost();
    if (!host) return;
    host.innerHTML =
      '<span class="v-item"><b>' + fmt(c.today) + "</b> today</span>" +
      '<span class="v-sep"></span>' +
      '<span class="v-item"><b>' + fmt(c.week) + "</b> this week</span>" +
      '<span class="v-sep"></span>' +
      '<span class="v-item"><b>' + fmt(c.total) + "</b> all time</span>" +
      (isLocal ? '<span class="v-note">this device</span>' : "");
  }

  function loadStats() {
    fetch("/api/stats", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        if (d && d.source === "kv") render(d, false);
        else render(localCounts(), true);
      })
      .catch(function () { render(localCounts(), true); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initTheme(); applyPageTitle(); loadStats(); });
  } else {
    initTheme(); applyPageTitle(); loadStats();
  }

  window.passMeter = {
    setTitle: function (suffix) { document.title = suffix ? suffix + " — PassMeter" : baseTitle; }
  };
})();
