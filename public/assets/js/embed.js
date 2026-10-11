// One-line Hostinger embed; content is inserted where this tag sits:
//   <script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-embed="lab"></script>
//   <script src="https://arhatembeds.netlify.app/assets/js/embed.js" data-block="research"></script>
(function () {
  var me = document.currentScript;
  var base = me.src.split("?")[0].replace(/assets\/js\/[^/]+$/, "");
  var embed = me.getAttribute("data-embed");
  var block = me.getAttribute("data-block");
  var name = embed || block;

  if (!name || !/^[a-z0-9_-]+$/.test(name)) {
    console.error("[embed] add data-embed=\"name\" or data-block=\"name\" to the script tag");
    return;
  }

  var hostFrame = window.frameElement;
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
  host.style.opacity = "0";
  host.style.transition = "opacity .15s ease";
  me.parentNode.insertBefore(host, me);

  // Only appears if loading is slow, so fast connections never see it flash by.
  var loader = document.createElement("div");
  loader.textContent = "Loading\u2026";
  loader.style.cssText = "font:14px/1.4 system-ui,sans-serif;color:#5a6673;padding:24px;text-align:center;opacity:0;transition:opacity .2s ease .4s;";
  me.parentNode.insertBefore(loader, me);
  setTimeout(function () { loader.style.opacity = "1"; }, 0);
  function removeLoader() {
    if (loader) { loader.parentNode.removeChild(loader); loader = null; }
  }

  var pendingStyles = [];
  if (block && !document.querySelector("link[data-kb-css]")) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = base + "assets/css/blocks.css";
    link.setAttribute("data-kb-css", "");
    document.head.appendChild(link);
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
        return new Promise(function (resolve) {
          var s = document.createElement("script");
          Array.prototype.forEach.call(old.attributes, function (a) { s.setAttribute(a.name, a.value); });
          if (old.src) {
            s.onload = s.onerror = resolve;
          } else {
            s.textContent = old.textContent;
          }
          old.parentNode.replaceChild(s, old);
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

  fetch(base + (embed ? "embeds/" : "blocks/") + name + ".html", { signal: timeoutSignal(20000) })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (html) {
      host.innerHTML = html;
      pendingStyles = pendingStyles.concat(Array.prototype.slice.call(host.querySelectorAll('link[rel="stylesheet"]')));
      return waitForStyles(pendingStyles, 8000);
    })
    .then(function () {
      removeLoader();
      host.style.opacity = "1";
      return runScripts(host);
    })
    .catch(function (err) {
      removeLoader();
      host.style.opacity = "1";
      host.innerHTML = '<p style="font:14px/1.4 system-ui,sans-serif;color:#7a2e2e;padding:16px;text-align:center;margin:0">Sorry, this content couldn\u2019t load. Please refresh the page.</p>';
      console.error("[embed] failed to load " + name + ":", err);
    });
})();
