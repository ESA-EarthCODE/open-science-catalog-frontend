import CONFIG from "../merged-config.js";
import { ensureStacBrowserLoaded } from "../stac-fields-setup.js";
import "../widgets/osc-product-header.js";
import "../widgets/osc-data-access.js";
import "../widgets/osc-fair-assessment.js";
import "../widgets/osc-forum-topics.js";

function toInternalBrowserPath(pathname) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  let rel = pathname || "";
  if (prefix !== "/" && rel.startsWith(prefix)) {
    rel = "/" + rel.slice(prefix.length);
  }
  rel = rel.replace(/^\/+/, "");
  if (!rel || rel === "catalog" || rel === "catalog/") {
    return "/";
  }
  if (!rel.startsWith("/")) {
    rel = "/" + rel;
  }
  if (rel === "/search" || rel === "/favorites" || rel === "/validation") {
    return rel;
  }
  if (!rel.endsWith(".json")) {
    rel = `${rel}.json`;
  }
  return rel;
}

function toOuterCleanPath(internalPath) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  if (!internalPath) return `${prefix}catalog`;
  const [pathname] = internalPath.split("?");
  let clean = pathname.replace(/\.json$/, "");
  if (!clean || clean === "/" || clean === "/index" || clean === "/catalog") {
    return `${prefix}catalog`;
  }
  return prefix + clean.replace(/^\/+/, "");
}

function injectShadowEnhancements(browserEl) {
  const attachStyles = () => {
    if (!browserEl.shadowRoot) return false;
    if (browserEl.shadowRoot.querySelector("#osc-shadow-overrides")) return true;
    const style = document.createElement("style");
    style.id = "osc-shadow-overrides";
    style.textContent = `
      h1, h2, h3, h4, h5, h6,
      .header-title span[role="banner"] {
        font-family: "NotesESAbold", sans-serif !important;
      }
      #stac-browser > header {
        background-color: transparent !important;
      }
      #stac-browser > header.scrolled {
        background-color: #f8f9fa !important;
      }
      #stac-browser > header .site,
      #stac-browser > header .page {
        background: transparent !important;
        background-color: transparent !important;
      }
      #stac-browser .form-control,
      #stac-browser .form-select,
      #stac-browser .multiselect__tags,
      #stac-browser .multiselect__input,
      #stac-browser .multiselect__single {
        background-color: transparent !important;
      }
      .share > .btn-group > :not(a#popover-link-btn) {
        display: none !important;
      }
      .share > .btn-group > a#popover-link-btn {
        border-radius: 0.25rem !important;
      }
      .cc .col.meta > :not(slot) {
        grid-column: 1;
      }
    `;
    browserEl.shadowRoot.appendChild(style);
    return true;
  };

  if (!attachStyles()) {
    const timer = setInterval(() => {
      if (attachStyles()) clearInterval(timer);
    }, 50);
  }
}

