// Usage: <div data-kb-block="research"></div>
//        <script src="https://arhatembeds.netlify.app/assets/js/blocks.js"></script>
// Loads blocks.css and fills each placeholder with blocks/<name>.html from the same origin/version as this script.
(function () {
  var base = document.currentScript.src.split("?")[0].replace(/assets\/js\/[^/]+$/, "");

  function load(el) {
    var name = el.getAttribute("data-kb-block");
    if (el.hasAttribute("data-kb-loaded") || !/^[a-z0-9_-]+$/.test(name)) return;
    el.setAttribute("data-kb-loaded", "");
    var script = document.createElement("script");
    script.src = base + "assets/js/embed.js";
    script.setAttribute("data-block", name);
    script.onerror = function () {
      el.textContent = "Sorry, this content couldn't load. Please refresh the page.";
      console.error("[kb-blocks] failed to load " + name);
    };
    el.appendChild(script);
  }

  function init() {
    document.querySelectorAll("[data-kb-block]").forEach(load);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
