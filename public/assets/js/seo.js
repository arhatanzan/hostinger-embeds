(function () {
  "use strict";

  var profiles = {
    "/": ["Kaif Abbas | Research, Writing & Civic Impact", "Explore Kaif Abbas's research, published writing, civic engagement, leadership and social impact."],
    "/blog": ["Blog | Kaif Abbas", "Explore Kaif Abbas's published articles, research, insights and guides. Browse posts by topic, publication date and reading time."],
    "/products": ["Digital & Physical Products | Kaif Abbas", "Browse Kaif Abbas's digital downloads and physical products, with links to download or visit the original store."],
    "/lab": ["Democracy Lab | Kaif Abbas", "Explore interactive civic games about democracy, media and public life in Kaif Abbas's Democracy Lab."],
    "/democracy-lab": ["Democracy Lab | Kaif Abbas", "Explore interactive civic games about democracy, media and public life in Kaif Abbas's Democracy Lab."],
    "/civic-games": ["Civic Games | Kaif Abbas", "Play interactive civic games exploring democracy, media and public life."],
    "/book-a-meeting": ["Book a Meeting | Kaif Abbas", "Book a meeting with Kaif Abbas using the online scheduling calendar."],
    "/contact": ["Contact | Kaif Abbas", "Get in touch with Kaif Abbas and explore opportunities to connect."],
    "/about": ["About Kaif Abbas", "Learn about Kaif Abbas's work in research, writing, civic engagement and social impact."],
    "/research-and-publications": ["Research & Publications | Kaif Abbas", "Explore Kaif Abbas's research, publications and books on democracy, courts, media and public life."],
    "/leadership-and-service": ["Leadership & Service | Kaif Abbas", "Explore Kaif Abbas's professional leadership, community service and early leadership initiatives."],
    "/judging-and-global-engagement": ["Judging & Global Engagement | Kaif Abbas", "Explore Kaif Abbas's judging experience and engagement with international awards and evaluation programmes."],
    "/advocacy-and-social-impact": ["Advocacy & Social Impact | Kaif Abbas", "Explore Kaif Abbas's advocacy, outreach and community initiatives supporting inclusion and social impact."],
    "/poetry-and-art": ["Poetry & Art | Kaif Abbas", "Explore Kaif Abbas's creative work, poetry, art and cultural perspectives."],
    "/honors": ["Honors | Kaif Abbas", "Explore the honors and recognition received by Kaif Abbas for civic service and social impact."]
  };

  function meta(doc, attribute, key, value) {
    var element = doc.head.querySelector("meta[" + attribute + '="' + key + '"]');
    if (!element) {
      element = doc.createElement("meta");
      element.setAttribute(attribute, key);
      doc.head.appendChild(element);
    }
    element.content = value;
  }

  function jsonLd(doc, id, value) {
    var element = doc.getElementById(id);
    if (!element) {
      element = doc.createElement("script");
      element.id = id;
      element.type = "application/ld+json";
      doc.head.appendChild(element);
    }
    element.textContent = JSON.stringify(value);
  }

  function pageDocument(root) {
    return root === document ? document : root.host ? root.host.ownerDocument : null;
  }

  window.KB_SEO = {
    updatePage: function (root) {
      var doc = pageDocument(root);
      if (!doc) return;
      var url = new URL(doc.location.href);
      var path = url.pathname.replace(/\/+$/, "") || "/";
      var profile = profiles[path];
      // The civic-games embed owns metadata for a selected game's query URL.
      if (!profile || (path === "/civic-games" && (url.search || url.hash || doc.getElementById("civic-game-jsonld")))) return;
      url.search = "";
      url.hash = "";
      url.pathname = path;
      if (url.hostname === "kaifabbas.com") url.hostname = "www.kaifabbas.com";
      doc.title = profile[0];
      meta(doc, "name", "description", profile[1]);
      meta(doc, "property", "og:title", profile[0]);
      meta(doc, "property", "og:description", profile[1]);
      meta(doc, "property", "og:url", url.href);
      meta(doc, "property", "og:type", "website");
      meta(doc, "name", "twitter:card", "summary_large_image");
      meta(doc, "name", "twitter:title", profile[0]);
      meta(doc, "name", "twitter:description", profile[1]);
      var canonical = doc.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = doc.createElement("link");
        canonical.rel = "canonical";
        doc.head.appendChild(canonical);
      }
      canonical.href = url.href;
      jsonLd(doc, "kb-page-jsonld", {
        "@context": "https://schema.org",
        "@type": ["/blog", "/products", "/lab", "/democracy-lab"].includes(path) ? "CollectionPage" : "WebPage",
        "@id": url.href + "#webpage",
        url: url.href,
        name: profile[0],
        description: profile[1],
        inLanguage: "en"
      });
    },

    updateCollection: function (root, pageKey, products, renderAction) {
      var doc = pageDocument(root);
      if (!doc) return;
      var items = products.flatMap(function (product) {
        var template = document.createElement("template");
        template.innerHTML = renderAction(product);
        var anchor = template.content.querySelector("a[href]");
        if (!anchor || !product.title || anchor.getAttribute("href") === "#") return [];
        var url;
        try {
          url = new URL(anchor.getAttribute("href"), doc.location.href);
        } catch (error) {
          console.error("[seo] invalid catalog URL:", anchor.getAttribute("href"), error);
          return [];
        }
        if (!["http:", "https:"].includes(url.protocol)) return [];
        return [{ "@type": "ListItem", position: 0, name: product.title, url: url.href }];
      });
      items.forEach(function (item, index) { item.position = index + 1; });
      jsonLd(doc, "kb-" + pageKey + "-jsonld", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items
      });
    }
  };
})();
