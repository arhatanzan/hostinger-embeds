// Hostinger site-wide custom code: handles older, directly pasted static HTML embeds.
(function () {
  "use strict";
  var base = document.currentScript.src.split("?")[0].replace(/assets\/js\/[^/]+$/, "");
  var processed = new WeakSet();
  var scheduled = false;

  function promote(frame) {
    if (processed.has(frame)) return;
    var doc = frame.contentDocument;
    if (!doc || !doc.body || !doc.body.childElementCount) return;
    if (doc.querySelector('script[data-embed], script[data-block], script[src*="/assets/js/blocks.js"]')) return;
    var scripts = Array.from(doc.scripts);
    if (scripts.some(function (script) {
      return script.type !== "application/ld+json" &&
        !(script.textContent.includes("iframeHeightUpdated") && script.textContent.includes("ResizeObserver"));
    })) {
      processed.add(frame);
      console.warn("[site-seo] interactive legacy embed left in its iframe; replace it with a supported embed.js snippet:", frame);
      return;
    }

    processed.add(frame);
    var surface = document.createElement("div");
    surface.setAttribute("data-kb-legacy", "");
    surface.style.cssText = "display:block;width:100%;min-width:0;";
    var root = surface.attachShadow({ mode: "open" });
    var reset = document.createElement("style");
    reset.textContent = ":host{display:block;font:16px/1.5 system-ui,sans-serif;text-align:left}*{box-sizing:border-box;margin:0;padding:0}iframe{max-width:100%}";
    root.appendChild(reset);
    doc.head.querySelectorAll('style, link[rel="stylesheet"]').forEach(function (element) {
      var clone = element.cloneNode(true);
      if (clone.tagName === "STYLE") clone.textContent = clone.textContent.replace(/:root\b/g, ":host");
      root.appendChild(clone);
    });
    Array.from(doc.body.childNodes).forEach(function (element) {
      if (element.nodeName === "SCRIPT") return;
      var clone = element.cloneNode(true);
      if (clone.nodeType === Node.ELEMENT_NODE) {
        clone.querySelectorAll("script").forEach(function (script) { script.remove(); });
        if (clone.tagName === "STYLE") clone.textContent = clone.textContent.replace(/:root\b/g, ":host");
      }
      root.appendChild(clone);
    });
    var container = frame.parentElement;
    container.insertBefore(surface, frame);
    frame.style.display = "none";
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("tabindex", "-1");
    new ResizeObserver(function () {
      window.postMessage({
        action: "iframeHeightUpdated",
        height: surface.getBoundingClientRect().height,
        id: container.id
      }, location.origin);
    }).observe(surface);
  }

  function refresh() {
    scheduled = false;
    document.querySelectorAll("iframe.grid-embed__iframe[srcdoc]").forEach(promote);
    window.KB_SEO.updatePage(document);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  function start() {
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    // srcdoc can finish loading after the iframe has been inserted into the page.
    document.addEventListener("load", function (event) {
      if (event.target instanceof HTMLIFrameElement) schedule();
    }, true);
    window.addEventListener("popstate", schedule);
    schedule();
  }

  var helper = document.createElement("script");
  helper.src = base + "assets/js/seo.js";
  helper.onload = function () {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  };
  helper.onerror = function () { console.error("[site-seo] SEO helper failed to load"); };
  document.head.appendChild(helper);
})();
