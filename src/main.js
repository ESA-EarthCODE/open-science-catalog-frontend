import "@eox/esa-ui/components/header.js";
import "@eox/esa-ui/components/navbar.js";
import "@eox/esa-ui/components/menu.js";

import "./styles/main.css";
import CONFIG from "./merged-config.js";
import { escapeHtml } from "./utils/links.js";
import {
  renderLandingPage,
  renderMetricsPage,
  renderSearchPage,
  renderAboutPage,
  renderFairPage,
  renderFairPreviewPage,
  renderPrivacyNoticePage,
} from "./pages/static-pages.js";
import { mountOrUpdateCatalogPage } from "./pages/catalog-page.js";
import { updateTitleForRoute } from "./utils/title.js";

const appVersion = typeof APP_VERSION !== "undefined" ? APP_VERSION : "4.0.0-rc.1";

export function getAppPrefix() {
  const prefix = CONFIG.pathPrefix || "/";
  return prefix.endsWith("/") ? prefix : `${prefix}/`;
}

export function toAppRelativePath(pathname) {
  const prefix = getAppPrefix();
  let path = pathname || "/";
  if (prefix !== "/" && path.startsWith(prefix)) {
    path = "/" + path.slice(prefix.length);
  }
  return path || "/";
}

export function toAppFullPath(relativePath) {
  const prefix = getAppPrefix();
  const cleanRel = (relativePath || "").replace(/^\/+/, "");
  return prefix + cleanRel;
}

function getMenuItems() {
  const apiUrl = CONFIG.apiUrl || "https://eoapi.workspace.earthcode.eox.at/stac";
  const apiAccessUrl = apiUrl.replace(/\/$/, "") + "/api.html";
  return [
    { title: "Catalogue", href: toAppFullPath("catalog") },
    { title: "Metrics", href: toAppFullPath("metrics") },
    { title: "Search", href: toAppFullPath("search") },
    { title: "About", href: toAppFullPath("about") },
    { title: "API Access", href: apiAccessUrl },
  ];
}

function isCatalogRoute(appRelativePath) {
  return ![
    "/",
    "/metrics",
    "/search",
    "/privacy-notice",
    "/about",
    "/fair",
    "/fair-preview",
  ].includes(appRelativePath);
}

function getSuggestChangesUrls(pathname) {
  const appPath = toAppRelativePath(pathname);
  const currentPath =
    !appPath || appPath === "/" || appPath === "/catalog" ? "/catalog" : appPath;
  const parts = currentPath.split("/");
  const lastPart = parts[parts.length - 1] || "catalog";
  const sessionTitle = `Edit ${lastPart}`;
  const workspaceRoot =
    CONFIG.workspaceRoot || "https://workspace.earthcode-staging.earthcode.eox.at";
  const githubDataRoot =
    CONFIG.githubDataRoot ||
    "https://github.com/ESA-EarthCODE/open-science-catalog-metadata/tree/main";

  const editorUrl = `${workspaceRoot}/osc-editor?session=${encodeURIComponent(
    sessionTitle
  )}&automation=edit-file&file=${encodeURIComponent(
    "https://raw.githubusercontent.com/ESA-EarthCODE/open-science-catalog-metadata/refs/heads/main" +
      currentPath +
      ".json"
  )}`;
  const githubUrl = `${githubDataRoot.replace(/\/$/, "")}${currentPath}.json`;
  return { editorUrl, githubUrl };
}

