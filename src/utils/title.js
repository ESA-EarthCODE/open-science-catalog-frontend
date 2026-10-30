import CONFIG from "../merged-config.js";

const SECTION_TITLES = {
  "eo-missions": "EO Missions",
  "data-collections": "Data Collections",
  projects: "Projects",
  themes: "Themes",
  variables: "Variables",
  products: "Products",
  workflows: "Workflows",
  experiments: "Experiments",
};

export function formatPart(part) {
  if (!part) return "";
  return part
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getCatalogProvisionalTitle(appPath, baseTitle) {
  const clean = (appPath || "").replace(/^\/+/, "").replace(/\.json$/, "");
  if (!clean || clean === "catalog") {
    return `Catalogue - ${baseTitle}`;
  }
  if (clean.startsWith("external/")) {
    return `External Catalogue - ${baseTitle}`;
  }
  const parts = clean.split("/").filter(Boolean);
  const section = SECTION_TITLES[parts[0]];
  if (parts.length === 1 || (parts.length === 2 && parts[1] === "catalog")) {
    return section ? `${section} - ${baseTitle}` : `${formatPart(parts[0])} - ${baseTitle}`;
  }
  const entityName = formatPart(parts[1]);
  if (section) {
    return `${entityName} - ${section} - ${baseTitle}`;
  }
  return `${entityName} - ${baseTitle}`;
}

export function setPageTitle(title) {
  if (!title) return;
  document.title = title;
  if (typeof window !== "undefined" && window._paq) {
    window._paq.push(["setCustomUrl", window.location.href]);
    window._paq.push(["setDocumentTitle", `${document.domain}/${document.title}`]);
  }
}

export function updateTitleForRoute(appPath) {
  const baseTitle = CONFIG.catalogTitle || "Open Science Catalogue";
  const query = new URLSearchParams(window.location.search);

  if (!appPath || appPath === "/") {
    setPageTitle(baseTitle);
  } else if (appPath === "/metrics") {
    setPageTitle(`Metrics - ${baseTitle}`);
  } else if (appPath === "/search") {
    setPageTitle(`Search - ${baseTitle}`);
  } else if (appPath === "/about") {
    setPageTitle(`About - ${baseTitle}`);
  } else if (appPath === "/fair") {
    setPageTitle(`FAIR Principles - ${baseTitle}`);
  } else if (appPath === "/privacy-notice") {
    setPageTitle(`Privacy Notice - ${baseTitle}`);
  } else if (appPath === "/fair-preview") {
    const customTitle = query.get("title");
    setPageTitle(
      customTitle && customTitle !== "Product Title"
        ? `${customTitle} - FAIR Assessment - ${baseTitle}`
        : `FAIR Assessment - ${baseTitle}`
    );
  } else {
    setPageTitle(getCatalogProvisionalTitle(appPath, baseTitle));
  }
}
