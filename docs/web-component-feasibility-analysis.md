# Feasibility Analysis: Migrating OSC from a STAC Browser Fork to the `<stac-browser>` Web Component

**Date:** October 2026  
**Context:** Upstream PR [`radiantearth/stac-browser#778`](https://github.com/radiantearth/stac-browser/pull/778) (`use-as-component` branch), [`radiantearth/stac-browser#1034`](https://github.com/radiantearth/stac-browser/pull/1034) (npm package), and [`EOEPCA/user-client#3`](https://github.com/EOEPCA/user-client/issues/3)  
**Target:** Evaluate whether the Open Science Catalogue (OSC) can drop its custom fork + `<iframe>` architecture in favor of a lightweight static website that consumes `@radiantearth/stac-browser` (v6.0.0) as a standard Web Component via npm.

---

## 1. Executive Summary & Verdict

### Verdict: **Yes — Fully Feasible (with minor host-side adaptations and 3 small upstream suggestions)**

With the latest commits added to [`radiantearth/stac-browser#778`](https://github.com/radiantearth/stac-browser/pull/778) (`e41c3216a`, `e7acab2e5`, `638bc8544`, `ebc8cc094`, `1445b6781`, `65251678a`), **all major architectural blockers that previously forced OSC to maintain a source fork of STAC Browser have been resolved**:

1. **No more `<iframe>` or `postMessage` bridge:** `<stac-browser>` encapsulates its Bootstrap CSS inside an open Shadow DOM (`inline` layout mode by default), preventing style bleeding into the ESA shell/static pages while allowing the entire page to scroll naturally as a single document.
2. **Native Slots for Widget Hooks (`e41c3216a`):** Every `<WidgetHook>` in STAC Browser now renders a native `<slot name="<hook-id>">` when embedded. Our custom Vue widgets (`OscProductHeader`, `OscDataAccess`, `FairAssessment`, `ForumTopics`) can live in our lightweight host website and be slotted directly into `<stac-browser>`, fed reactively by the component's `@data` and `@navigate` events.
3. **Runtime Metadata Fields & `ignoreMetadata` (`638bc8544`, `e7acab2e5`):** The `stac-fields` `Registry` is now exported directly from `stac-browser.js`, and `ignoreMetadata` is now a runtime function on `el.config`. All of `fields.config.js` (`sci:doi`, `sci:publications`, `vcs` link mapping, field label overrides, and field hiding) can be configured at runtime from the host app.
4. **Structural CSS Shadow Parts & Page States (`ebc8cc094`):** `<stac-browser>` exposes `::part(header)`, `::part(site-header)`, `::part(page-header)`, `::part(details)`, `::part(resources)`, `::part(catalogs)`, `::part(items)`, `::part(footer)`, and `::part(sidebar)`, alongside `:state(catalog)`, `:state(collection)`, `:state(item)`, etc.
5. **Core Patches Eliminated via `preprocessSTAC`:** The core modifications we made on the `new-product-page` branch (`DeprecationMixin.js`, `DeprecationNotice.vue`, `src/rels.js`, `src/locales/en/custom.json`) can all be achieved cleanly via `el.config.preprocessSTAC` and the exported `Registry` without patching STAC Browser source files.

### Summary Matrix of Current Fork Customizations vs. `<stac-browser>` Web Component

| OSC Feature / Customization | Current Fork Implementation | `<stac-browser>` Web Component Equivalent | Status |
| :--- | :--- | :--- | :--- |
| **Outer ESA Shell & Static Pages** (`/`, `/metrics`, `/search`, `/fair`, `/privacy-notice`) | Vite MPA (`index.html` + `catalog.html` in `<iframe>`) | Lightweight host app owns top-level routes and renders `<stac-browser>` directly on catalog routes | **Ready out-of-the-box** |
| **CSS Isolation** (prevent Bootstrap from breaking ESA UI / static pages) | `<iframe>` boundary | Shadow DOM encapsulation (`stac-browser.css` scoped to shadow root) | **Ready out-of-the-box** |
| **URL & History Sync** (clean URLs without `#` or `.json`) | `src/main.js` `postMessage` patch + `CatalogPage.vue` hash sync | `@navigate` event (`{ path, url }`) + `el.navigate(path)` / `el.navigateToStac(url)` | **Ready out-of-the-box** |
| **Editor Live Preview & `/fair-preview`** | `src/main.js` custom `force` Vuex mutation via `postMessage` | Native `el.setData(data, url)` method (`49a65de`, `020204b`) | **Ready out-of-the-box** |
| **Custom Basemaps** (EOX Terrain Light) | `basemaps.config.js` | `el.config = { basemaps: { earth: [...] } }` | **Ready out-of-the-box** |
| **Custom `stac-fields` Formatters** (`sci:doi`, `sci:publications`, `vcs`) | `fields.config.js` | `import { Registry } from '@radiantearth/stac-browser'` (`638bc8544`) | **Ready out-of-the-box** |
| **Field Label Overrides** (`Release date`, `Start date`, `End date`, `Scientific Citation`) | `src/locales/en/custom.json` | Override directly on exported `Registry.fields.*` and `Registry.addExtension('sci', ...)` | **Ready out-of-the-box** |
| **Hiding Redundant Metadata Fields** (`fair:*`, `osc:*`, duplicate DOIs) | `ignoreMetadata` in `fields.config.js` | `el.config = { ignoreMetadata: (object, fields, type) => ... }` (`e7acab2e5`) | **Ready out-of-the-box** |
| **Product Header (`OscProductHeader.vue`)** | Vue widget in `widgets.config.js` (`root-before-content`) + CSS `:has()` | Host component in `<div slot="root-before-content">` + `stac-browser.is-osc-product::part(header) { display: none; }` | **Ready (with minor adaptation for sidebar toggle)** |
| **Unified Data Access (`OscDataAccess.vue`)** | Vue widget in `widgets.config.js` (`view-catalog-meta-end`) | Host component in `<div slot="view-catalog-meta-end">`, reading `@data` and calling `el.navigateToStac()` | **Ready out-of-the-box** |
| **FAIR Assessment (`FairAssessment.vue`)** | Vue widget in `widgets.config.js` (`view-catalog-meta-end`) | Host component in `<div slot="view-catalog-meta-end">`, reading `@data` | **Ready out-of-the-box** |
| **Forum Topics (`ForumTopics.vue`)** | Vue widget in `widgets.config.js` (`view-catalog-meta-end`) | Host component in `<div slot="view-catalog-meta-end">` or `slot="footer-start"` | **Ready out-of-the-box** |
| **Product Page 2-Column Details Grid** (Left: Details, Right: Data Access + FAIR, Bottom: Items) | `src/theme/custom.scss` targeting `.col.meta > section:not(.widget)` | `::part(details)` + `::part(items)`; requires 1-line `shadowRoot` style or upstream `part` on child sections (see §3.4) | **Feasible (1-line `shadowRoot` CSS or upstream tweak)** |
| **Custom Link Relations** (`osc:metadata`, `osc:data-access`, `osc:subcatalog`, `has-version`, `is-version-of`) | `src/rels.js` + `config.js` `preprocessSTAC` | Stash raw links on `stac['osc:links']` and filter `stac.links` in `preprocessSTAC` (or ask upstream for `relationTypes` in `config`) | **Feasible via `preprocessSTAC` (or upstream config)** |
| **Canonical vs. Versioned `DeprecationNotice`** (`#24`, `#25`) | Patched `DeprecationMixin.js` & `DeprecationNotice.vue` | Handle in `preprocessSTAC` (hide `latest-version` rel on canonical collections; rewrite version titles) | **Feasible via `preprocessSTAC`** |
| **ESA Brand Colors & Theme** (`#003247`, `#335E6F`) | `src/theme/variables.scss` | Inline CSS custom properties (`--bs-primary`, `--bs-secondary`, `--sb-header`, etc.) | **Ready out-of-the-box** |
| **ESA Heading Font (`NotesESAbold`)** | `$headings-font-family` in `src/theme/variables.scss` | Requires 1-line `shadowRoot` style or upstream `--sb-headings-font-family` CSS variable (see §5.2) | **Feasible (1-line `shadowRoot` CSS or upstream tweak)** |

---

## 2. Architectural Comparison: Current Fork vs. Lightweight Web Component Host

### 2.1 Current Architecture (Fork + MPA + `<iframe>`)
Currently, `open-science-catalog-stac-browser` forks `radiantearth/stac-browser` and builds two separate Vite entry points:
1. **`index.html` (`custom/frame-main.js` & `custom/StacBrowserWrapper.vue`):** Renders the ESA header/navbar (`@eox/esa-ui`), mobile drawer, cookie banner, footer, "Suggest changes" floating button, and Vue Router views for `/`, `/metrics`, `/search`, `/fair`, `/fair-preview`, `/privacy-notice`, and `/:pathMatch(.*)*` (`CatalogPage.vue`).
2. **`catalog.html` (`src/main.js`):** Runs the full forked STAC Browser inside an `<iframe>` with `historyMode: "hash"`, communicating with `CatalogPage.vue` via `window.parent.postMessage`.

**Pain points of the current approach:**
- Every upstream STAC Browser upgrade requires merging/rebasing against upstream, resolving conflicts in `src/`, `config.js`, `package.json`, and `vite.config.js`, and maintaining custom Docker/GitHub Actions pipelines.
- The `<iframe>` requires fixed viewport height calculations (`height: calc(100vh - var(--esa-shell-offset, 177px))`), causes inner vs. outer scrollbar friction, and requires `postMessage` hacks for navigation and live preview data injection.

### 2.2 Target Architecture (Lightweight Static Website + `<stac-browser>` npm Package)
With `@radiantearth/stac-browser` published to npm (starting with v6.0.0, or built from `#778`):
- **Single-layer application:** The repository contains **only** the lightweight OSC website (`index.html`, ESA header/footer wrapper, static pages for Landing/Metrics/Search/FAIR, and the 4 custom OSC widget components).
- **Direct DOM embedding (`isolation="inline"`):** Instead of an `<iframe>`, `CatalogPage` mounts `<stac-browser>` directly in the page.
  - Because `isolation="inline"` is the default, `<stac-browser>` grows naturally with its content, the browser has a single unified scrollbar, and the ESA footer sits naturally at the bottom of the document.
  - Because `<stac-browser>` uses an open Shadow DOM and loads `stac-browser.css` strictly inside its shadow root, STAC Browser's Bootstrap 5 styles never leak into the ESA shell or other pages.

---

## 3. In-Depth Analysis of OSC "Products" Page Customizations (`new-product-page`)

The OSC "Products" page (`new-product-page` branch, PR #23, Issues #20, #24, #25, #27) is the most heavily customized view in the application. Below is a component-by-component technical verification of how every customization on the Products page translates to the `<stac-browser>` web component.

### 3.1 Custom Product Header (`OscProductHeader.vue`)

In the current fork, `OscProductHeader.vue` is registered under the `root-before-content` widget hook and renders only when `stac['osc:type']?.toLowerCase() === 'product'`. When active, `src/theme/custom.scss` hides the default STAC Browser `<header>` via `#stac-browser:has(.osc-product-header) > header { display: none !important; }`.

#### How it works with `<stac-browser>`:
1. **Slotting into `root-before-content`:**
   ```html
   <stac-browser ref="browser" :class="{ 'is-osc-product': isOscProduct }">
     <OscProductHeader
       v-if="isOscProduct"
       slot="root-before-content"
       :stac="currentStacData"
       :stac-url="currentStacUrl"
       @navigate-stac="onNavigateStac"
     />
   </stac-browser>
   ```
2. **Hiding the default STAC Browser header on Product pages:**
   Because `<stac-browser>` exposes `part="header"`, `part="site-header"`, and `part="page-header"`, the host page CSS can conditionally hide the default header whenever `isOscProduct` is true:
   ```css
   /* Hide the entire STAC Browser header on OSC Product pages */
   stac-browser.is-osc-product::part(header) {
     display: none;
   }
   /* Also hide STAC Browser's internal footer globally since the ESA shell provides the footer */
   stac-browser::part(footer) {
     display: none;
   }
   ```
3. **Data binding (`project`, `themes`, `variables`, `missions`, `region`, `status`, `doi`, `versionLinks`, `canonicalLink`):**
   - `OscProductHeader` computes all of these from the STAC JSON object and URL.
   - `<stac-browser>` emits `@data` (`event.detail = { url, data }`) whenever the displayed entity changes. Passing `event.detail.data` and `event.detail.url` as props to `OscProductHeader` gives it 100% of the data it needs without Vuex.
   - **Important note on Popovers inside Slotted Content:** In `OscProductHeader`, `+N more` badges for Themes, Variables, Missions, and the Canonical/Version DOI info button use popovers. Because slotted elements remain in the **host page's light DOM**, their popovers (whether using Bootstrap popovers, native HTML `[popover]`, or Floating UI) render in the host page and are styled by the host page's CSS with zero Shadow DOM clipping issues.
4. **Internal STAC Navigation (clicking Project, Theme, Variable, Mission, Up, or Version links):**
   - In the fork, `OscProductHeader` used STAC Browser's internal `<StacLink>` component.
   - In the web component, `OscProductHeader` can use a simple host helper component or `<a>` tag that resolves the target `href` against `currentStacUrl` (`new URL(href, currentStacUrl).href`) and calls `stacBrowserEl.navigateToStac(resolvedUrl)` on click, while setting the clean browser path as the `href` attribute so middle-click ("Open in new tab") works natively.
5. **Minor Adaptation Needed — Top Action Bar (`Browse Catalogue`, `Catalogue Source`, `StacSource`):**
   - In `OscProductHeader.vue`, Row 1 has a `"Browse Catalogue"` button that called `this.$root.sidebar = !this.$root.sidebar`, a `"Catalogue Source"` button that rendered STAC Browser's internal `<RootStats />`, and Row 2 rendered `<StacSource />`.
   - In the web component, internal Vue components (`RootStats`, `StacSource`) and `this.$root.sidebar` are not directly exported on the custom element API.
   - **How to handle this cleanly:**
     - **Option 1 (Keep `::part(site-header)` or trigger via `shadowRoot`):** If `OscProductHeader` keeps its `"Browse Catalogue"` button, clicking it can trigger the Browse button inside the open shadow root (`stacBrowserEl.shadowRoot.querySelector('header [part="site-header"] button')?.click()`), or we can ask `@m-mohr` to expose a `toggleSidebar()` method on `<stac-browser>`.
     - **Option 2 (Lightweight host `StacSource` popover):** `StacSource` in OSC only shows the STAC ID, STAC Version (`data.stac_version`), Validation link, and the raw JSON URL (`currentStacUrl`) with a copy button — which is ~25 lines of HTML/JS in `OscProductHeader`.

---

### 3.2 Unified Data Access Widget (`OscDataAccess.vue`)

`OscDataAccess.vue` consolidates 4 data access channels for OSC Products into a single card section:
1. **External Access Links** (Zenodo, Jupyter Notebooks, S3/THREDDS portals)
2. **Sub-Catalogs & Child Collections** (navigating into child STAC catalogs)
3. **Data Items / Granules** (showing count of items and a `"Browse Items"` button that smooth-scrolls down to the items panel)
4. **Direct Download Collection Assets** (`stac.assets`)

#### How it works with `<stac-browser>`:
- **Slotting:** Placed in `<OscDataAccess slot="view-catalog-meta-end" :stac="currentStacData" :stac-url="currentStacUrl" />`.
- **Sub-Catalog Navigation:** Clicking `"Browse Catalog"` on a sub-catalog card calls `stacBrowserEl.navigateToStac(new URL(cat.href, currentStacUrl).href)`.
- **Scrolling to Items (`scrollToItems`):**
  - In the fork, `scrollToItems()` called `document.querySelector('.items-container').scrollIntoView({ behavior: 'smooth' })`.
  - With `<stac-browser>`, `.items-container` is inside the Shadow DOM and has `part="items"`. Since the shadow root is `open`, `stacBrowserEl.shadowRoot.querySelector('[part~="items"]')?.scrollIntoView({ behavior: 'smooth' })` works directly (or we can place an empty `<div slot="view-catalog-items-start" id="items-anchor"></div>` in the light DOM and scroll to `#items-anchor`).
- **Counting Items (`itemsCount`):**
  - For static OSC product collections, items are listed as `rel: "item"` links in `collection.json`, which are immediately available in `currentStacData.links.filter(l => l?.rel === 'item').length`.

---

### 3.3 FAIR Assessment (`FairAssessment.vue`) & Forum Topics (`ForumTopics.vue`)

- **`FairAssessment.vue`:**
  - Uses the `<eox-chart>` web component and standard HTML/CSS to render the FAIR donut chart and expandable F-A-I-R category checklist from `fair:*` properties on the STAC Collection JSON.
  - Has **zero** dependencies on STAC Browser internals (it only reads `data` from the store).
  - Works out-of-the-box in `<FairAssessment slot="view-catalog-meta-end" :stac="currentStacData" />`.
  - Furthermore, on the standalone `/fair-preview` route (`FairPreviewPage.vue`), `<FairAssessment :stac="fakeCollection" />` can now receive the mock collection object via a standard Vue prop instead of needing a dummy Vuex store.
- **`ForumTopics.vue`:**
  - Queries `${discourseRoot}/search.json?q=${encodeURIComponent(stac.title)}` and renders matching EarthCODE Discourse threads plus a `"Start a new topic on the EarthCODE forum"` link.
  - Has **zero** dependencies on STAC Browser internals.
  - Works out-of-the-box in `slot="view-catalog-meta-end"` (or `slot="footer-start"`).

---

### 3.4 The Two-Column Product Page Layout (Critical Technical Detail)

On the `new-product-page` branch (commit `233d45d1`), OSC Product pages use a specialized layout:

```
+-----------------------------------------------------------------------+
| OscProductHeader (slot="root-before-content") — Full Width (100%)     |
+-----------------------------------+-----------------------------------+
| LEFT COLUMN (1.15fr):             | RIGHT COLUMN (1fr):               |
| Native STAC Browser Details       | Custom Slotted Widgets            |
| - Description & DeprecationNotice | - OscDataAccess                   |
| - Keywords, License, Temporal     | - FairAssessment                  |
| - Map / Thumbnails Preview        |                                   |
| - Assets & Providers              |                                   |
| - MetadataGroups (Sci Citation)   |                                   |
| - Additional Resources (LinkList) |                                   |
+-----------------------------------+-----------------------------------+
| FULL WIDTH BELOW (100%):                                              |
| - ForumTopics                                                         |
| - Native STAC Browser Items (`::part(items)`)                         |
+-----------------------------------------------------------------------+
```

#### How `Catalog.vue` in `#778` is structured:
Inside `<stac-browser>`, `Catalog.vue` renders:
```html
<div class="cc collection ...">
  <div class="row"> <!-- Bootstrap flex row with flex-wrap: wrap -->
    <div class="col meta" part="details">
      <slot name="view-catalog-meta-start"></slot>
      <section class="intro">...</section>
      <section class="mb-4"><!-- Map & Thumbnails --></section>
      <div class="assets">...</div>
      <section class="providers">...</section>
      <section class="metadata">...</section>
      <section class="links">...</section>
      <slot name="view-catalog-meta-end"></slot>
    </div>
    <div class="col catalogs-container" part="catalogs">...</div>
    <div class="col items-container" part="items">...</div>
  </div>
</div>
```

#### What works directly via `::part()` CSS from the host page:
1. **Hiding the sub-catalogs column on Product pages:**
   ```css
   stac-browser.is-osc-product::part(catalogs) {
     display: none;
   }
   ```
2. **Stacking `details` (100% width on top) and `items` (100% width below):**
   Because `.row` in Bootstrap already has `display: flex; flex-wrap: wrap`, setting `flex: 0 0 100%; max-width: 100%` on `::part(details)` and `::part(items)` stacks `items` cleanly below `details` and overrides STAC Browser's default `column-count: 2` on `.collection.empty .meta`:
   ```css
   stac-browser.is-osc-product::part(details) {
     flex: 0 0 100%;
     max-width: 100%;
     column-count: unset;
   }
   stac-browser.is-osc-product::part(items) {
     flex: 0 0 100%;
     max-width: 100%;
     margin-top: 2rem;
   }
   ```
3. **Placing `ForumTopics` full-width below:**
   Either place `<ForumTopics>` in `slot="view-catalog-meta-end"` with `grid-column: 1 / -1`, or place it in `slot="footer-start"` / `slot="root-end"` where it naturally spans 100% width at the bottom of the page.

#### The CSS Shadow Parts Nuance for the 2-Column Split inside `::part(details)`:
When we set `display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-auto-flow: dense; column-gap: 2.5rem;` on `stac-browser.is-osc-product::part(details)`:
- Our slotted widgets (`<OscDataAccess slot="view-catalog-meta-end">` and `<FairAssessment slot="view-catalog-meta-end">`) live in the **light DOM**, and because `<slot>` has `display: contents` by default, the slotted elements participate directly as **grid children** of `part="details"`. Thus, host CSS can directly set `grid-column: 2` on them!
- **However**, the native STAC Browser sections (`<section class="intro">`, `<section class="mb-4">` map, `<MetadataGroups>`, `<LinkList>`) are inside the **Shadow DOM** as direct children of `part="details"`.
- Per the W3C CSS Shadow Parts specification, **`::part()` cannot be followed by descendant or child combinators** (i.e., `stac-browser::part(details) > section { grid-column: 1; }` is invalid CSS).
- Without `grid-column: 1` on those internal `<section>` elements, CSS Grid's auto-placement algorithm places `section.intro` in Column 1, the Map preview `section` in Column 2, `MetadataGroups` in Column 1, and `LinkList` in Column 2.

#### How to solve this:
1. **Immediate Host-Side Solution (works right now with `#778`, 0 upstream changes):**
   Because `<stac-browser>` uses an **open** shadow root (`attachShadow({ mode: 'open' })`), we can append a tiny `<style>` rule to `stacBrowserEl.shadowRoot` when the element connects:
   ```js
   const style = document.createElement('style');
   style.textContent = `.cc .col.meta > :not(slot) { grid-column: 1; }`;
   stacBrowserEl.shadowRoot.appendChild(style);
   ```
   This 3-line snippet is a complete no-op when `part="details"` is in its normal block/flex layout, and pins all native STAC Browser sections to Column 1 whenever `stac-browser.is-osc-product::part(details)` enables `display: grid`.
2. **Clean Upstream Solution to suggest to `@m-mohr` in `#778`:**
   Ask `@m-mohr` to expose `part` attributes on the direct child blocks of `Catalog.vue` and `Item.vue` (e.g., `part="intro"`, `part="preview"`, `part="assets"`, `part="providers"`, `part="metadata"`, `part="links"` — or a shared token `part="section intro"`, etc.) and/or add `.meta > :not(slot) { grid-column: 1; }`. That way:
   - Host pages can pin all native sections to Column 1 purely via standard `::part()` CSS without touching `shadowRoot`.
   - Host pages can also hide or reorder individual content blocks (e.g., `::part(preview)`, `::part(providers)`, `::part(links)`) using standard CSS `display: none` or `order`.

---

### 3.5 Canonical & Versioned DOIs, Link Filtering, and `DeprecationNotice` (`#24`, `#25`, `#27`)

In the fork, supporting Canonical DOIs, version navigation, and deduplicating metadata required touching several files:
- `fields.config.js` (`sci:doi`, `sci:publications`, `ignoreMetadata`)
- `config.js` (`preprocessSTAC`)
- `src/rels.js` (`has-version`, `is-version-of`, `osc:metadata`, `osc:data-access`, `osc:subcatalog`)
- `src/components/DeprecationMixin.js` & `src/components/DeprecationNotice.vue`

#### How all of this is achieved in the Web Component without patching STAC Browser source code:

1. **Custom `stac-fields` Formatters (`fields.config.js`):**
   Using the newly exported `Registry` from `@radiantearth/stac-browser`:
   ```js
   import { Registry } from '@radiantearth/stac-browser';

   Registry.addExtension('sci', 'Scientific Citation');
   Registry.addMetadataField('sci:doi', { /* exact same formatter as fields.config.js */ });
   Registry.addMetadataField('sci:publications', { /* exact same formatter as fields.config.js */ });
   Registry.fields.links.rel.mapping.vcs = 'Version Control System';

   // Override default field labels (replaces src/locales/en/custom.json):
   if (Registry.fields.created) Registry.fields.created.label = 'Release date';
   if (Registry.fields.start_datetime) Registry.fields.start_datetime.label = 'Start date';
   if (Registry.fields.end_datetime) Registry.fields.end_datetime.label = 'End date';
   ```

2. **`ignoreMetadata` Runtime Config (`e7acab2e5`):**
   Passed directly on `el.config`:
   ```js
   el.config = {
     ignoreMetadata: (object, fields, type) => {
       // Exact same function currently in fields.config.js
     }
   };
   ```

3. **Eliminating `src/rels.js`, `DeprecationMixin.js`, and `DeprecationNotice.vue` patches via `preprocessSTAC`:**
   - **Why `src/rels.js` was patched in the fork:**
     In the fork, `preprocessSTAC` renamed links (`rel = 'osc:metadata'`, `rel = 'osc:data-access'`, `rel = 'osc:subcatalog'`) so that internal Vue widgets could still find them in `store.state.data.links`, and then `src/rels.js` hid those custom `rel`s from STAC Browser's "Additional Resources" (`LinkList`) and sub-catalogs (`Catalogs`).
   - **How to do this cleanly in the Web Component's `preprocessSTAC`:**
     In `preprocessSTAC(stac)`:
     1. Save a full copy of the unmodified links on `stac['osc:links'] = structuredClone(stac.links)`. (Because `stac.toJSON()` preserves all non-private properties on `stac`, `event.detail.data['osc:links']` is passed intact to our slotted `OscProductHeader` and `OscDataAccess` components!).
     2. **Filter out** the duplicate metadata links (`/projects/`, `/themes/`, `/variables/`, `/eo-missions/`), product data-access links, and product sub-catalog `child` links directly from `stac.links`. Because they are removed from `stac.links`, STAC Browser's "Additional Resources" and `.catalogs-container` will not render them — **requiring zero changes to `src/rels.js`!**
     3. **Suppress false "Outdated" alerts on Canonical collections (`DeprecationMixin.js`):**
        In upstream STAC Browser, `DeprecationNotice` is shown whenever `stac.links` contains a `latest-version`, `successor-version`, or `predecessor-version` link. On an OSC Canonical collection (`has-version` link present, `is-version-of` absent), removing `rel: 'latest-version'` from `stac.links` in `preprocessSTAC` (while keeping it in `stac['osc:links']` for `OscProductHeader`'s version selector) prevents `DeprecationMixin` from showing the "Outdated" warning on Canonical collections!
     4. **Disambiguate version titles in `DeprecationNotice.vue`:**
        On frozen versioned collections (`is-version-of` present), `preprocessSTAC` can rewrite generic titles (`"Latest version"`, `"Predecessor version"`) on `latest-version` / `predecessor-version` / `successor-version` links to their resolved version numbers (e.g. `v1`, `v2`), and convert `is-version-of` into a navigable link or display the Canonical link in `OscProductHeader`.

---

## 4. Analysis of "Content Blocks" Possibilities

Across the `EOEPCA/user-client` roadmap (Issues #4, #8, #10, #12, #15, #17, #23), **"content blocks"** encompasses three levels of extensibility in STAC Browser:
1. **Widgets / Slot Content Blocks** (`#830` & `#778` commit `e41c3216a`) — modular blocks injected into specific view hooks.
2. **Action Plugins** (`#734`) — contextual action buttons on STAC entities, assets, and links.
3. **Custom Pages / Views** (`#832` / `#1039`) — standalone frontpages and content views.

Below is an analysis of what is now possible with content blocks in the Web Component architecture and how OSC can leverage them.

### 4.1 Native `<slot>` Content Blocks (All 19 Available Hooks)

In `#778` (commit `e41c3216a`), every `<WidgetHook>` inside STAC Browser renders a native `<slot name="<hook-id>">`. Unlike `widgets.config.js` (which required Vue components compiled inside the STAC Browser fork), **native slots accept any DOM element, Web Component (`@eox/*`), or host framework component**, and dynamically appear whenever the active view contains that hook.

| View / Scope | Slot Name (`slot="..."`) | Position in View | Current & Potential OSC Content Blocks |
| :--- | :--- | :--- | :--- |
| **Global Shell** (`StacBrowser.vue`) | `root-start` | Top of `#stac-browser`, above `<header>` | Global announcement / maintenance banner |
| **Global Shell** (`StacBrowser.vue`) | `root-before-content` | Between `<header>` and main `<router-view>` | **Current:** `OscProductHeader`<br>**New Possibility:** Custom headers for **Projects** (`osc:type === 'project'`), **Workflows/Experiments**, and **Earth Science Data Collections** (Issue #22) |
| **Global Shell** (`StacBrowser.vue`) | `footer-start` | Above footer links | **Current/New:** Full-width `ForumTopics` block across all Collection and Item views |
| **Global Shell** (`StacBrowser.vue`) | `root-end` | Bottom of `#stac-browser` | Floating contextual tools (e.g., "Suggest changes" dial) |
| **Catalog / Collection** (`Catalog.vue`) | `view-catalog-meta-start` | Top of `part="details"`, above Description | **New Possibilities:**<br>1. **External Catalog Banner:** Warn users when browsing an external sub-catalog with a button to return to the OSC Product.<br>2. **Data Collection Summary Block (Issue #22):** Structured overview of spatial/temporal resolution, projections, and datacube structure.<br>3. **Version Status Banner:** Clean ESA-styled notice on frozen version pages (`collection_v1.json`). |
| **Catalog / Collection** (`Catalog.vue`) | `view-catalog-meta-end` | Bottom of `part="details"` (or Right Column in 2-col Grid) | **Current:** `OscDataAccess`, `FairAssessment`, `ForumTopics`<br>**New Possibilities:**<br>1. **Standalone Publications & Citation Block (Issue #27):** Separate block for `sci:publications` and a formatted citation box with a 1-click **"Copy Citation"** button.<br>2. **Linked Workflows & Experiments Block:** Visual cards for the Experiments and Workflows associated with a Product. |
| **Catalog / Collection** (`Catalog.vue`) | `view-catalog-catalogs-start` / `-end` | Above / below child Catalogs list (`part="catalogs"`) | **New Possibility:** Quick filter pills on Theme / Variable / Project / Data Collection pages (e.g., filter child cards by Science Cluster or by OSC type). |
| **Catalog / Collection** (`Catalog.vue`) | `view-catalog-items-start` / `-end` | Above / below Items list (`part="items"`) | **New Possibility:** Scroll anchor for `"Browse Items"`; collapsible Python (`pystac-client` / `xarray`) code snippet block for opening the collection's items in the EarthCODE Workspace. |
| **Item View** (`Item.vue`) | `view-item-primary-start` / `-end` | Left column (`part="resources"`), above/below Map & Assets | **New Possibility for OSC Workflows & Experiments (`record.json`):** Since OSC Workflows and Experiments are STAC `Feature`s (`Item`s), they render `Item.vue`! We can inject a **"Run Workflow in EarthCODE Workspace"** or **"Open Experiment Code (VCS)"** action block right at `view-item-primary-start`. |
| **Item View** (`Item.vue`) | `view-item-secondary-start` / `-end` | Right column (`part="details"`), above/below Description & Metadata | **New Possibility for OSC Workflows & Experiments:** Inject `FairAssessment` and `ForumTopics` into `view-item-secondary-end` so Workflows and Experiments also display related forum discussions and quality metrics! |
| **Search View** (`ApiSearch.vue`) | `view-search-*` (7 hooks) | Around search filters & results | Custom search tips or link to the advanced EOxItemFilter search page (`/search`). |

### 4.2 High-Value Content Block Opportunities for Upcoming OSC Issues

1. **OSC Issue #27 (Standalone "Publications" Block & Copyable Citation):**
   - Issue #27 requested:
     - Keep only the canonical DOI and citation text in the "Scientific Citation" metadata block (with a **Copy Citation** button).
     - Move `sci:publications` to its own dedicated content block equal to "Scientific Citation".
   - With `<stac-browser>`, we can add `sci:publications` to `ignoreMetadata` (hiding it from the `stac-fields` table) and render a dedicated `<OscPublications slot="view-catalog-meta-end">` content block right below `MetadataGroups`, complete with formatted citations, DOI badges, and copy buttons!
2. **OSC Issue #22 (Earth Science Data Collections Visualization):**
   - Issue #22 defines specialized "Data Collection" pages requiring custom summary blocks (geographic/temporal coverage, resolution, number of source datasets, data format) and custom action links ("Open getting-started notebook", "Explore in dashboard", "Visit the Science Cluster", "Discuss in EarthCODE Forum").
   - Using `<stac-browser>` slots (`root-before-content`, `view-catalog-meta-start`, `view-catalog-meta-end`), we can detect Data Collection entities from their STAC metadata and render dedicated Data Collection content blocks using the exact same slot mechanism as Products!
3. **Extending Custom Headers & Blocks to OSC Workflows, Experiments, and Projects:**
   - Currently, `OscProductHeader` only activates when `osc:type === 'product'`.
   - Because `OscProductHeader` is just a slotted component in `slot="root-before-content"` reading `@data`, it can easily be generalized into an `<OscEntityHeader>` that renders type-specific headers and badges for **Projects** (`osc:type === 'project'`), **Workflows** (`osc:type === 'workflow'`), and **Experiments** (`osc:type === 'experiment'`).

### 4.3 STAC Actions (`#734`) & RFC 6861 `edit-form` Links in the Web Component

- **Static Action Configs:** In upstream STAC Browser, `assetActions.config.js`, `stacActions.config.js`, and `linkActions.config.js` are still static build-time imports and are not yet exposed on `<stac-browser>.config`.
- **Native RFC 6861 `edit-form` Support in v6 (`src/store/manager.js`):**
  - STAC Browser v6 automatically checks `stac.links` for `rel: "edit-form"` (`type: "text/html"`) and renders a **"Manage -> Edit"** button in `page-header` (`StacSource.vue`).
  - By injecting `{ rel: 'edit-form', href: editorUrl, title: 'Suggest Changes (OSC Editor)', type: 'text/html' }` inside `preprocessSTAC`, every Catalog, Collection, and Item page in `<stac-browser>` automatically gets a native "Suggest Changes" action in the STAC Browser header even on non-Product pages!

### 4.4 Custom Pages (`#832` / `#1039`) vs. Host Website Routing

- Upstream PR `#1039` introduces `pages.config.js` and a runtime `config.pages` option (for Markdown pages under `/pages/<id>` and widget-based frontpages).
- For OSC, because our Landing Page (`index-static.html`), Metrics dashboard (`metrics.html`), Search page (`search.html` with `<eox-itemfilter>`), and FAIR page (`FairPage.vue`) are rich interactive pages wrapped by the ESA header/footer, **keeping those routes in the lightweight host website router is cleaner and simpler** than putting them inside STAC Browser's internal router.

---

## 5. Styling, Branding, and Typography Analysis

### 5.1 Colors & Layout Variables (Supported Out-of-the-Box)
`<stac-browser>` forwards all inline `--*` CSS custom properties from the `<stac-browser>` host element into its Shadow DOM mount point (`.stac-browser-root`). We can set all ESA brand colors directly on the element:

```html
<stac-browser
  style="
    --bs-primary: #003247;
    --bs-primary-rgb: 0, 50, 71;
    --sb-on-primary: #ffffff;
    --bs-secondary: #335E6F;
    --bs-secondary-rgb: 51, 94, 111;
    --sb-on-secondary: #ffffff;
    --bs-info: #3f5f7a;
    --bs-info-rgb: 63, 95, 122;
    --bs-link-color: #003247;
    --bs-link-color-rgb: 0, 50, 71;
    --sb-header: #f8f9fa;
    --sb-header-background: none;
    --sb-header-color: #212529;
    --sb-header-hover-color: #000000;
    --sb-header-text-shadow: none;
    --sb-header-margin: 140px;
  "
></stac-browser>
```

### 5.2 Important Finding: Heading Font Family (`NotesESAbold`)
In our fork's `src/theme/variables.scss`, we set:
- `$font-family-sans-serif: system-ui, -apple-system, ...` (for body text)
- `$headings-font-family: "NotesESAbold"` (for `h1..h6` headings)

When analyzing upstream's `src/theme/variables.scss` and `src/theme/runtime-helpers.scss` in `#778`:
- Upstream sets `$headings-font-family: $font-family-sans-serif;` in `variables.scss`.
- Because `$headings-font-family` is non-null at Sass compile time, Bootstrap's `_reboot.scss` compiles a hardcoded `font-family: system-ui, -apple-system, ...` rule directly onto `h1, h2, h3, h4, h5, h6` inside `stac-browser.css`.
- Consequently, inside `<stac-browser>`'s Shadow DOM, `h1..h6` **do not inherit** the host page font and **do not respond** to `--bs-body-font-family`, nor is there a `--sb-headings-font-family` variable yet.
- **How to solve this:**
  1. **Immediate host-side fix (works today):** Since `el.shadowRoot` is open and `@font-face` declared in the host document is accessible inside Shadow DOM, append `h1, h2, h3, h4, h5, h6, .header-title span[role="banner"] { font-family: "NotesESAbold", sans-serif !important; }` to `el.shadowRoot`.
  2. **Upstream fix to suggest to `@m-mohr`:** Suggest adding `--sb-headings-font-family` in `runtime-helpers.scss` / `variables.scss` (defaulting to `var(--bs-body-font-family)`). This also fixes a bug in upstream's runtime styling where setting `--bs-body-font-family` fails to update `h1..h6` headings.

---

## 6. Blueprint: How the Lightweight OSC Website Will Look

By dropping the STAC Browser fork and adopting `@radiantearth/stac-browser` as an npm dependency, the entire OSC repository shrinks from ~150+ files of forked STAC Browser source code to a tiny, self-contained project:

```
open-science-catalog-website/
├── index.html                  # Single entry point
├── package.json                # Depends on @radiantearth/stac-browser, @eox/esa-ui, @eox/chart, @eox/itemfilter, vue, vue-router
├── vite.config.js              # Simple 15-line Vite config
├── public/                     # Static assets, fonts (NotesESAbold), metrics.html, search.html, index-static.html
└── src/
    ├── main.js                 # App entry & router (/, /metrics, /search, /fair, /fair-preview, /:pathMatch(.*)*)
    ├── App.vue                 # ESA Header, Navbar, Drawer, Cookie Banner, Footer, Suggest Changes dial
    ├── stac-config.js          # Runtime config, preprocessSTAC, ignoreMetadata, basemaps, and stac-fields Registry setup
    ├── views/
    │   ├── CatalogPage.vue     # Renders <stac-browser> with slotted OSC widgets
    │   ├── FairPage.vue
    │   ├── FairPreviewPage.vue # Renders <FairAssessment :stac="previewData" /> directly
    │   ├── LandingPage.vue
    │   ├── MetricsPage.vue
    │   ├── PrivacyNoticePage.vue
    │   └── SearchPage.vue
    └── widgets/                # Pure host components (no Vuex or STAC Browser internal imports!)
        ├── OscProductHeader.vue
        ├── OscDataAccess.vue
        ├── FairAssessment.vue
        └── ForumTopics.vue
```

### Example `CatalogPage.vue` with `<stac-browser>`:

```vue
<template>
  <div class="catalog-container">
    <stac-browser
      ref="browser"
      :class="{ 'is-osc-product': isOscProduct }"
      style="
        --bs-primary: #003247;
        --bs-primary-rgb: 0, 50, 71;
        --bs-secondary: #335E6F;
        --bs-secondary-rgb: 51, 94, 111;
        --sb-header: #f8f9fa;
        --sb-header-background: none;
        --sb-header-color: #212529;
        --sb-header-text-shadow: none;
      "
      @navigate="onBrowserNavigate"
      @data="onBrowserData"
      @title="onBrowserTitle"
    >
      <OscProductHeader
        v-if="isOscProduct"
        slot="root-before-content"
        :stac="stacData"
        :stac-url="stacUrl"
        @navigate-stac="navigateToStac"
        @toggle-sidebar="toggleSidebar"
      />
      <OscDataAccess
        v-if="isOscProduct"
        slot="view-catalog-meta-end"
        class="osc-right-col"
        :stac="stacData"
        :stac-url="stacUrl"
        @navigate-stac="navigateToStac"
        @scroll-to-items="scrollToItems"
      />
      <FairAssessment
        v-if="hasFairData"
        slot="view-catalog-meta-end"
        class="osc-right-col"
        :stac="stacData"
      />
      <ForumTopics
        v-if="isCollection"
        slot="view-catalog-meta-end"
        class="osc-full-width"
        :stac="stacData"
      />
    </stac-browser>
  </div>
</template>
```

---

## 7. Recommended Feedback Reply for `EOEPCA/user-client#3`

Below is a draft response you can post directly in [`EOEPCA/user-client#3`](https://github.com/EOEPCA/user-client/issues/3) (and/or [`radiantearth/stac-browser#778`](https://github.com/radiantearth/stac-browser/pull/778)) to reply to `@m-mohr`:

---

> Hi @m-mohr,
>
> Thank you very much for investigating and implementing all of those points! I did an in-depth analysis of the latest state of `#778` (`use-as-component` branch) against all of our Open Science Catalogue (OSC) customizations—including our new redesigned Product pages (`OscProductHeader`, `OscDataAccess`, `FairAssessment`, `ForumTopics`, custom DOI/citation handling, and 2-column grid layout).
>
> The combination of native `<slot>`s for widget hooks (`e41c3216a`), exporting the `stac-fields` `Registry` (`638bc8544`), moving `ignoreMetadata` to `config` (`e7acab2e5`), `showSidebar` (`1445b6781`), and exposing CSS `::part()` / `:state()` (`ebc8cc094`) covers almost everything we need to migrate away from our `<iframe>` + fork setup to a lightweight standalone website using the `<stac-browser>` web component.
>
> While mapping our Product page layout and styling to the web component, I found **3 small edge cases** where a minor adjustment in `#778` would avoid needing `shadowRoot` workarounds on the host side:
>
> ### 1. CSS Grid inside `::part(details)` (Exposing `part`s on child sections in `Catalog.vue` / `Item.vue`)
> On our Product pages, we display `::part(items)` full-width at the bottom (`flex: 0 0 100%`) and turn `::part(details)` (`.col.meta`) into a **2-column CSS Grid**:
> - **Left column (`grid-column: 1`):** Native STAC Browser sections (`intro`, map/thumbnails preview, `assets`, `providers`, `metadata`, `links`)
> - **Right column (`grid-column: 2`):** Slotted widgets (`OscDataAccess` and `FairAssessment` in `slot="view-catalog-meta-end"`)
> - **Full width (`grid-column: 1 / -1`):** Slotted `ForumTopics` widget
>
> Because `<slot>` has `display: contents`, our slotted elements become direct grid items of `::part(details)` and can be placed in `grid-column: 2` from the host CSS. **However**, because CSS `::part()` does not allow child combinators (`::part(details) > section` is invalid CSS), the host stylesheet cannot set `grid-column: 1` on the native `<section>` elements inside `.col.meta`, causing CSS Grid auto-placement to alternate them across columns 1 and 2 (e.g. `intro` in col 1, map preview in col 2, `metadata` in col 1, `links` in col 2).
>
> **Suggestion:** Could you either:
> - Expose `part` attributes on the child blocks inside `Catalog.vue` and `Item.vue` (e.g. `part="intro"`, `part="preview"`, `part="assets"`, `part="providers"`, `part="metadata"`, `part="links"`), **and/or**
> - Add `.meta > :not(slot) { grid-column: 1; }` in `Catalog.vue` (which is a no-op in the default layout, but keeps native sections in column 1 when a host applies `display: grid` to `::part(details)`)?
>
> Exposing `part` on those inner blocks (`intro`, `preview`, `assets`, `providers`, `metadata`, `links`) would also allow host pages to hide or reorder individual content blocks via CSS `order` or `display: none`.
>
> ### 2. Heading Font Family CSS Variable (`--sb-headings-font-family`)
> In `src/theme/variables.scss`, `$headings-font-family` is set to `$font-family-sans-serif` (rather than `null`). Because of this, Bootstrap compiles a hardcoded `font-family: system-ui, ...` onto `h1, h2, h3, h4, h5, h6` in `stac-browser.css`.
> As a result:
> 1. In the web component's `inline` mode (or when setting `--bs-body-font-family`), `h1..h6` headings inside the shadow root do not inherit the host font or `--bs-body-font-family`.
> 2. In ESA/OSC, we use a custom brand font (`NotesESAbold`) specifically for headings (`h1..h6`) while keeping normal sans-serif for body text.
>
> **Suggestion:** Could you expose a `--sb-headings-font-family` CSS variable (defaulting to `var(--bs-body-font-family)`) and wire `h1..h6` (and `.header-title span[role="banner"]`) to it in `runtime-helpers.scss`?
>
> ### 3. Optional Nice-to-Haves for Completeness
> - **`relationTypes` in `config`:** Now that `ignoreMetadata` and `basemaps` are available on `el.config`, `relationTypes.config.js` (`stacNavigation` and `hidden`) is one of the last static config files not yet settable via `el.config` (though we can work around it via `preprocessSTAC`).
> - **`toggleSidebar()` method (or `sidebar` property):** When a host hides `::part(header)` on specific pages to render a custom slotted header (like our `OscProductHeader`), having a `el.toggleSidebar()` method on `<stac-browser>` would allow a custom "Browse" button in the host page to open STAC Browser's offcanvas sidebar cleanly without querying `el.shadowRoot`.
>
> Overall, `#778` is a huge milestone and works really well—thanks again for all your work on this!

---

## 8. Most Straightforward Path to a New Lightweight Repository

Because our current outer shell (`custom/frame-main.js`, `custom/StacBrowserWrapper.vue`, `custom/views/*.vue`) and our 4 custom widgets (`src/widgets/*.vue`) are **already written in Vue 3 + Bootstrap 5 (`bootstrap-vue-next`)**, we do not need to rewrite any UI from scratch.

Instead, we can extract **only** the outer shell (`custom/`), the static assets (`public/`), and the 4 widgets (`src/widgets/`) into a new, standalone Vite + Vue 3 repository and replace the `<iframe>` in `CatalogPage.vue` with `<stac-browser>`.

### Step 1: Create the New Repo from Only the Outer Shell Files
Copy only the OSC-specific files (leaving behind the ~150 upstream STAC Browser files):
- `index.html` (pointing to `src/main.js`, which is the current `custom/frame-main.js`)
- `public/` (`index-static.html`, `metrics.html`, `search.html`, `css/`, `img/`, `js/`)
- `scripts/download-cdns.js`
- `custom/` -> moved to `src/` (`StacBrowserWrapper.vue` and `views/`)
- `src/widgets/` (`OscProductHeader.vue`, `OscDataAccess.vue`, `FairAssessment.vue`, `ForumTopics.vue`)
- `config.js` and `fields.config.js` -> merged into a single `src/stac-config.js`

### Step 2: Include the `<stac-browser>` Web Component Bundle
1. **Before STAC Browser v6.0.0 is released on npm:**
   Build the web component once from upstream's `use-as-component` branch (`PR #778`):
   ```bash
   git clone --branch use-as-component https://github.com/radiantearth/stac-browser.git
   cd stac-browser && npm ci && npm run build:npm
   ```
   Copy the resulting `dist/` folder into `public/stac-browser/` in the new repo (or pack it with `npm pack ./dist` as a local `.tgz` dependency).
2. **Once STAC Browser v6.0.0 is released on npm:**
   Add `"@radiantearth/stac-browser": "^6.0.0"` to `package.json` and copy `node_modules/@radiantearth/stac-browser` into `public/stac-browser/` during build (e.g. via `vite-plugin-static-copy` or a `postinstall` script) so `stac-browser.js`, `stac-browser.css`, and its lazy-loaded route/locale chunks are served from `/stac-browser/`.

> **Why serve `stac-browser.js` from `/stac-browser/` instead of re-bundling it with Vite?**  
> Inside `stac-browser.js`, the web component injects its stylesheet into the Shadow DOM via `new URL('stac-browser.css', import.meta.url).href` and lazy-loads code-split chunks relative to `stac-browser.js`. Serving the pre-built folder under `/stac-browser/` and importing `/stac-browser/stac-browser.js` (with `/* @vite-ignore */`) keeps `import.meta.url` intact and makes the host Vite build finish in < 2 seconds.

### Step 3: Adapt the 4 Widgets from Vuex to Props (~30 minutes of work)
Because `<stac-browser>` slots live in the host Vue app's light DOM (which already loads Bootstrap 5 and `bootstrap-vue-next`), the 4 widgets (`OscProductHeader`, `OscDataAccess`, `FairAssessment`, `ForumTopics`) keep their exact templates and styles. Only their data inputs change:
1. Replace `...mapState(['data', 'url'])` with standard Vue `props: { stac: Object, stacUrl: String }`.
2. Replace STAC Browser's internal `<StacLink>` with a tiny `<OscStacLink>` component in the host repo that emits `@navigate-stac="url"` (which calls `browserEl.navigateToStac(url)`) and renders a clean `href` for middle-click/new-tab support.
3. In `OscProductHeader`, replace `<StacSource>` with a lightweight 20-line popover showing the STAC version, validation link, and raw JSON URL.

### Step 4: Replace the `<iframe>` in `CatalogPage.vue` with `<stac-browser>`
In `CatalogPage.vue`:
1. Dynamically import `/stac-browser/stac-browser.js` to get `{ Registry }` and register the `sci:doi` and `sci:publications` formatters.
2. Render `<stac-browser ref="browser">` and pass `config` (`catalogUrl`, `allowExternalAccess`, `cardViewMode`, `basemaps`, `ignoreMetadata`, `preprocessSTAC`).
3. Listen to:
   - `@navigate`: Sync `event.detail.path` (stripping `.json`) to the host Vue Router (`this.$router.replace(cleanPath)`).
   - `@data`: Store `event.detail.data` and `event.detail.url` in component state and pass them as `:stac` and `:stac-url` props to the 4 slotted widgets (`slot="root-before-content"` and `slot="view-catalog-meta-end"`).
4. Watch `$route.params.pathMatch` (for browser Back/Forward buttons) and call `this.$refs.browser.navigate(targetPath)`.

### Step 5: Configure Vite for Custom Elements
In the new repository's `vite.config.js`, tell Vue that `<stac-browser>` and `<eox-*>` are web components:
```js
vue({
  template: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'stac-browser' || tag.startsWith('eox-') || tag.startsWith('esa-')
    }
  }
})
```