function initShell() {
  const appRoot = document.getElementById("app");
  const prefix = getAppPrefix();
  const consent = localStorage.getItem("esa-cookies-consent");
  const hasCookieConsent =
    document.cookie.includes("mtm_cookie_consent") ||
    document.cookie.includes("mtm_consent_removed");
  const showCookieBanner = !consent && !hasCookieConsent;

  appRoot.innerHTML = `
    <div id="app-shell">
      <esa-menu id="esa-menu-el"></esa-menu>

      <header class="esa-header-wrapper" id="esa-header-wrapper">
        <esa-header></esa-header>
        <esa-navbar id="esa-navbar-el" brand-title="Open Science Catalogue"></esa-navbar>
      </header>

      <main id="main-view" class="flex-grow-1 position-relative"></main>

      ${
        showCookieBanner
          ? `
        <div id="esa-cookie-banner" class="esa-cookie-banner">
          We use cookies which are essential for you to access our website and/or to
          provide you with our services, enable you to share our website content via
          your social media accounts and allow us to measure and improve the
          performance of our website.<br />
          <button class="cookie-btn" data-cookie-consent="accepted">
            Accept all cookies
          </button>
          <button class="cookie-btn" data-cookie-consent="declined">
            Accept only essential cookies
          </button>
          <a href="${escapeHtml(toAppFullPath("privacy-notice"))}" data-osc-link="${escapeHtml(toAppFullPath("privacy-notice"))}" class="cookie-link">See our Cookie Notice</a>
        </div>
      `
          : ""
      }

      <footer class="esa-footer" id="esa-footer">
        <div class="esa-footer-container">
          <div class="footer-left">
            &copy; ${new Date().getFullYear()} by
            <a href="https://www.esa.int/" target="_blank" class="esa-footer-link">ESA</a>
          </div>
          <div class="footer-center">
            <a href="https://www.esa.int/Services/Terms_and_conditions" target="_blank" class="esa-footer-link">Terms &amp; Conditions</a>
            <span class="separator">|</span>
            <a href="${escapeHtml(toAppFullPath("privacy-notice"))}" data-osc-link="${escapeHtml(toAppFullPath("privacy-notice"))}" class="esa-footer-link">Privacy Notice</a>
          </div>
          <div class="footer-right">
            <a href="https://github.com/EOEPCA/open-science-catalog-stac-browser" target="_blank" class="esa-footer-link">open-science-catalog</a>
            <span> v${escapeHtml(appVersion)} by</span>
            <a href="https://eox.at" target="_blank" class="esa-footer-link ms-1">
              <img src="${escapeHtml(prefix)}img/EOX_Logo_weiss.svg" alt="EOX Logo" height="11" style="height: 11px !important; max-height: 11px !important; width: auto !important; vertical-align: middle; margin-top: -3px;" />
            </a>
          </div>
        </div>

        <div id="suggest-changes-dial" class="suggest-changes-dial" style="display: none;">
          <div class="suggest-changes-menu">
            <a id="suggest-editor-link" href="#" target="_blank" class="suggest-btn btn-editor">
              <i class="mdi mdi-pencil"></i>
              Edit metadata
            </a>
            <a id="suggest-github-link" href="#" target="_blank" class="suggest-btn btn-github">
              <i class="mdi mdi-github"></i>
              View file on GitHub
            </a>
          </div>
          <button class="suggest-toggle-btn">
            <i class="mdi mdi-pencil pencil-icon"></i>
            <i class="mdi mdi-close close-icon"></i>
            <span class="btn-text">Suggest changes</span>
          </button>
        </div>
      </footer>
    </div>
  `;

  // Wire cookie consent buttons
  appRoot.addEventListener("click", (e) => {
    const cookieBtn = e.target.closest("[data-cookie-consent]");
    if (cookieBtn) {
      const status = cookieBtn.getAttribute("data-cookie-consent");
      if (status === "accepted") {
        if (window._paq) window._paq.push(["rememberCookieConsentGiven"]);
      } else {
        if (window._paq) {
          window._paq.push(["forgetCookieConsentGiven"]);
          window._paq.push(["optUserOut"]);
        }
      }
      localStorage.setItem("esa-cookies-consent", status);
      document.getElementById("esa-cookie-banner")?.remove();
      return;
    }

    // Intercept internal [data-osc-link] anchor clicks
    const oscLink = e.target.closest("[data-osc-link]");
    if (oscLink) {
      if (
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey ||
        (e.button !== undefined && e.button !== 0)
      ) {
        return;
      }
      e.preventDefault();
      const targetPath = oscLink.getAttribute("data-osc-link");
      if (targetPath) {
        navigateTo(targetPath);
      }
    }
  });

  // Wire ESA-UI navbar and mobile drawer
  const setupEsaUi = () => {
    const nav = document.getElementById("esa-navbar-el");
    const menu = document.getElementById("esa-menu-el");
    const items = getMenuItems();

    if (nav) {
      nav.menuItems = items;
      if (nav.render) nav.render();
    }
    if (menu) {
      menu.menuItems = items;
      if (menu.render) menu.render();
    }

    if (nav?.shadowRoot) {
      const menuBtn = nav.shadowRoot.querySelector("#menu-open");
      if (menuBtn && menu?.shadowRoot) {
        menuBtn.onclick = () => {
          const cMenu = menu.shadowRoot.querySelector(".c-menu");
          if (cMenu) {
            cMenu.classList.add("is-open");
            document.body.classList.add("is-locked");
          }
        };
      }
    }

    if (menu?.shadowRoot) {
      const closeBtn = menu.shadowRoot.querySelector("#menu-close");
      if (closeBtn) {
        closeBtn.onclick = () => {
          const cMenu = menu.shadowRoot.querySelector(".c-menu");
          if (cMenu) {
            cMenu.classList.remove("is-open");
            document.body.classList.remove("is-locked");
          }
        };
      }
    }

    [nav, menu].forEach((el) => {
      if (el?.shadowRoot && !el._routingAttached) {
        el._routingAttached = true;
        el.shadowRoot.addEventListener("click", (event) => {
          const anchor = event
            .composedPath()
            .find((target) => target.tagName === "A");
          if (!anchor) return;
          const href = anchor.getAttribute("href");
          if (!href) return;
          if (href.startsWith("http") || anchor.getAttribute("target") === "_blank") {
            event.preventDefault();
            window.open(href, "_blank");
          } else if (href.startsWith("/")) {
            event.preventDefault();
            navigateTo(href);
          }
        });
      }
    });
  };

  Promise.all([
    customElements.whenDefined("esa-header"),
    customElements.whenDefined("esa-navbar"),
    customElements.whenDefined("esa-menu"),
  ]).then(setupEsaUi);
  setupEsaUi();

  // Listen for live-preview data injection via window.postMessage
  window.addEventListener("message", (event) => {
    if (event.data && event.data.data) {
      const catalogBase = (CONFIG.catalogUrl || "").replace(/\/?[^/]+$/, "");
      const previewUrl =
        event.data.url ||
        `${catalogBase || CONFIG.staticEndpoint || "https://esa-earthcode.github.io/open-science-catalog-metadata"}/live-preview/collection.json`;
      const browserEl = document.querySelector("stac-browser");
      if (browserEl && typeof browserEl.setData === "function") {
        browserEl._isLivePreview = true;
        browserEl._livePreviewData = event.data.data;
        browserEl._livePreviewUrl = previewUrl;
        browserEl.setData(event.data.data, previewUrl);
      } else {
        // Buffer preview data if <stac-browser> is still loading or on a non-catalog page
        window.__pendingStacPreview = {
          data: event.data.data,
          url: previewUrl,
        };
        const appPath = toAppRelativePath(window.location.pathname);
        if (!isCatalogRoute(appPath)) {
          navigateTo(toAppFullPath("catalog" + window.location.search));
        } else {
          customElements.whenDefined("stac-browser").then(() => {
            const el = document.querySelector("stac-browser");
            if (el && typeof el.setData === "function" && window.__pendingStacPreview) {
              el._isLivePreview = true;
              el._livePreviewData = window.__pendingStacPreview.data;
              el._livePreviewUrl = window.__pendingStacPreview.url;
              const { data, url } = window.__pendingStacPreview;
              window.__pendingStacPreview = null;
              el.setData(data, url);
            }
          });
        }
      }
    }
  });
}

