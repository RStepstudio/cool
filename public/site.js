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
    var seg = location.pathname.replace(/\/+$/, "").split("/").pop();
    return seg === "" ? "index" : seg;
  }

  function applyPageTitle() {
    var f = pageKey();
    if (f === "index") return; // handled live by the checker
    var map = {
      "password-strength-guide": "Password Strength Guide",
      "password-generator": "Password Generator",
      "password-crack-time": "Password Crack Time",
      "password-entropy-calculator": "Password Entropy Calculator",
      "have-i-been-pwned-checker": "Breach Checker",
      "common-passwords-list": "Common Passwords to Avoid",
      "strong-password-examples": "Strong Password Examples",
      "secure-password-tips": "Secure Password Tips",
      "password-security-guide": "Password Security Guide",
      "best-password-manager": "Best Password Managers",
      "password-checker-online": "Online Password Checker",
      "top-10-password-checkers": "Top 10 Password Checkers"
    };
    var label = map[f];
    if (label) document.title = label + " — PassMeter";
  }

  /* ---------- absolute URLs for social cards + JSON-LD ---------- */
  function absoluteUrls() {
    var origin = location.origin;
    var og = document.querySelector('meta[property="og:url"]');
    if (og) og.setAttribute("content", origin + location.pathname);
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.setAttribute("href", origin + location.pathname);
    var blocks = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < blocks.length; i++) {
      try {
        var raw = blocks[i].textContent.split("__SITE_ORIGIN__").join(origin);
        var data = JSON.parse(raw);
        upgrade(data, origin);
        blocks[i].textContent = JSON.stringify(data);
      } catch (e) {}
    }
  }

  function upgrade(node, origin) {
    if (!node || typeof node !== "object") return;
    for (var k in node) {
      if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
      var v = node[k];
      if (typeof v === "string" && !/^https?:\/\//i.test(v) && (v === "./" || /\.html$/.test(v))) {
        node[k] = origin + "/" + (v === "./" ? "" : v);
      } else if (v && typeof v === "object") {
        upgrade(v, origin);
      }
    }
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
    document.addEventListener("DOMContentLoaded", function () { initTheme(); applyPageTitle(); absoluteUrls(); loadStats(); });
  } else {
    initTheme(); applyPageTitle(); absoluteUrls(); loadStats();
  }

  window.passMeter = {
    setTitle: function (suffix) { document.title = suffix ? suffix + " — PassMeter" : baseTitle; }
  };
})();
