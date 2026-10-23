# Open Science Catalogue (OSC) Frontend

A lightweight, **100% Vanilla JavaScript & Web Components** frontend for the European Space Agency's (ESA) **Open Science Catalogue (OSC)** that integrates **STAC Browser** as a native Web Component (`<stac-browser>`) alongside custom OSC views (Landing Page, Search, Metrics, FAIR Principles, and FAIR Preview).

---

## Architecture Overview

Unlike the previous forked STAC Browser + Vue + `<iframe>` setup (`open-science-catalog-stac-browser`), this repository is a standalone, framework-free application (with `@eox/esa-ui` as its only runtime dependency) that embeds `<stac-browser>` and custom `<osc-*>` Web Components directly in the DOM:

```text
+-------------------------------------------------------------------+
|                     OSC Frontend (index.html)                     |
|   ESA Header (<esa-header>, <esa-navbar>, <esa-menu>) + Footer    |
+-------------------------------------------------------------------+
|  /               -> Landing Page   (public/index-static.html)     |
|  /search         -> Search Page    (EOX ItemFilter search)        |
|  /metrics        -> Metrics Page   (OSC Metrics & Charts)         |
|  /fair           -> FAIR Guiding Principles                       |
|  /fair-preview   -> Standalone <osc-fair-assessment> Preview      |
|  /privacy-notice -> Privacy Notice                                |
|                                                                   |
|  /:pathMatch(.*)* -> src/pages/catalog-page.js                    |
|    +-----------------------------------------------------------+  |
|    | <stac-browser> Web Component (Shadow DOM, inline mode)    |  |
|    |   - slot="root-before-content":                           |  |
|    |       <osc-product-header>                                |  |
|    |   - slot="view-catalog-meta-end":                         |  |
|    |       <osc-data-access>                                   |  |
|    |       <osc-fair-assessment>                               |  |
|    |       <osc-forum-topics>                                  |  |
|    +-----------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

### Custom Vanilla Web Components (`src/widgets/`)
All custom OSC widgets are implemented as standard `HTMLElement` Web Components (`customElements.define`):
1. **`<osc-product-header>` (`src/widgets/osc-product-header.js`):** Slotted into `slot="root-before-content"`. Renders the top navigation bar, product badge, action buttons (`Up`, `STAC source` popover, `Suggest Changes`), product title, project link, themes/variables/missions with `+N more` popovers, region, status, and the Canonical/Version DOI badge with copy button and version history popover.
2. **`<osc-data-access>` (`src/widgets/osc-data-access.js`):** Slotted into `slot="view-catalog-meta-end"`. Unified data access panel for external access links (Zenodo, notebooks, portals), sub-catalogs, item granules (with smooth scroll to `::part(items)`), and direct asset downloads.
3. **`<osc-fair-assessment>` (`src/widgets/osc-fair-assessment.js`):** Slotted into `slot="view-catalog-meta-end"` (and reused standalone on `/fair-preview`). Renders the multi-layer `<eox-chart>` FAIR donut chart and expandable F-A-I-R checklist accordion.
4. **`<osc-forum-topics>` (`src/widgets/osc-forum-topics.js`):** Slotted into `slot="view-catalog-meta-end"`. Queries the EarthCODE Discourse API by collection title and displays related forum discussions.

### Key `<stac-browser>` Customizations
- **Custom Metadata Fields (`stac-fields` Registry):** Imports `{ Registry }` from `stac-browser.js` (`src/stac-fields-setup.js`) to register `sci:doi`, `sci:publications`, `vcs` link relations, and OSC field label overrides (`Release date`, `Start date`, `End date`).
- **Runtime Config (`config.js`):** Passes `basemaps` (EOX Terrain Light), `ignoreMetadata` (filtering out `fair:*`, `osc:*`, and deduplicated DOIs), and `preprocessSTAC` (handling canonical vs. versioned DOIs and deduplicating links) via `<stac-browser>.config`.
- **CSS Shadow Parts (`::part()`):** Uses `stac-browser.is-osc-product::part(header)`, `::part(catalogs)`, `::part(details)`, and `::part(items)` to render the 2-column Product page layout with items full-width below.

> For a detailed technical analysis of this architecture, see [`docs/web-component-feasibility-analysis.md`](docs/web-component-feasibility-analysis.md).

---

## Note on STAC Browser Web Component Source (Draft PR #778 -> v6.0.0)

> **IMPORTANT:**  
> Currently, the `<stac-browser>` web component is built from the upstream STAC Browser draft PR [`radiantearth/stac-browser#778`](https://github.com/radiantearth/stac-browser/pull/778) (`use-as-component` branch) via [`scripts/build-stac-browser.js`](scripts/build-stac-browser.js) and output to `public/stac-browser/`.
>
> **Once STAC Browser v6.0.0 is officially released on npm ([`radiantearth/stac-browser#1034`](https://github.com/radiantearth/stac-browser/pull/1034)):**
> 1. Install the official npm package:
>    ```bash
>    npm install @radiantearth/stac-browser@^6.0.0
>    ```
> 2. `scripts/build-stac-browser.js` will automatically detect `node_modules/@radiantearth/stac-browser` and copy the pre-built package directly into `public/stac-browser/` instead of cloning and building the upstream `use-as-component` branch.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```
*(This automatically runs `scripts/download-cdns.js` and `scripts/build-stac-browser.js` if `public/eox/` or `public/stac-browser/` are not yet cached, and starts Vite on `http://localhost:8080`.)*

### 3. Build for Production
```bash
npm run build
```
The static production bundle is written to `dist/` in ~0.5s.

### 4. Run End-to-End Tests (Playwright)
```bash
npm test
```

---

## Docker Build & Deployment

Build the production Docker image:
```bash
docker build -t open-science-catalogue-frontend .
```

Run the container (supports `SB_*` runtime environment variables):
```bash
docker run -p 8080:8080 \
  -e SB_catalogUrl="https://esa-earthcode.github.io/open-science-catalog-metadata/catalog.json" \
  -e SB_apiUrl="https://eoapi.workspace.earthcode.eox.at/stac" \
  open-science-catalogue-frontend
```

---

## CI/CD Workflows (`.github/workflows/`)

- **`ci.yml`:** Runs on push and pull requests to `main` and `develop`. Builds the bundle and executes the Playwright E2E test suite.
- **`deploy-gh-pages.yml`:** Runs on pushes to `develop` / `main` (and manual `workflow_dispatch`). Builds the static site with SPA fallback (`404.html`) and deploys to GitHub Pages.
- **`publish-docker.yml`:** Runs on version tags (`v*`), GitHub releases, or manual `workflow_dispatch`. Builds and publishes the Docker image to GitHub Container Registry (`ghcr.io`) and Docker Hub (when `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are configured).
