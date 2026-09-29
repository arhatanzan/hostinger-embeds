// Usage: <div data-kb-block="research"></div>
//        <script src="https://arhatembeds.netlify.app/assets/js/blocks.js"></script>
// Loads blocks.css and fills each placeholder with blocks/<name>.html from the same origin/version as this script.
(function () {
  var base = document.currentScript.src.split("?")[0].replace(/assets\/js\/[^/]+$/, "");

  if (!document.querySelector("link[data-kb-css]")) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = base + "assets/css/blocks.css";
    link.setAttribute("data-kb-css", "");
    document.head.appendChild(link);
  }

  function load(el) {
    var name = el.getAttribute("data-kb-block");
    if (el.hasAttribute("data-kb-loaded") || !/^[a-z0-9_-]+$/.test(name)) return;
    el.setAttribute("data-kb-loaded", "");
    fetch(base + "blocks/" + name + ".html")
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        return res.text();
      })
      .then(function (html) { el.innerHTML = html; })
      .catch(function (err) { console.error("[kb-blocks] failed to load " + name + ":", err); });
  }

  function init() {
    document.querySelectorAll("[data-kb-block]").forEach(load);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
