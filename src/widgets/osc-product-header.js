import CONFIG from "../merged-config.js";
import { escapeHtml, renderOscLink, ICONS } from "../utils/links.js";

export class OscProductHeader extends HTMLElement {
  constructor() {
    super();
    this._stac = null;
    this._stacUrl = null;
    this._copied = false;
    this._copyTimeout = null;

    this.addEventListener("click", (e) => {
      const toggleSidebarBtn = e.target.closest("[data-action='toggle-sidebar']");
      if (toggleSidebarBtn) {
        e.preventDefault();
        const browserEl = document.querySelector("stac-browser");
        const browseBtn = browserEl?.shadowRoot?.querySelector(
          'header [part="site-header"] nav.navigation button'
        );
        if (browseBtn) browseBtn.click();
        return;
      }

      const copyBtn = e.target.closest("[data-action='copy-doi']");
      if (copyBtn) {
        e.preventDefault();
        this._copyDoi();
        return;
      }

      const popTrigger = e.target.closest("[data-popover-toggle]");
      if (popTrigger) {
        e.stopPropagation();
        const wrapper = popTrigger.closest(".osc-popover-wrapper");
        if (wrapper) {
          const isOpen = wrapper.classList.contains("is-open");
          this.querySelectorAll(".osc-popover-wrapper.is-open").forEach((el) =>
            el.classList.remove("is-open")
          );
          if (!isOpen) {
            wrapper.classList.add("is-open");
          }
        }
      }
    });

    this._onDocumentClick = (e) => {
      if (!this.contains(e.target)) {
        this.querySelectorAll(".osc-popover-wrapper.is-open").forEach((el) =>
          el.classList.remove("is-open")
        );
      }
    };
  }

