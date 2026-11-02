// One-line Hostinger embed; content is inserted where this tag sits:
//   <script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="lab"></script>
//   <script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-block="research"></script>
(function () {
  var me = document.currentScript;
  var base = me.src.split("?")[0].replace(/assets\/js\/[^/]+$/, "");
  var embed = me.getAttribute("data-embed");
  var block = me.getAttribute("data-block");
  var name = embed || block;
  var contentUrl = base + (embed ? "embeds/" : "blocks/") + name + ".html";

  if (!name || !/^[a-z0-9_-]+$/.test(name)) {
    console.error("[embed] add data-embed=\"name\" or data-block=\"name\" to the script tag");
    return;
  }

  var hostFrame = null;
  try {
    hostFrame = window.frameElement;
  } catch (err) {
    console.warn("[embed] host page is inaccessible; using iframe rendering:", err);
  }
  var hostContainer = hostFrame && hostFrame.parentElement;
  var hostLayout = hostContainer && hostContainer.parentElement;
  var hostBlock = hostLayout && hostLayout.parentElement;
  var hostWindow = null;
  var hostResizeObserver = null;
  var originalFrameStyles = null;
  var originalContainerStyles = null;
  var originalLayoutStyles = null;
  var originalBlockStyles = null;
  var frameStyleProperties = ["width", "max-width", "position", "left", "transform", "box-sizing"];
  var containerStyleProperties = ["width", "max-width", "margin-left"];

  function captureStyles(element, properties) {
    var styles = {};
    properties.forEach(function (property) {
      styles[property] = {
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property)
      };
    });
    return styles;
  }

  function restoreStyles(element, styles, properties) {
    properties.forEach(function (property) {
      var original = styles[property];
      if (original.value) element.style.setProperty(property, original.value, original.priority);
      else element.style.removeProperty(property);
    });
  }

  function fitHostFrame() {
    if (!hostFrame || !hostContainer || !hostLayout || !hostBlock) return;
    try {
      var viewportWidth = hostFrame.ownerDocument.documentElement.clientWidth;
      if (viewportWidth > 0 && viewportWidth <= 768) {
        if (!originalFrameStyles) {
          originalFrameStyles = captureStyles(hostFrame, frameStyleProperties);
          originalContainerStyles = captureStyles(hostContainer, containerStyleProperties);
          originalLayoutStyles = captureStyles(hostLayout, ["--m-grid-row"]);
          originalBlockStyles = captureStyles(hostBlock, ["--m-grid-template-rows", "--t-grid-template-rows", "--m-block-min-height", "--t-block-min-height"]);
        }

        restoreStyles(hostFrame, originalFrameStyles, frameStyleProperties);
        restoreStyles(hostContainer, originalContainerStyles, containerStyleProperties);
        restoreStyles(hostLayout, originalLayoutStyles, ["--m-grid-row"]);
        restoreStyles(hostBlock, originalBlockStyles, ["--m-grid-template-rows", "--t-grid-template-rows", "--m-block-min-height", "--t-block-min-height"]);
        var containerLeft = hostContainer.getBoundingClientRect().left;
        hostContainer.style.width = viewportWidth + "px";
        hostContainer.style.maxWidth = viewportWidth + "px";
        hostContainer.style.marginLeft = -containerLeft + "px";
        hostLayout.style.setProperty("--m-grid-row", "1/2");
        hostBlock.style.setProperty("--m-grid-template-rows", "0px auto 0px");
        hostBlock.style.setProperty("--t-grid-template-rows", "auto 0px 0px");
        hostBlock.style.setProperty("--m-block-min-height", "auto");
        hostBlock.style.setProperty("--t-block-min-height", "auto");
        hostFrame.style.width = "100%";
        hostFrame.style.maxWidth = "100%";
        hostFrame.style.position = "static";
        hostFrame.style.left = "auto";
        hostFrame.style.transform = "none";
        hostFrame.style.boxSizing = "border-box";
      } else if (originalFrameStyles) {
        restoreStyles(hostFrame, originalFrameStyles, frameStyleProperties);
        restoreStyles(hostContainer, originalContainerStyles, containerStyleProperties);
        restoreStyles(hostLayout, originalLayoutStyles, ["--m-grid-row"]);
        restoreStyles(hostBlock, originalBlockStyles, ["--m-grid-template-rows", "--t-grid-template-rows", "--m-block-min-height", "--t-block-min-height"]);
        originalFrameStyles = null;
        originalContainerStyles = null;
        originalLayoutStyles = null;
        originalBlockStyles = null;
      }
      hostWindow = hostFrame.ownerDocument.defaultView;
    } catch (e) {}
  }

  fitHostFrame();
  try {
    hostWindow = hostFrame && hostFrame.ownerDocument.defaultView;
    if (hostWindow) {
      hostWindow.addEventListener("resize", fitHostFrame);
      if (hostWindow.ResizeObserver && hostWindow.document.documentElement) {
        hostResizeObserver = new hostWindow.ResizeObserver(fitHostFrame);
        hostResizeObserver.observe(hostWindow.document.documentElement);
      }
    }
  } catch (e) {}

  var host = document.createElement("div");
  var root = document;
  // Keep each embed's scripts in its own window, but expose visible content on the host page.
  if (hostFrame && hostFrame.hasAttribute("srcdoc") && me.getAttribute("data-render") !== "iframe") {
    var surface = hostFrame.ownerDocument.createElement("div");
    surface.setAttribute("data-kb-embed", name);
    surface.style.cssText = "display:block;width:100%;min-width:0;";
    root = surface.attachShadow({ mode: "open" });
    var reset = hostFrame.ownerDocument.createElement("style");
    reset.textContent = ":host{display:block;font:16px/1.5 system-ui,sans-serif;text-align:left;color:#0a2342}*{box-sizing:border-box;margin:0;padding:0}iframe{max-width:100%}";
    root.appendChild(reset);
    hostContainer.insertBefore(surface, hostFrame);
    hostFrame.style.display = "none";
    hostFrame.setAttribute("aria-hidden", "true");
    hostFrame.setAttribute("tabindex", "-1");
    window.KB_EMBED_ROOT = root;
    var syncHeight = function () {
      hostFrame.ownerDocument.defaultView.postMessage({
        action: "iframeHeightUpdated",
        height: surface.getBoundingClientRect().height,
        id: hostContainer.id
      }, hostFrame.ownerDocument.location.origin);
    };
    new ResizeObserver(syncHeight).observe(surface);
  } else if (window.parent !== window && !hostFrame) {
    console.warn("[embed] sandboxed host: content remains inside the iframe");
  }
  host.style.opacity = "0";
  host.style.transition = "opacity .15s ease";
  if (root === document) me.parentNode.insertBefore(host, me);
  else root.appendChild(host);

  // Only appears if loading is slow, so fast connections never see it flash by.
  var loader = document.createElement("div");
  loader.textContent = "Loading\u2026";
  loader.style.cssText = "font:14px/1.4 system-ui,sans-serif;color:#5a6673;padding:24px;text-align:center;opacity:0;transition:opacity .2s ease .4s;";
  host.parentNode.insertBefore(loader, host);
  setTimeout(function () { loader.style.opacity = "1"; }, 0);
  function removeLoader() {
    if (loader) { loader.parentNode.removeChild(loader); loader = null; }
  }

  var pendingStyles = [];
  if (block && !root.querySelector("link[data-kb-css]")) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = base + "assets/css/blocks.css";
    link.setAttribute("data-kb-css", "");
    (root === document ? document.head : root).appendChild(link);
    pendingStyles.push(link);
  }

  // Reveal once stylesheets are applied, so the page doesn't flash unstyled markup first.
  function waitForStyles(links, timeoutMs) {
    if (!links.length) return Promise.resolve();
    var ready = Promise.all(links.map(function (link) {
      return link.sheet ? Promise.resolve() : new Promise(function (resolve) {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
      });
    }));
    var timeout = new Promise(function (resolve) { setTimeout(resolve, timeoutMs); });
    return Promise.race([ready, timeout]);
  }

  // Scripts added via innerHTML don't execute, so re-create them one by one, keeping their order.
  function runScripts(root) {
    return Array.prototype.reduce.call(root.querySelectorAll("script"), function (prev, old) {
      return prev.then(function () {
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
          if (old.src) {
            s.onload = resolve;
            s.onerror = function () { reject(new Error("Script failed to load: " + s.src)); };
          } else {
            s.textContent = old.textContent;
          }
          old.remove();
          document.body.appendChild(s);
          if (!old.src) resolve();
        });
      });
    }, Promise.resolve());
  }

  // Aborts the fetch if it takes too long, instead of leaving the loader up forever.
  function timeoutSignal(ms) {
    if (!("AbortController" in window)) return undefined;
    var controller = new AbortController();
    setTimeout(function () { controller.abort(); }, ms);
    return controller.signal;
  }

  var seoReady = new Promise(function (resolve, reject) {
    var script = document.createElement("script");
    script.src = base + "assets/js/seo.js";
    script.onload = resolve;
    script.onerror = function () { reject(new Error("SEO helper failed to load")); };
    document.head.appendChild(script);
  });

  Promise.all([seoReady, fetch(contentUrl, { signal: timeoutSignal(20000) })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (html) {
      var template = document.createElement("template");
      template.innerHTML = html;
      // Netlify's injected page toolbar is not part of the content fragment.
      template.content.querySelectorAll('script[data-netlify-site-id][src]').forEach(function (script) {
        if (new URL(script.getAttribute("src"), contentUrl).pathname === "/.netlify/scripts/hud") {
          script.remove();
        }
      });
      // Resolve template assets against Netlify, not the embedding Hostinger page.
      template.content.querySelectorAll('link[rel="stylesheet"][href], script[src]').forEach(function (asset) {
        var attribute = asset.tagName === "SCRIPT" ? "src" : "href";
        asset.setAttribute(attribute, new URL(asset.getAttribute(attribute), contentUrl).href);
      });
      host.appendChild(template.content);
      pendingStyles = pendingStyles.concat(Array.prototype.slice.call(host.querySelectorAll('link[rel="stylesheet"]')));
      return waitForStyles(pendingStyles, 8000);
    })])
    .then(function () {
      removeLoader();
      host.style.opacity = "1";
      window.KB_SEO.updatePage(root);
      return runScripts(host);
    })
    .catch(function (err) {
      removeLoader();
      host.style.opacity = "1";
      host.innerHTML = '<p style="font:14px/1.4 system-ui,sans-serif;color:#7a2e2e;padding:16px;text-align:center;margin:0">Sorry, this content couldn\u2019t load. Please refresh the page.</p>';
      console.error("[embed] failed to load " + name + ":", err);
    });
})();