export async function mountOrUpdateCatalogPage(container, pathname, onUrlSynced) {
  let browserEl = container.querySelector("stac-browser");
  const targetInternalPath = toInternalBrowserPath(pathname);
  const query = new URLSearchParams(window.location.search);
  const isEmbed = query.get("embed") === "true";

  if (browserEl) {
    browserEl.style.setProperty("--sb-header-margin", isEmbed ? "0px" : "140px");
    if (browserEl._currentInternalPath !== targetInternalPath) {
      browserEl._currentInternalPath = targetInternalPath;
      browserEl.navigate(targetInternalPath);
    }
    return;
  }

  await ensureStacBrowserLoaded();

  container.innerHTML = `<div class="catalog-page-wrapper"></div>`;
  const wrapper = container.querySelector(".catalog-page-wrapper");

  browserEl = document.createElement("stac-browser");
  browserEl.setAttribute("url", CONFIG.catalogUrl);
  browserEl.setAttribute(
    "style",
    [
      "--bs-primary: #003247",
      "--bs-primary-rgb: 0, 50, 71",
      "--sb-on-primary: #ffffff",
      "--bs-secondary: #335e6f",
      "--bs-secondary-rgb: 51, 94, 111",
      "--sb-on-secondary: #ffffff",
      "--bs-info: #3f5f7a",
      "--bs-info-rgb: 63, 95, 122",
      "--bs-link-color: #003247",
      "--bs-link-color-rgb: 0, 50, 71",
      "--sb-header: #f8f9fa",
      "--sb-header-background: none",
      "--sb-header-color: #212529",
      "--sb-header-hover-color: #000000",
      "--sb-header-text-shadow: none",
      "--sb-header-button-background: transparent",
      `--sb-header-margin: ${isEmbed ? "0px" : "140px"}`,
    ].join("; ")
  );

  browserEl.config = {
    catalogUrl: CONFIG.catalogUrl,
    catalogTitle: CONFIG.catalogTitle,
    allowExternalAccess: CONFIG.allowExternalAccess,
    allowedDomains: CONFIG.allowedDomains,
    enforcedColorMode: CONFIG.enforcedColorMode || "light",
    detectLocaleFromBrowser: false,
    storeLocale: false,
    locale: CONFIG.locale || "en",
    fallbackLocale: CONFIG.fallbackLocale || "en",
    supportedLocales: CONFIG.supportedLocales || ["en"],
    cardViewMode: CONFIG.cardViewMode || "list",
    showFavorites: false,
    showSidebar: true,
    defaultCollectionSort: CONFIG.defaultCollectionSort || "title",
    showKeywordsInItemCards: false,
    showKeywordsInCatalogCards: false,
    preferredAssets: true,
    showThumbnailsAsAssets: false,
    maxEntriesPerPage: CONFIG.maxEntriesPerPage || 1000,
    socialSharing: CONFIG.socialSharing || ["email", "bsky", "mastodon", "x"],
    basemaps: CONFIG.basemaps,
    ignoreMetadata: CONFIG.ignoreMetadata,
    preprocessSTAC: CONFIG.preprocessSTAC,
  };

  // Create slotted Vanilla Web Component widgets
  const productHeader = document.createElement("osc-product-header");
  productHeader.setAttribute("slot", "root-before-content");

  const dataAccess = document.createElement("osc-data-access");
  dataAccess.setAttribute("slot", "view-catalog-meta-end");
  dataAccess.className = "osc-slot-right";

  const fairAssessment = document.createElement("osc-fair-assessment");
  fairAssessment.setAttribute("slot", "view-catalog-meta-end");
  fairAssessment.className = "osc-slot-right";

  const forumTopics = document.createElement("osc-forum-topics");
  forumTopics.setAttribute("slot", "view-catalog-meta-end");
  forumTopics.className = "osc-slot-full";

  browserEl.append(productHeader, dataAccess, fairAssessment, forumTopics);

  browserEl._currentInternalPath = targetInternalPath;
  let initialNavigationPending = targetInternalPath !== "/";

  browserEl.addEventListener("navigate", (event) => {
    const internalPath = event.detail?.path || "/";
    if (initialNavigationPending && (internalPath === "/" || internalPath === "")) {
      return;
    }
    browserEl._currentInternalPath = internalPath.split("?")[0];
    const outerPath = toOuterCleanPath(internalPath);
    const currentSearch = window.location.search;
    const fullTarget = currentSearch ? `${outerPath}${currentSearch}` : outerPath;
    if (window.location.pathname !== outerPath) {
      window.history.replaceState({}, "", fullTarget);
      if (typeof onUrlSynced === "function") {
        onUrlSynced(outerPath);
      }
    }

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "navigate",
          navigate: event.detail || {},
          path: outerPath,
          url: event.detail?.url,
        },
        "*"
      );
    }
  });

  browserEl.addEventListener("data", (event) => {
    const stacData = event.detail?.data || null;
    const stacUrl = event.detail?.url || null;

    if (browserEl._isLivePreview) {
      if (stacUrl === CONFIG.catalogUrl && browserEl._livePreviewData) {
        const store = browserEl._instance?.store;
        const pUrl = browserEl._livePreviewUrl;
        browserEl.setData(browserEl._livePreviewData, pUrl);
        if (store) {
          const reqUrl = store.getters.getRequestUrl(pUrl, null, true);
          store.commit("showPage", { url: reqUrl });
        }
        return;
      }
    }

    // Safeguard against upstream race condition (fixed in radiantearth/stac-browser#1035 on main,
    // pending merge into use-as-component): if a deep-link navigation was initiated on mount
    // and the initial root catalog load finishes slightly later and overwrites state.data,
    // immediately restore the requested deep-link entity.
    if (
      initialNavigationPending &&
      browserEl._currentInternalPath &&
      browserEl._currentInternalPath !== "/" &&
      stacUrl === CONFIG.catalogUrl &&
      browserEl._instance?.store
    ) {
      const store = browserEl._instance.store;
      const targetUrl = store.getters.fromBrowserPath(
        browserEl._currentInternalPath.replace(/^\/+/, "")
      );
      if (targetUrl && targetUrl !== CONFIG.catalogUrl) {
        store.dispatch("load", { url: targetUrl, show: true });
        return;
      }
    }

    const isOscProduct =
      typeof stacData?.["osc:type"] === "string" &&
      stacData["osc:type"].toLowerCase() === "product";

    browserEl.classList.toggle("is-osc-product", isOscProduct);

    productHeader.stacUrl = stacUrl;
    productHeader.stac = stacData;

    dataAccess.stacUrl = stacUrl;
    dataAccess.stac = stacData;

    fairAssessment.stac = stacData;
    forumTopics.stac = stacData;
  });

  browserEl.addEventListener("title", (event) => {
    if (event.detail) {
      document.title = event.detail;
    }
  });

  wrapper.appendChild(browserEl);
  injectShadowEnhancements(browserEl);

  const notifyReady = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "ready",
          ready: true,
          navigate: { path: targetInternalPath },
          path: toOuterCleanPath(targetInternalPath),
        },
        "*"
      );
    }
  };

  // Apply buffered live-preview STAC data if received during initial loading
  if (window.__pendingStacPreview && typeof browserEl.setData === "function") {
    browserEl._isLivePreview = true;
    browserEl._livePreviewData = window.__pendingStacPreview.data;
    browserEl._livePreviewUrl = window.__pendingStacPreview.url;
    const { data, url } = window.__pendingStacPreview;
    window.__pendingStacPreview = null;
    browserEl.setData(data, url);
  }

  if (targetInternalPath && targetInternalPath !== "/") {
    browserEl.navigate(targetInternalPath).finally(() => {
      initialNavigationPending = false;
      notifyReady();
    });
  } else {
    notifyReady();
  }
}
