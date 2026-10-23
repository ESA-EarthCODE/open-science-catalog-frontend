import { escapeHtml, renderOscLink, ICONS } from "../utils/links.js";

export class OscDataAccess extends HTMLElement {
  constructor() {
    super();
    this._stac = null;
    this._stacUrl = null;

    this.addEventListener("click", (e) => {
      const scrollBtn = e.target.closest("[data-action='scroll-to-items']");
      if (scrollBtn) {
        e.preventDefault();
        const browserEl = document.querySelector("stac-browser");
        const itemsEl =
          browserEl?.shadowRoot?.querySelector('[part~="items"]') ||
          document.querySelector(".items-container") ||
          document.querySelector(".items");
        if (itemsEl) {
          itemsEl.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }

  set stac(value) {
    this._stac = value;
    this.render();
  }

  get stac() {
    return this._stac;
  }

  set stacUrl(value) {
    this._stacUrl = value;
    this.render();
  }

  get stacUrl() {
    return this._stacUrl;
  }

  _isOscProduct() {
    if (!this._stac) return false;
    const type = this._stac["osc:type"];
    return typeof type === "string" && type.toLowerCase() === "product";
  }

  _links() {
    if (!this._stac) return [];
    if (Array.isArray(this._stac["osc:links"])) {
      return this._stac["osc:links"];
    }
    return Array.isArray(this._stac.links) ? this._stac.links : [];
  }

  _toAbsoluteUrl(href) {
    if (!href) return "";
    try {
      const base = this._stacUrl || window.location.href;
      return new URL(href, base).href;
    } catch {
      return href;
    }
  }

  _isLinkMatchingSubCatalog(linkHref, subCatHrefs) {
    if (!linkHref || !Array.isArray(subCatHrefs) || subCatHrefs.length === 0) return false;
    const absLink = this._toAbsoluteUrl(linkHref);

    const normalize = (url) => {
      if (!url) return "";
      let decoded = url;
      try {
        decoded = decodeURIComponent(url);
      } catch {
        // ignore
      }
      const externalMatch = decoded.match(/#\/external\/(.+)$/);
      if (externalMatch && externalMatch[1]) {
        decoded = externalMatch[1];
      }
      return decoded
        .replace(/^https?:\/\//, "")
        .replace(/\/collection\.json$/, "")
        .replace(/\/catalog\.json$/, "")
        .replace(/\/$/, "");
    };

    const normLink = normalize(absLink);

    return subCatHrefs.some((subHref) => {
      const normSub = normalize(subHref);
      if (!normSub || !normLink) return false;
      return normLink === normSub || normLink.includes(normSub) || normSub.includes(normLink);
    });
  }

  _childCatalogs() {
    if (!this._isOscProduct()) return [];
    return this._links().filter((l) => {
      if (!l || !l.href) return false;
      if (l.rel !== "child" && l.rel !== "osc:subcatalog") return false;
      const href = l.href;
      if (
        href.includes("/projects/") ||
        href.includes("/themes/") ||
        href.includes("/variables/") ||
        href.includes("/eo-missions/") ||
        href.includes("/missions/") ||
        href.includes("/experiments/")
      ) {
        return false;
      }
      return true;
    });
  }

  _accessLinks(childCatalogs) {
    if (!this._isOscProduct()) return [];
    const subCatHrefs = childCatalogs
      .map((c) => this._toAbsoluteUrl(c.href))
      .filter(Boolean);

    return this._links().filter((l) => {
      if (!l || !l.href) return false;
      const rel = (l.rel || "").toLowerCase();
      const title = (l.title || "").toLowerCase();

      const isAccessRel =
        rel === "via" ||
        rel === "access" ||
        rel === "external" ||
        rel === "osc:data-access";
      const isAccessTitle =
        title === "access" ||
        title.includes("data access") ||
        title.includes("access data");

      if (!isAccessRel && !isAccessTitle) return false;

      if (
        title.includes("documentation") ||
        title.includes("license") ||
        title.includes("publication")
      ) {
        return false;
      }
      if (
        l.href.includes("/projects/") ||
        l.href.includes("/themes/") ||
        l.href.includes("/variables/") ||
        l.href.includes("/eo-missions/") ||
        l.href.includes("/missions/")
      ) {
        return false;
      }

      if (this._isLinkMatchingSubCatalog(l.href, subCatHrefs)) {
        return false;
      }

      return true;
    });
  }

  _itemsCount() {
    if (!this._isOscProduct()) return 0;
    return this._links().filter((l) => l && l.rel === "item").length;
  }

  _collectionAssets() {
    if (!this._isOscProduct() || !this._stac?.assets) return [];
    const assetsObj = this._stac.assets;
    return Object.keys(assetsObj).map((key) => {
      const a = assetsObj[key];
      return {
        key,
        href: a.href,
        title: a.title || key,
        type: a.type || "",
      };
    });
  }

  _getLinkTitle(link) {
    if (!link) return "Access Data";
    if (link.title && link.title.toLowerCase() !== "access") {
      return link.title;
    }
    const href = (link.href || "").toLowerCase();
    if (href.includes("ipynb") || href.includes("notebook")) {
      return "Access Tutorial Notebook";
    }
    if (href.includes("zenodo")) {
      return "Access Zenodo Repository";
    }
    if (href.includes("stac-browser") || href.includes("collection.json")) {
      return "Access External STAC Catalogue";
    }
    if (href.includes("thredds") || href.includes("s3") || href.includes("cloudferro")) {
      return "Access Cloud Storage / Data Portal";
    }
    return "Access Dataset";
  }

  _getButtonLabel(link) {
    const href = (link.href || "").toLowerCase();
    if (href.includes("ipynb") || href.includes("notebook")) {
      return "Open Notebook";
    }
    if (href.includes("stac-browser") || href.includes("collection.json")) {
      return "Browse Catalogue";
    }
    return "Access Data";
  }

  _getLinkIconSvg(link) {
    const href = (link.href || "").toLowerCase();
    if (href.includes("ipynb") || href.includes("notebook")) {
      return ICONS.journalCode;
    }
    if (href.includes("stac-browser") || href.includes("collection.json")) {
      return ICONS.folder2Open;
    }
    if (href.includes("s3") || href.includes("thredds") || href.includes("cloudferro")) {
      return ICONS.cloudDownload;
    }
    return ICONS.boxArrowUpRight;
  }

  _formatUrl(url) {
    if (!url) return "";
    try {
      const u = new URL(url);
      return u.hostname + u.pathname;
    } catch {
      return url;
    }
  }

  render() {
    if (!this._isOscProduct()) {
      this.innerHTML = "";
      return;
    }

    const childCatalogs = this._childCatalogs();
    const accessLinks = this._accessLinks(childCatalogs);
    const itemsCount = this._itemsCount();
    const collectionAssets = this._collectionAssets();
    const totalCount =
      accessLinks.length +
      childCatalogs.length +
      (itemsCount > 0 ? 1 : 0) +
      collectionAssets.length;

    const activeSections = [
      accessLinks.length > 0,
      childCatalogs.length > 0,
      itemsCount > 0,
      collectionAssets.length > 0,
    ].filter(Boolean).length;
    const hasMultipleSections = activeSections > 1;

    const summaryParts = [];
    if (itemsCount > 0) summaryParts.push(`${itemsCount} dataset items`);
    if (childCatalogs.length > 0) {
      summaryParts.push(
        `${childCatalogs.length} sub-catalogue${childCatalogs.length > 1 ? "s" : ""}`
      );
    }
    if (accessLinks.length > 0) {
      summaryParts.push(
        `${accessLinks.length} external access method${accessLinks.length > 1 ? "s" : ""}`
      );
    }
    const summaryText =
      totalCount > 0 && summaryParts.length > 0
        ? `This product provides data access via: ${summaryParts.join(", ")}.`
        : null;

    const accessLinksHtml =
      accessLinks.length > 0
        ? `
        <div class="access-section mb-3">
          ${
            hasMultipleSections
              ? `<div class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">External Access</div>`
              : ""
          }
          <div class="d-flex flex-column gap-2">
            ${accessLinks
              .map(
                (link) => `
              <div class="access-link-card p-3 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3 min-w-0">
                  <div class="icon-avatar rounded-circle p-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                    ${this._getLinkIconSvg(link)}
                  </div>
                  <div class="link-info min-w-0">
                    <div class="fw-bold text-dark text-truncate">${escapeHtml(
                      this._getLinkTitle(link)
                    )}</div>
                    <div class="text-muted extra-small text-truncate" title="${escapeHtml(
                      link.href
                    )}">${escapeHtml(this._formatUrl(link.href))}</div>
                  </div>
                </div>
                <a
                  href="${escapeHtml(link.href)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1 px-3"
                >
                  <span>${escapeHtml(this._getButtonLabel(link))}</span>
                  <span class="ms-1 d-inline-flex">${ICONS.boxArrowUpRight}</span>
                </a>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    const childCatalogsHtml =
      childCatalogs.length > 0
        ? `
        <div class="subcatalogs-section mb-3">
          ${
            hasMultipleSections
              ? `<div class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">Sub-Catalogues &amp; Collections</div>`
              : ""
          }
          <div class="d-flex flex-column gap-2">
            ${childCatalogs
              .map(
                (cat) => `
              <div class="subcatalog-card p-3 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-3 min-w-0">
                  <div class="icon-avatar rounded-circle p-2 bg-info-subtle text-info d-flex align-items-center justify-content-center">
                    ${ICONS.folder2Open}
                  </div>
                  <div class="link-info min-w-0">
                    <div class="fw-bold text-dark text-truncate">${escapeHtml(
                      cat.title || "Sub-Catalogue"
                    )}</div>
                    <div class="text-muted extra-small text-truncate" title="${escapeHtml(
                      cat.href
                    )}">${escapeHtml(this._formatUrl(cat.href))}</div>
                  </div>
                </div>
                ${renderOscLink({
                  data: cat,
                  title: cat.title || "Browse Sub-Catalogue",
                  stacUrl: this._stacUrl,
                  className:
                    "btn btn-primary btn-sm d-inline-flex align-items-center gap-1 px-3 text-nowrap",
                  innerHtml: `<span>Browse Catalogue</span><span class="ms-1 d-inline-flex">${ICONS.arrowRight}</span>`,
                })}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    const itemsSectionHtml =
      itemsCount > 0
        ? `
        <div class="items-section mb-3">
          <div class="items-card p-3 rounded border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-avatar rounded-circle p-2 bg-success-subtle text-success d-flex align-items-center justify-content-center">
                ${ICONS.stack}
              </div>
              <div>
                <div class="fw-bold text-dark">${itemsCount} Data Items / Granules available</div>
                <div class="text-muted extra-small">
                  Browse, filter, and inspect individual data items in the items panel below.
                </div>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1 px-3"
              data-action="scroll-to-items"
            >
              ${ICONS.arrowDownShort}
              <span>Browse Items</span>
            </button>
          </div>
        </div>
      `
        : "";

    const assetsSectionHtml =
      collectionAssets.length > 0
        ? `
        <div class="assets-section mb-3">
          <div class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">
            Direct Download
          </div>
          <div class="d-flex flex-column gap-2">
            ${collectionAssets
              .map(
                (asset) => `
              <div class="asset-card p-2 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <span class="text-primary flex-shrink-0 me-2">${ICONS.fileEarmarkArrowDown}</span>
                  <div class="text-truncate min-w-0">
                    <span class="fw-semibold text-dark">${escapeHtml(
                      asset.title || asset.key
                    )}</span>
                    ${
                      asset.type
                        ? `<span class="badge bg-secondary-subtle text-secondary ms-2 extra-small">${escapeHtml(
                            asset.type
                          )}</span>`
                        : ""
                    }
                  </div>
                </div>
                <a
                  href="${escapeHtml(asset.href)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-outline-secondary btn-sm px-2 py-1"
                >
                  <span class="me-1 d-inline-flex">${ICONS.download}</span>
                  Download
                </a>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `
        : "";

    const noAccessHtml =
      totalCount === 0
        ? `
        <div class="no-access-box p-3 rounded border border-warning-subtle bg-warning-subtle text-dark d-flex align-items-center gap-3">
          <span class="text-warning flex-shrink-0">${ICONS.infoCircleFill}</span>
          <div>
            <div class="fw-bold">No direct data access available for this product.</div>
            <div class="small text-secondary">
              There are currently no direct data files, external access links, or child items registered for this product catalogue entry.
            </div>
          </div>
        </div>
      `
        : "";

    this.innerHTML = `
      <section class="osc-data-access mb-4">
        <header class="d-flex align-items-center mb-3">
          <h2 class="title me-2 mb-0">Access the Data</h2>
          ${
            totalCount > 0
              ? `<span class="badge rounded-pill bg-secondary">${totalCount}</span>`
              : ""
          }
        </header>
        ${summaryText ? `<p class="text-secondary small mb-3">${escapeHtml(summaryText)}</p>` : ""}
        ${accessLinksHtml}
        ${childCatalogsHtml}
        ${itemsSectionHtml}
        ${assetsSectionHtml}
        ${noAccessHtml}
      </section>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("osc-data-access")) {
  customElements.define("osc-data-access", OscDataAccess);
}
