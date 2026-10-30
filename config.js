export const isSameNamespace = (doi, contextDoi) => {
  if (!doi) return false;
  const clean = String(doi).replace(/^https?:\/\/doi\.org\//i, "").trim();
  if (clean.startsWith("10.83395/") || clean.startsWith("10.85276/")) {
    return true;
  }
  if (contextDoi) {
    const cleanContext = String(contextDoi).replace(/^https?:\/\/doi\.org\//i, "").trim();
    const prefix = cleanContext.split("/")[0] + "/";
    if (prefix.startsWith("10.") && clean.startsWith(prefix)) {
      return true;
    }
  }
  return false;
};

export const filterPublications = (pubs, contextDoi) => {
  if (!Array.isArray(pubs)) return [];
  return pubs.filter((item) => {
    if (!item) return false;
    const doi = typeof item === "string" ? item : item.doi;
    const citation = typeof item === "object" ? item.citation : null;
    if (citation && String(citation).trim().length > 0) {
      return true;
    }
    if (isSameNamespace(doi, contextDoi)) {
      return false;
    }
    return true;
  });
};

function resolveVersionTitle(link, allLinks, genericTitles) {
  if (!link) return null;
  const rawTitle = link.title ? String(link.title).trim() : "";
  const isGeneric = !rawTitle || genericTitles.includes(rawTitle.toLowerCase());
  if (!isGeneric) {
    return rawTitle;
  }
  const matching = Array.isArray(allLinks)
    ? allLinks.find(
        (l) =>
          l &&
          l.href === link.href &&
          l.title &&
          !genericTitles.includes(String(l.title).trim().toLowerCase())
      )
    : null;
  if (matching && matching.title) {
    return String(matching.title).trim();
  }
  if (link.href) {
    const match = link.href.match(/_v?([0-9][0-9a-zA-Z._-]*)\.json$/);
    if (match && match[1]) {
      const v = match[1];
      return v.toLowerCase().startsWith("v") ? v : `v${v}`;
    }
  }
  return rawTitle || "Show";
}

export default {
  catalogUrl: "https://esa-earthcode.github.io/open-science-catalog-metadata-staging/catalog.json",
  catalogTitle: "Open Science Catalogue",
  catalogTitleAfterImage: null,
  catalogImage: null,
  apiUrl: "https://eoapi.workspace.earthcode.eox.at/stac",
  staticEndpoint: "https://esa-earthcode.github.io/open-science-catalog-metadata/",
  workspaceRoot: "https://workspace.earthcode-staging.earthcode.eox.at",
  githubDataRoot: "https://github.com/ESA-EarthCODE/open-science-catalog-metadata/tree/main",
  discourseRoot: "https://discourse-earthcode.eox.at",
  allowExternalAccess: true,
  allowedDomains: [],
  enforcedColorMode: "light",
  detectLocaleFromBrowser: false,
  storeLocale: false,
  locale: "en",
  fallbackLocale: "en",
  supportedLocales: ["en"],
  apiCatalogPriority: null,
  useTileLayerAsFallback: false,
  displayGeoTiffByDefault: false,
  displayPreview: true,
  displayOverview: true,
  displayOverviewsForChildren: false,
  buildTileUrlTemplate: null,
  getMapSourceOptions: null,
  pathPrefix: "/",
  historyMode: "memory",
  cardViewMode: "list",
  showFavorites: false,
  showSidebar: true,
  defaultCollectionSort: "title",
  defaultItemSort: null,
  showKeywordsInItemCards: false,
  showKeywordsInCatalogCards: false,
  preferredAssets: true,
  showThumbnailsAsAssets: false,
  searchResultsPerPage: null,
  itemsPerPage: null,
  collectionsPerPage: null,
  maxEntriesPerPage: 1000,
  defaultThumbnailSize: null,
  crossOriginMedia: null,
  requestHeaders: {},
  requestQueryParameters: {},
  socialSharing: ["email", "bsky", "mastodon", "x"],
  basemaps: {
    earth: [
      {
        url: "//tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg",
        is: "XYZ",
        title: "EOX Terrain Light",
        attributions:
          'Terrain light: Data &copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors and <a href="//maps.eox.at/#data" target="_blank">others</a>, Rendering &copy; <a href="http://eox.at" target="_blank">EOX</a>',
        projection: "EPSG:3857",
      },
    ],
  },
  ignoreMetadata: (object, fields, type) => {
    if ((type === "CatalogLike" || type === "Item") && object) {
      fields.push("access");
      Object.keys(object).forEach((key) => {
        if (key.startsWith("fair:") || key.startsWith("osc:")) {
          fields.push(key);
        }
      });
      if (object.properties && typeof object.properties === "object") {
        Object.keys(object.properties).forEach((key) => {
          if (key.startsWith("fair:") || key.startsWith("osc:")) {
            fields.push(key);
          }
        });
      }
      fields.push(
        "themes",
        "variables",
        "status",
        "osc:status",
        "missions",
        "region",
        "project"
      );

      // If sci:doi has the same namespace and no citation text, ignore it from the table
      // (since it is already displayed prominently in the header)
      const rawDoi = object["sci:doi"] || object.properties?.["sci:doi"];
      const rawCitation = object["sci:citation"] || object.properties?.["sci:citation"];
      if (rawDoi && isSameNamespace(rawDoi, rawDoi) && !rawCitation) {
        fields.push("sci:doi");
      }

      // If sci:publications has no remaining items after filtering same-namespace items without citation, ignore it
      const rawPubs = object["sci:publications"] || object.properties?.["sci:publications"];
      if (Array.isArray(rawPubs)) {
        const remaining = filterPublications(rawPubs, rawDoi);
        if (remaining.length === 0) {
          fields.push("sci:publications");
        }
      }
    }
    return fields;
  },
  preprocessSTAC: (stac) => {
    if (Array.isArray(stac.links)) {
      stac.links.forEach((l) => {
        if (l && typeof l.href === "string") {
          const match = l.href.match(/#\/external\/(.+)$/);
          if (match && match[1]) {
            try {
              l.href = decodeURIComponent(match[1]);
            } catch {
              l.href = match[1];
            }
          }
          if (l.href.startsWith("https://opensciencedata.esa.int/")) {
            l.href = l.href.replace(/^https?:\/\/opensciencedata\.esa\.int\/(stac-browser\/)?/, "/");
          }
        }
      });
      const rawLinks = stac.links.map((l) => ({
        rel: l.rel,
        href: l.href,
        title: l.title,
        type: l.type,
      }));
      stac["osc:links"] = rawLinks;

      const isCanonical =
        rawLinks.some((l) => l.rel === "has-version") &&
        !rawLinks.some((l) => l.rel === "is-version-of");

      const filteredLinks = [];
      for (const link of stac.links) {
        if (stac.type === "Feature" && link.rel === "child") {
          link.rel = "related";
          if (link.href.includes("/experiments/")) {
            link.title = `Experiment: ${link.title}`;
          }
          if (link.href.includes("/workflows/")) {
            link.title = `Workflow: ${link.title}`;
          }
          if (link.href.includes("/products/")) {
            link.title = `Product: ${link.title}`;
          }
        }

        // Suppress false "Outdated" deprecation banner on Canonical overview collections
        if (isCanonical && link.rel === "latest-version") {
          continue;
        }

        // Allow internal STAC Browser navigation for version links (replaces src/rels.js patch)
        if (link.rel === "has-version" || link.rel === "is-version-of") {
          link.rel = "related";
        }

        // Resolve specific version titles on versioned collections
        if (!isCanonical && link.rel === "latest-version") {
          link.title = resolveVersionTitle(link, rawLinks, ["latest version", "latest"]);
        } else if (!isCanonical && link.rel === "successor-version") {
          link.title = resolveVersionTitle(link, rawLinks, [
            "successor version",
            "next version",
            "successor",
          ]);
        } else if (!isCanonical && link.rel === "predecessor-version") {
          link.title = resolveVersionTitle(link, rawLinks, [
            "predecessor version",
            "previous version",
            "predecessor",
          ]);
        }

        // Suppress duplicate OSC metadata cross-links (rel="related") from "Additional Resources"
        if (
          link.rel !== "child" &&
          link.href &&
          (link.href.includes("/projects/") ||
            link.href.includes("/themes/") ||
            link.href.includes("/variables/") ||
            link.href.includes("/eo-missions/") ||
            link.href.includes("/missions/"))
        ) {
          continue;
        }

        // Suppress duplicate Access links and sub-catalog child links on product pages
        // (handled by the unified OscDataAccess widget via stac['osc:links'])
        if (stac["osc:type"] === "product") {
          const titleLower = (link.title || "").toLowerCase();
          const isDocOrLicense =
            titleLower.includes("documentation") ||
            titleLower.includes("license") ||
            titleLower.includes("publication");
          const isAccessLink =
            link.href &&
            !isDocOrLicense &&
            (link.rel === "access" ||
              link.rel === "osc:data-access" ||
              titleLower === "access" ||
              titleLower.includes("data access") ||
              titleLower.includes("access data") ||
              (link.rel === "via" && (titleLower === "" || titleLower === "access")));

          if (isAccessLink || link.rel === "child") {
            continue;
          }
        }

        filteredLinks.push(link);
      }
      stac.links = filteredLinks;
    }
    return stac;
  },
  authConfig: null,
  crs: {},
  footerLinks: null,
};