  connectedCallback() {
    document.addEventListener("click", this._onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this._onDocumentClick);
    if (this._copyTimeout) clearTimeout(this._copyTimeout);
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

  _formatId(id) {
    if (!id || typeof id !== "string") return id || "";
    return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _doi() {
    if (!this._stac) return null;
    const rawDoi = this._stac["sci:doi"] || this._stac.properties?.["sci:doi"];
    if (!rawDoi) return null;
    return String(rawDoi).replace(/^https?:\/\/doi\.org\//i, "").trim();
  }

  _isCanonical() {
    if (!this._stac) return false;
    const links = this._links();
    const hasVersion = links.some((l) => l && l.rel === "has-version");
    const isVersionOf = links.some((l) => l && l.rel === "is-version-of");
    return hasVersion && !isVersionOf;
  }

  _version() {
    if (!this._stac) return null;
    return this._stac.version || this._stac.properties?.version || null;
  }

  _doiLabel() {
    if (this._isCanonical()) return "Canonical DOI";
    const version = this._version();
    if (version) {
      const vStr = String(version).trim();
      const vFormatted = vStr.toLowerCase().startsWith("v") ? vStr : `v${vStr}`;
      return `DOI (${vFormatted})`;
    }
    return "DOI";
  }

  _versionText() {
    const version = this._version();
    if (!version) return "";
    const v = String(version).trim();
    return ` (${v.toLowerCase().startsWith("v") ? v : "v" + v})`;
  }

  _latestLink() {
    return this._links().find((l) => l && l.rel === "latest-version") || null;
  }

  _versionLinks() {
    const hasVersionLinks = this._links().filter((l) => l && l.rel === "has-version");
    if (hasVersionLinks.length > 0) return hasVersionLinks;
    const latest = this._latestLink();
    return latest ? [latest] : [];
  }

  _canonicalLink() {
    return this._links().find((l) => l && l.rel === "is-version-of") || null;
  }

  _getVersionTitle(link) {
    if (!link) return "Show";
    const rawTitle = link.title ? String(link.title).trim() : "";
    if (
      rawTitle &&
      rawTitle.toLowerCase() !== "latest version" &&
      rawTitle.toLowerCase() !== "has version"
    ) {
      return rawTitle;
    }
    if (link.href) {
      const match = link.href.match(/_v?([0-9][0-9a-zA-Z._-]*)\.json$/);
      if (match && match[1]) {
        const v = match[1];
        return v.toLowerCase().startsWith("v") ? v : `Version ${v}`;
      }
    }
    return rawTitle || "Show";
  }

  _suggestChangesUrl() {
    if (!this._stac) return null;
    const workspaceRoot =
      CONFIG.workspaceRoot || "https://workspace.earthcode-staging.earthcode.eox.at";
    const rawPath = window.location.pathname || "/catalog";
    const currentPath =
      rawPath === "/" || rawPath === "" || rawPath === "/catalog" ? "/catalog" : rawPath;
    const parts = currentPath.split("/");
    const lastPart = parts[parts.length - 1] || "catalog";
    const sessionTitle = `Edit ${lastPart}`;
    return `${workspaceRoot}/osc-editor?session=${encodeURIComponent(
      sessionTitle
    )}&automation=edit-file&file=${encodeURIComponent(
      "https://raw.githubusercontent.com/ESA-EarthCODE/open-science-catalog-metadata/refs/heads/main" +
        currentPath +
        ".json"
    )}`;
  }

  _project() {
    if (!this._stac) return null;
    const link = this._links().find((l) => l.href && l.href.includes("/projects/"));
    if (link) {
      const rawTitle = link.title || "";
      const title = rawTitle
        ? rawTitle.replace(/^Project:\s*/i, "").trim()
        : this._formatId(this._stac["osc:project"]);
      return { link, title, href: link.href };
    }
    const oscProject = this._stac["osc:project"] || this._stac.project;
    if (oscProject) {
      return {
        link: null,
        title: this._formatId(oscProject),
        href: `/projects/${oscProject}/collection.json`,
      };
    }
    return null;
  }

  _extractList(pathSegment, prefixRegex, propKeys, fallbackFolder) {
    if (!this._stac) return [];
    const list = [];
    const matchedLinks = this._links().filter(
      (l) =>
        l.href &&
        (Array.isArray(pathSegment)
          ? pathSegment.some((seg) => l.href.includes(seg))
          : l.href.includes(pathSegment))
    );
    if (matchedLinks.length > 0) {
      matchedLinks.forEach((l) => {
        const rawTitle = l.title || "";
        const title = rawTitle
          ? rawTitle.replace(prefixRegex, "").trim()
          : this._formatId(l.href.split("/").pop().replace(".json", ""));
        list.push({ link: l, title, href: l.href });
      });
    }
    if (list.length === 0) {
      const rawVal = propKeys.map((k) => this._stac[k]).find((v) => v !== undefined);
      if (Array.isArray(rawVal)) {
        rawVal.forEach((item) => {
          const id = typeof item === "string" ? item : item?.id || item?.title;
          if (id) {
            list.push({
              link: null,
              title: this._formatId(id),
              href: `/${fallbackFolder}/${id}/catalog.json`,
            });
          }
        });
      } else if (typeof rawVal === "string") {
        list.push({
          link: null,
          title: this._formatId(rawVal),
          href: `/${fallbackFolder}/${rawVal}/catalog.json`,
        });
      }
    }
    return list;
  }

  async _copyDoi() {
    const doi = this._doi();
    if (!doi) return;
    try {
      await navigator.clipboard.writeText(doi);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = doi;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textArea);
      }
    }
    this._copied = true;
    this.render();
    if (this._copyTimeout) clearTimeout(this._copyTimeout);
    this._copyTimeout = setTimeout(() => {
      this._copied = false;
      this.render();
    }, 2000);
  }

  _renderMetaList(label, items) {
    if (items.length === 0) return "";
    const firstLink = renderOscLink({
      data: items[0].link || items[0].href,
      title: items[0].title,
      stacUrl: this._stacUrl,
    });
    const moreHtml =
      items.length > 1
        ? `
        <span class="osc-popover-wrapper ms-1">
          <span class="more-badge" tabindex="0" role="button" data-popover-toggle>
            +${items.length - 1}more
          </span>
          <div class="osc-popover-box">
            <div class="d-flex flex-column gap-1">
              ${items
                .slice(1)
                .map((it) =>
                  renderOscLink({
                    data: it.link || it.href,
                    title: it.title,
                    stacUrl: this._stacUrl,
                  })
                )
                .join("")}
            </div>
          </div>
        </span>
      `
        : "";

    return `
      <span class="osc-meta-item">
        <span class="meta-label me-1">${escapeHtml(label)}</span>
        ${firstLink}
        ${moreHtml}
      </span>
    `;
  }

  render() {
    if (!this._isOscProduct()) {
      this.innerHTML = "";
      return;
    }

    const title = this._stac.title || this._stac.id || "";
    const rawType = this._stac["osc:type"] || "product";
    const oscType = rawType.charAt(0).toUpperCase() + rawType.slice(1);
    const parentLink = this._links().find((l) => l && l.rel === "parent") || null;
    const suggestChangesUrl = this._suggestChangesUrl();
    const project = this._project();
    const themes = this._extractList(
      "/themes/",
      /^Theme:\s*/i,
      ["osc:themes", "osc:theme", "themes"],
      "themes"
    );
    const variables = this._extractList(
      "/variables/",
      /^Variable:\s*/i,
      ["osc:variables", "osc:variable", "variables"],
      "variables"
    );
    const missions = this._extractList(
      ["/eo-missions/", "/missions/"],
      /^(EO\s+)?Mission:\s*/i,
      ["osc:missions", "osc:eo-mission", "missions"],
      "eo-missions"
    );

    const rawRegion = this._stac["osc:region"] || this._stac.region;
    const region =
      typeof rawRegion === "string" && rawRegion.trim().length > 0
        ? this._formatId(rawRegion)
        : null;

    const rawStatus = this._stac["osc:status"] || this._stac.status;
    const status =
      typeof rawStatus === "string" && rawStatus.trim().length > 0
        ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
        : null;

    const subMetaParts = [];
    if (themes.length > 0) subMetaParts.push(this._renderMetaList("Theme(s):", themes));
    if (variables.length > 0)
      subMetaParts.push(this._renderMetaList("Variable(s):", variables));
    if (missions.length > 0)
      subMetaParts.push(this._renderMetaList("Mission(s):", missions));
    if (region) {
      subMetaParts.push(
        `<span class="osc-meta-item"><span class="meta-label me-1">Region:</span><span class="meta-value">${escapeHtml(
          region
        )}</span></span>`
      );
    }
    if (status) {
      subMetaParts.push(
        `<span class="osc-meta-item"><span class="meta-label me-1">Status:</span><span class="meta-value">${escapeHtml(
          status
        )}</span></span>`
      );
    }

    const hasSubMeta = subMetaParts.length > 0;
    const hasHeaderMeta = Boolean(project) || hasSubMeta;
    const doi = this._doi();
    const doiUrl = doi ? `https://doi.org/${doi}` : "";
    const doiLabel = this._doiLabel();
    const isCanonical = this._isCanonical();
    const versionLinks = this._versionLinks();
    const latestLink = this._latestLink();
    const canonicalLink = this._canonicalLink();

    const doiPopoverBody = isCanonical
      ? `
        <div class="fw-bold mb-1 text-primary">Canonical DOI</div>
        <div class="text-secondary mb-2">
          This is the persistent canonical DOI which centrally identifies the content shown here as well as references to version history. This content can update through time.
        </div>
        <div class="small text-muted mb-2">
          For persistent citations that will not change, refer to and cite a specific version:
        </div>
        ${
          versionLinks.length > 0
            ? `
          <div class="versions-list border-top pt-2">
            <div class="fw-semibold small mb-1">Available versions:</div>
            <ul class="list-unstyled mb-0 d-flex flex-column gap-1">
              ${versionLinks
                .map(
                  (vLink) => `
                <li class="d-flex align-items-center">
                  ${renderOscLink({
                    data: vLink,
                    title: this._getVersionTitle(vLink),
                    stacUrl: this._stacUrl,
                    className: "stac-link small fw-semibold text-decoration-none",
                  })}
                  ${
                    latestLink && vLink.href === latestLink.href
                      ? `<span class="badge bg-primary-subtle text-primary ms-1 extra-small">Latest</span>`
                      : ""
                  }
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
            : ""
        }
      `
      : `
        <div class="fw-bold mb-1 text-primary">${escapeHtml(doiLabel)}</div>
        <div class="text-secondary mb-1">
          This DOI persistently identifies this specific, immutable version${escapeHtml(
            this._versionText()
          )} that will not change.
        </div>
        ${
          canonicalLink
            ? `
          <div class="mt-2 pt-2 border-top">
            <span class="text-muted small">A general Canonical DOI is also available for the overarching collection:</span>
            <div class="mt-1">
              ${renderOscLink({
                data: canonicalLink,
                stacUrl: this._stacUrl,
                className: "stac-link fw-semibold text-decoration-none",
                innerHtml: "Go to Canonical version →",
              })}
            </div>
          </div>
        `
            : ""
        }
      `;

    this.innerHTML = `
      <div class="osc-product-header mb-4">
        <!-- Row 1: Top navigation bar -->
        <div class="top-nav-bar d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-bottom mb-3">
          <div class="nav-left">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm nav-btn"
              title="Browse Catalogue"
              data-action="toggle-sidebar"
            >
              ${ICONS.list}
              <span class="button-label ms-1">Browse Catalogue</span>
            </button>
          </div>
          <div class="nav-center osc-popover-wrapper">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm nav-btn"
              title="Catalogue Source"
              data-popover-toggle
            >
              ${ICONS.database}
              <span class="button-label ms-1">Catalogue Source</span>
            </button>
            <div class="osc-popover-box">
              <div class="p-1 small">
                <div class="fw-bold mb-1">${escapeHtml(
                  CONFIG.catalogTitle || "Open Science Catalogue"
                )}</div>
                <div class="text-muted text-break mb-2">${escapeHtml(
                  CONFIG.catalogUrl || ""
                )}</div>
                <a
                  href="${escapeHtml(CONFIG.catalogUrl || "")}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-sm btn-outline-primary"
                >
                  Open Root JSON
                </a>
              </div>
            </div>
          </div>
          <div class="nav-right">
            <a
              href="https://earthcode.esa.int"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline-secondary btn-sm nav-btn"
              title="About OSC"
            >
              ${ICONS.infoCircle}
              <span class="button-label ms-1">About OSC</span>
            </a>
          </div>
        </div>

        <!-- Row 2: Product type badge & Action buttons -->
        <div class="action-bar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div class="product-badge d-flex align-items-center">
            <span class="me-1 text-primary d-inline-flex">${ICONS.infoCircle}</span>
            <span class="fw-bold fs-6">${escapeHtml(oscType)}:</span>
          </div>
          <div class="action-buttons d-flex flex-wrap align-items-center gap-2">
            ${
              parentLink
                ? renderOscLink({
                    data: parentLink,
                    stacUrl: this._stacUrl,
                    className:
                      "btn btn-outline-primary btn-sm action-btn d-inline-flex align-items-center",
                    attrs: 'title="Up"',
                    innerHtml: `${ICONS.arrowUp90}<span class="button-label ms-1">Up</span>`,
                  })
                : ""
            }
            ${
              this._stacUrl
                ? `
              <div class="osc-popover-wrapper">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm action-btn d-inline-flex align-items-center"
                  title="Details about the STAC source"
                  data-popover-toggle
                >
                  ${ICONS.infoLg}
                  <span class="button-label ms-1">STAC source</span>
                </button>
                <div class="osc-popover-box osc-popover-right">
                  <div class="p-1 small">
                    ${
                      this._stac.id
                        ? `<div class="mb-1"><strong>ID:</strong> <code>${escapeHtml(
                            this._stac.id
                          )}</code></div>`
                        : ""
                    }
                    ${
                      this._stac.stac_version
                        ? `<div class="mb-2"><strong>STAC Version:</strong> ${escapeHtml(
                            this._stac.stac_version
                          )}</div>`
                        : ""
                    }
                    <div class="mb-1 text-break">
                      <strong>URL:</strong>
                      <a href="${escapeHtml(
                        this._stacUrl
                      )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                        this._stacUrl
                      )}</a>
                    </div>
                  </div>
                </div>
              </div>
            `
                : ""
            }
            ${
              suggestChangesUrl
                ? `
              <a
                href="${escapeHtml(suggestChangesUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-outline-primary btn-sm action-btn d-inline-flex align-items-center"
                title="Suggest Changes"
              >
                ${ICONS.pencil}
                <span class="button-label ms-1">Suggest Changes</span>
              </a>
            `
                : ""
            }
          </div>
        </div>

        <!-- Row 3: Product Title -->
        <h1 class="osc-product-title my-2">${escapeHtml(title)}</h1>

        <!-- Rows 4 & 5: Metadata Container (Project, SubMeta, DOI) -->
        ${
          hasHeaderMeta || doi
            ? `
          <div class="osc-meta-container mb-2">
            ${
              project
                ? `
              <div class="osc-meta-project">
                <span class="meta-label me-1">Part of the project:</span>
                ${renderOscLink({
                  data: project.link || project.href,
                  title: project.title,
                  stacUrl: this._stacUrl,
                  className: "stac-link project-link",
                })}
              </div>
            `
                : ""
            }

            ${
              hasSubMeta
                ? `
              <div class="osc-meta-line d-flex flex-wrap align-items-center">
                ${subMetaParts.join('<span class="meta-separator">|</span>')}
              </div>
            `
                : ""
            }

            ${
              doi
                ? `
              <div class="osc-meta-version-doi d-inline-flex align-items-center">
                <div class="doi-card d-inline-flex align-items-center">
                  <div class="doi-type-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="doi-icon me-1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    <span>${escapeHtml(doiLabel)}</span>
                  </div>
                  <a href="${escapeHtml(
                    doiUrl
                  )}" target="_blank" rel="noopener noreferrer" class="doi-link text-decoration-none" title="Open ${escapeHtml(
                    doiUrl
                  )}">
                    <span class="doi-value font-monospace">${escapeHtml(doi)}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ms-1 external-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  </a>
                  <button
                    type="button"
                    class="btn btn-sm copy-btn ${this._copied ? "copied" : ""}"
                    title="${this._copied ? "Copied to clipboard!" : "Copy DOI"}"
                    data-action="copy-doi"
                  >
                    ${
                      this._copied
                        ? `<span class="copied-indicator">✓ Copied</span>`
                        : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>`
                    }
                  </button>
                  <div class="osc-popover-wrapper d-inline-flex">
                    <button
                      type="button"
                      class="btn btn-sm info-btn"
                      title="${isCanonical ? "About Canonical DOI" : "About Version DOI"}"
                      data-popover-toggle
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                    </button>
                    <div class="osc-popover-box osc-popover-right">
                      <div class="doi-popover-content p-1">
                        ${doiPopoverBody}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `
                : ""
            }
          </div>
        `
            : ""
        }
        <hr class="header-divider mt-3 mb-0">
      </div>
    `;
  }
}

if (typeof customElements !== "undefined" && !customElements.get("osc-product-header")) {
  customElements.define("osc-product-header", OscProductHeader);
}
