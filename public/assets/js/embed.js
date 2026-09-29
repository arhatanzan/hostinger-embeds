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

  var host = document.createElement("div");
  me.parentNode.insertBefore(host, me);

  if (block && !document.querySelector("link[data-kb-css]")) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = base + "assets/css/blocks.css";
    link.setAttribute("data-kb-css", "");
    document.head.appendChild(link);
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

  fetch(base + (embed ? "embeds/" : "blocks/") + name + ".html")
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (html) {
      host.innerHTML = html;
      return runScripts(host);
    })
    .catch(function (err) { console.error("[embed] failed to load " + name + ":", err); });
})();