function updateShellChrome(pathname) {
  const query = new URLSearchParams(window.location.search);
  const isEmbed = query.get("embed") === "true";
  const isLanding = pathname === "/";
  const isCatalog = isCatalogRoute(pathname);

  const menuEl = document.getElementById("esa-menu-el");
  const headerEl = document.getElementById("esa-header-wrapper");
  const footerEl = document.getElementById("esa-footer");
  const cookieEl = document.getElementById("esa-cookie-banner");
  const dialEl = document.getElementById("suggest-changes-dial");
  const appShell = document.getElementById("app-shell");

  if (menuEl) menuEl.style.display = isEmbed ? "none" : "";
  if (headerEl) headerEl.style.display = isEmbed ? "none" : "";
  if (cookieEl) cookieEl.style.display = isEmbed ? "none" : "";
  if (footerEl) footerEl.style.display = isEmbed || isLanding ? "none" : "";
  if (appShell) {
    appShell.classList.toggle("is-embed", isEmbed);
    appShell.classList.toggle("is-landing", isLanding);
  }
  document.body.classList.toggle("is-embed", isEmbed);
  document.body.classList.toggle("is-landing", isLanding);

  if (dialEl) {
    dialEl.style.display = !isEmbed && isCatalog ? "flex" : "none";
    if (isCatalog) {
      const { editorUrl, githubUrl } = getSuggestChangesUrls(pathname);
      const editorLink = document.getElementById("suggest-editor-link");
      const githubLink = document.getElementById("suggest-github-link");
      if (editorLink) editorLink.setAttribute("href", editorUrl);
      if (githubLink) githubLink.setAttribute("href", githubUrl);
    }
  }
}

async function handleRoute() {
  const url = new URL(window.location.href);
  const appPath = toAppRelativePath(url.pathname);

  // 1. Redirect ?external=... to /external/...
  if (url.searchParams.has("external")) {
    const ext = url.searchParams.get("external");
    window.history.replaceState({}, "", toAppFullPath(`external/${ext}`));
    return handleRoute();
  }

  // 2. Redirect embedded visits at root to /catalog?embed=true
  if (appPath === "/" && url.searchParams.get("embed") === "true") {
    window.history.replaceState({}, "", toAppFullPath("catalog" + url.search));
    return handleRoute();
  }

  // 3. Catch legacy hash URLs (e.g. #/products/foo/collection.json)
  if (appPath === "/" && url.hash) {
    const rawHash = url.hash.replace(/^#\/?/, "");
    if (rawHash) {
      const cleanPath = rawHash.replace(/\.json$/, "");
      window.history.replaceState({}, "", toAppFullPath(cleanPath));
      return handleRoute();
    }
  }

  // 4. Strip trailing .json
  if (url.pathname.endsWith(".json")) {
    const cleanPath = toAppFullPath(appPath.replace(/\.json$/, "")) + url.search;
    window.history.replaceState({}, "", cleanPath);
    return handleRoute();
  }

  updateShellChrome(appPath);
  updateTitleForRoute(appPath);

  // Notify parent window if embedded in an iframe
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(
      {
        type: "navigate",
        navigate: { path: appPath },
        path: url.pathname,
      },
      "*"
    );
  }

  const mainView = document.getElementById("main-view");
  if (!mainView) return;

  if (appPath === "/") {
    renderLandingPage(mainView);
  } else if (appPath === "/metrics") {
    renderMetricsPage(mainView);
  } else if (appPath === "/search") {
    renderSearchPage(mainView);
  } else if (appPath === "/about" || appPath === "/fair") {
    renderAboutPage(mainView);
  } else if (appPath === "/fair-preview") {
    renderFairPreviewPage(mainView);
  } else if (appPath === "/privacy-notice") {
    renderPrivacyNoticePage(mainView);
  } else {
    await mountOrUpdateCatalogPage(
      mainView,
      url.pathname,
      (syncedPath) => {
        const relSynced = toAppRelativePath(syncedPath);
        updateShellChrome(relSynced);
        updateTitleForRoute(relSynced);
      },
      isHandlingPopState
    );
  }
}

export function navigateTo(path) {
  const fullTarget = path.startsWith("http")
    ? path
    : path.startsWith("/") && !path.startsWith(getAppPrefix())
      ? toAppFullPath(path)
      : path;

  if (window.location.pathname + window.location.search !== fullTarget) {
    window.history.pushState({}, "", fullTarget);
  }
  window.scrollTo({ left: 0, top: 0 });
  handleRoute();
}

window.navigateTo = navigateTo;

let isHandlingPopState = false;

window.addEventListener("popstate", async () => {
  isHandlingPopState = true;
  try {
    await handleRoute();
  } finally {
    isHandlingPopState = false;
  }
});

initShell();
handleRoute();
