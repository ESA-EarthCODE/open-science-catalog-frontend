import { test, expect } from "@playwright/test";

const CATALOG_BASE = "https://esa-earthcode.github.io/open-science-catalog-metadata-staging";

const mockRootCatalog = {
  type: "Catalog",
  stac_version: "1.0.0",
  id: "open-science-catalog",
  title: "Open Science Catalogue",
  description: "ESA Open Science Catalogue root metadata catalog.",
  links: [
    {
      rel: "root",
      href: `${CATALOG_BASE}/catalog.json`,
      type: "application/json",
    },
    {
      rel: "self",
      href: `${CATALOG_BASE}/catalog.json`,
      type: "application/json",
    },
    {
      rel: "child",
      href: `${CATALOG_BASE}/products/catalog.json`,
      type: "application/json",
      title: "Products",
    },
    {
      rel: "child",
      href: `${CATALOG_BASE}/projects/catalog.json`,
      type: "application/json",
      title: "Projects",
    },
  ],
};

const mockProductsCatalog = {
  type: "Catalog",
  stac_version: "1.0.0",
  id: "products",
  title: "Products",
  description: "Products catalog",
  links: [
    {
      rel: "root",
      href: `${CATALOG_BASE}/catalog.json`,
      type: "application/json",
    },
    {
      rel: "parent",
      href: `${CATALOG_BASE}/catalog.json`,
      type: "application/json",
    },
    {
      rel: "child",
      href: `${CATALOG_BASE}/products/test-ocean-product/collection.json`,
      type: "application/json",
      title: "Test Ocean Salinity Product",
    },
  ],
};

const mockExternalCollection = {
  type: "Collection",
  stac_version: "1.0.0",
  id: "4datlantic-ohc",
  title: "Ocean Heat Content Change",
  description: "External dataset for ocean heat content.",
  license: "CC-BY-4.0",
  extent: {
    spatial: { bbox: [[-180, -90, 180, 90]] },
    temporal: { interval: [["2020-01-01T00:00:00Z", "2024-12-31T23:59:59Z"]] },
  },
  links: [
    {
      rel: "root",
      href: "https://s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json",
      type: "application/json",
      title: "Ocean Heat Content Change",
    },
    {
      rel: "self",
      href: "https://s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json",
      type: "application/json",
    },
  ],
};

const mockProductCollection = {
  type: "Collection",
  stac_version: "1.0.0",
  id: "test-ocean-product",
  title: "Test Ocean Salinity Product",
  description: "High-resolution ocean salinity dataset for climate research.",
  license: "CC-BY-4.0",
  "osc:type": "product",
  "osc:project": "ocean-health",
  "osc:region": "Global",
  "osc:status": "completed",
  "sci:doi": "10.83395/test-canonical-doi",
  "fair:Findable_has_doi": true,
  "fair:Findable_rich_metadata": true,
  "fair:Accessible_general": true,
  "fair:Interoperable_uses_formal_language": true,
  "fair:Reusable_has_license": true,
  extent: {
    spatial: { bbox: [[-180, -90, 180, 90]] },
    temporal: { interval: [["2020-01-01T00:00:00Z", "2024-12-31T23:59:59Z"]] },
  },
  links: [
    {
      rel: "root",
      href: `${CATALOG_BASE}/catalog.json`,
      type: "application/json",
    },
    {
      rel: "self",
      href: `${CATALOG_BASE}/products/test-ocean-product/collection.json`,
      type: "application/json",
    },
    {
      rel: "parent",
      href: `${CATALOG_BASE}/products/catalog.json`,
      type: "application/json",
      title: "Products",
    },
    {
      rel: "related",
      href: `${CATALOG_BASE}/projects/ocean-health/collection.json`,
      type: "application/json",
      title: "Project: Ocean Health Initiative",
    },
    {
      rel: "related",
      href: `${CATALOG_BASE}/themes/oceans/catalog.json`,
      type: "application/json",
      title: "Theme: Oceans",
    },
    {
      rel: "related",
      href: `${CATALOG_BASE}/variables/sea-surface-salinity/catalog.json`,
      type: "application/json",
      title: "Variable: Sea Surface Salinity",
    },
    {
      rel: "related",
      href: `${CATALOG_BASE}/eo-missions/smos/catalog.json`,
      type: "application/json",
      title: "EO Mission: SMOS",
    },
    {
      rel: "has-version",
      href: `${CATALOG_BASE}/products/test-ocean-product/collection_v1.json`,
      type: "application/json",
      title: "Version 1.0",
    },
    {
      rel: "latest-version",
      href: `${CATALOG_BASE}/products/test-ocean-product/collection_v1.json`,
      type: "application/json",
      title: "Latest version",
    },
    {
      rel: "via",
      href: "https://zenodo.org/records/123456",
      title: "Access",
    },
    {
      rel: "via",
      href: "https://opensciencedata.esa.int/stac-browser/#/external/https://s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json",
      title: "Access",
    },
  ],
};

test.describe("Open Science Catalogue Frontend", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`${CATALOG_BASE}/catalog.json`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockRootCatalog),
      });
    });

    await page.route(`${CATALOG_BASE}/products/catalog.json`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProductsCatalog),
      });
    });

    await page.route(
      `${CATALOG_BASE}/products/test-ocean-product/collection.json`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockProductCollection),
        });
      }
    );

    await page.route(
      "https://s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "access-control-allow-origin": "*",
          },
          body: JSON.stringify(mockExternalCollection),
        });
      }
    );

    await page.route("https://discourse-earthcode.eox.at/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ topics: [], posts: [] }),
      });
    });
  });

  test("renders the ESA shell and landing page at /", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("esa-header")).toBeAttached();
    await expect(page.locator("esa-navbar")).toBeAttached();
    await expect(page.locator("#indexIframe")).toBeVisible();

    const iframe = page.frameLocator("#indexIframe");
    await expect(
      iframe.getByRole("heading", { name: "Welcome to the Open Science Catalogue" })
    ).toBeVisible();
    await expect(
      iframe.getByText("A catalogue of geoscience products, datasets, software, workflows")
    ).toBeVisible();
    await expect(
      iframe.locator(".hero-buttons a.btn-cta.primary")
    ).toBeVisible();
    await expect(
      iframe.locator(".hero-buttons a.btn-cta.secondary")
    ).toBeVisible();

    // Verify community contributions section changes
    await expect(
      iframe.getByRole("heading", {
        name: "The Open Science Catalogue grows through community contributions",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      iframe.locator("#workspace-btn")
    ).toHaveText("Workspace");
    await expect(
      iframe.locator("#forum-btn")
    ).toHaveText("EarthCODE Forum");

    // Verify background image is set on the hero section
    const bgImage = await iframe.locator(".hero-section").evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(bgImage).toContain("earthcode-infographic-pillars-Nologo.jpg");
  });

  test("renders the About page at /about (and backwards-compatible /fair) and Privacy Notice at /privacy-notice", async ({
    page,
  }) => {
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { name: "About the Open Science Catalogue" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What products can I find here?" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The FAIR Assessment Tool" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Findable/i }).first()).toBeVisible();

    // Backwards-compatible /fair route
    await page.goto("/fair");
    await expect(
      page.getByRole("heading", { name: "About the Open Science Catalogue" })
    ).toBeVisible();

    await page.goto("/privacy-notice");
    await expect(page.locator(".esa-footer")).toBeVisible();
  });

  test("renders the standalone /fair-preview page and supports embed=true", async ({ page }) => {
    await page.goto(
      "/fair-preview?title=Preview%20Dataset&Findable_has_doi=true&Accessible_general=true&embed=true"
    );
    await expect(page.getByRole("heading", { name: "Preview Dataset" })).toBeVisible();
    await expect(page.locator(".fair-assessment")).toBeVisible();
    // In embed=true mode, ESA header and footer are hidden
    await expect(page.locator("#esa-header-wrapper")).toBeHidden();
    await expect(page.locator("#esa-footer")).toBeHidden();
  });

  test("embeds <stac-browser> web component at /catalog and renders root catalog", async ({
    page,
  }) => {
    await page.goto("/catalog");
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toBeAttached();
    await expect(browserEl.getByText("Products", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(browserEl.getByText("Projects", { exact: true })).toBeVisible();
  });

  test("renders custom Product header, Data Access, and FAIR Assessment via Web Component slots on product pages", async ({
    page,
  }) => {
    await page.goto("/products/test-ocean-product/collection");
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toHaveClass(/is-osc-product/, { timeout: 15000 });

    // 1. Slotted <osc-product-header> web component renders title, project, themes, variables, missions, and Canonical DOI
    const header = page.locator("osc-product-header .osc-product-header");
    await expect(header).toBeVisible();
    await expect(
      header.getByRole("heading", { name: "Test Ocean Salinity Product" })
    ).toBeVisible();
    await expect(header.getByText("Ocean Health Initiative")).toBeVisible();
    await expect(header.getByText("Oceans")).toBeVisible();
    await expect(header.getByText("Sea Surface Salinity")).toBeVisible();
    await expect(header.getByText("SMOS")).toBeVisible();
    await expect(header.locator(".doi-type-badge").getByText("Canonical DOI")).toBeVisible();
    await expect(header.getByText("10.83395/test-canonical-doi")).toBeVisible();

    // 2. Default STAC Browser internal header is hidden via ::part(header)
    const internalHeaderDisplay = await browserEl.evaluate((el) => {
      const h = el.shadowRoot?.querySelector('[part~="header"]');
      return h ? getComputedStyle(h).display : null;
    });
    expect(internalHeaderDisplay).toBe("none");

    // 3. Slotted <osc-data-access> web component renders external Zenodo access link
    const dataAccess = page.locator("osc-data-access .osc-data-access");
    await expect(dataAccess).toBeVisible();
    await expect(dataAccess.getByText("Access the Data")).toBeVisible();
    await expect(dataAccess.getByText("Access Zenodo Repository")).toBeVisible();

    // 4. Slotted <osc-fair-assessment> web component renders FAIR checklist
    const fairWidget = page.locator("osc-fair-assessment .fair-assessment");
    await expect(fairWidget).toBeVisible();
    await expect(fairWidget.getByText("FAIR Assessment")).toBeVisible();

    // 5. Canonical product collection suppresses false "Outdated" deprecation warning
    await expect(browserEl.locator(".deprecation")).toHaveCount(0);

    // 6. Verify 2-column desktop layout: native description on the left, Data Access on the right
    await page.setViewportSize({ width: 1280, height: 900 });
    const introBox = await browserEl.locator("section.intro").boundingBox();
    const dataAccessBox = await dataAccess.boundingBox();
    expect(introBox).not.toBeNull();
    expect(dataAccessBox).not.toBeNull();
    expect(dataAccessBox.x).toBeGreaterThan(introBox.x + 200);
  });

  test("supports embed=true on /catalog to hide ESA chrome and reset header margin", async ({
    page,
  }) => {
    await page.goto("/catalog?embed=true");
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toBeAttached();

    // In embed=true mode, ESA chrome is hidden
    await expect(page.locator("#esa-header-wrapper")).toBeHidden();
    await expect(page.locator("#esa-footer")).toBeHidden();
    await expect(page.locator("#suggest-changes-dial")).toBeHidden();

    // Verify --sb-header-margin is set to 0px for frameless embedding
    const headerMargin = await browserEl.evaluate((el) => {
      return el.style.getPropertyValue("--sb-header-margin");
    });
    expect(headerMargin).toBe("0px");
  });

  test("emits navigate and ready postMessage events to parent when embedded in an iframe", async ({
    page,
  }) => {
    // Navigate to root first so that iframe creation inherits the proper origin
    await page.goto("/");
    await page.evaluate(() => {
      window.receivedMessages = [];
      window.addEventListener("message", (event) => {
        if (event.data && (event.data.navigate || event.data.type === "ready")) {
          window.receivedMessages.push(event.data);
        }
      });
      const iframe = document.createElement("iframe");
      iframe.id = "test-frame";
      iframe.src = "/catalog?embed=true";
      document.body.appendChild(iframe);
    });

    // Wait until parent receives at least one navigate or ready message
    await page.waitForFunction(
      () => {
        return (
          window.receivedMessages &&
          window.receivedMessages.some((msg) => msg.navigate || msg.type === "ready")
        );
      },
      { timeout: 15000 }
    );

    const messages = await page.evaluate(() => window.receivedMessages);
    expect(messages.length).toBeGreaterThan(0);
    const hasNavigate = messages.some((m) => !!m.navigate);
    expect(hasNavigate).toBe(true);
  });

  test("renders on-the-fly STAC entity preview injected via window.postMessage", async ({
    page,
  }) => {
    await page.goto("/catalog?embed=true");
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toBeAttached();

    // Inject custom STAC data on-the-fly via window.postMessage
    const previewData = {
      type: "Collection",
      stac_version: "1.0.0",
      id: "preview-live-collection",
      title: "Live Editor Preview Dataset",
      description: "On-the-fly STAC entity preview injected from git-clerk.",
      license: "CC-BY-4.0",
      "osc:type": "product",
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [["2023-01-01T00:00:00Z", "2024-01-01T00:00:00Z"]] },
      },
      links: [],
    };

    await page.evaluate((data) => {
      window.postMessage({ data }, "*");
    }, previewData);

    // Verify STAC Browser renders the injected title and description
    await expect(page.getByRole("heading", { name: "Live Editor Preview Dataset" })).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText("On-the-fly STAC entity preview injected from git-clerk.")
    ).toBeVisible();
  });

  test("buffers and applies postMessage preview data when received while at root /", async ({
    page,
  }) => {
    // Navigate to root / (the landing page)
    await page.goto("/");
    await expect(page.locator(".landing-iframe-wrapper")).toBeAttached();

    const previewData = {
      type: "Collection",
      stac_version: "1.0.0",
      id: "buffered-preview-collection",
      title: "Buffered Preview Dataset from Root",
      description: "Injected while on landing page and auto-navigated to catalog.",
      license: "CC-BY-4.0",
      "osc:type": "product",
      extent: {
        spatial: { bbox: [[-180, -90, 180, 90]] },
        temporal: { interval: [["2023-01-01T00:00:00Z", "2024-01-01T00:00:00Z"]] },
      },
      links: [],
    };

    // Post data while on the landing page
    await page.evaluate((data) => {
      window.postMessage({ data }, "*");
    }, previewData);

    // Verify it automatically navigates to /catalog and renders the preview data
    await expect(
      page.getByRole("heading", { name: "Buffered Preview Dataset from Root" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("Injected while on landing page and auto-navigated to catalog.")
    ).toBeVisible();
  });

  test("updates document.title when navigating across routes and does not remain stuck", async ({
    page,
  }) => {
    // 1. Root landing page
    await page.goto("/");
    expect(await page.title()).toBe("Open Science Catalogue");

    // 2. Metrics page
    await page.goto("/metrics");
    expect(await page.title()).toBe("Metrics - Open Science Catalogue");

    // 3. Search page
    await page.goto("/search");
    expect(await page.title()).toBe("Search - Open Science Catalogue");

    // 4. About page
    await page.goto("/about");
    expect(await page.title()).toBe("About - Open Science Catalogue");

    // 5. Privacy Notice page
    await page.goto("/privacy-notice");
    expect(await page.title()).toBe("Privacy Notice - Open Science Catalogue");

    // 6. FAIR preview with custom title
    await page.goto("/fair-preview?title=Custom%20Dataset");
    expect(await page.title()).toBe("Custom Dataset - FAIR Assessment - Open Science Catalogue");

    // 7. Catalog page updates to STAC entity title
    await page.goto("/catalog");
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toBeAttached();
    await expect(page).toHaveTitle(/Open Science Catalog/);

    // 8. SPA navigation from catalog back to metrics resets title and is not stuck on catalog title
    await page.evaluate(() => {
      window.navigateTo("/metrics");
    });
    await expect(page).toHaveTitle("Metrics - Open Science Catalogue");

    // 9. SPA navigation to search
    await page.evaluate(() => {
      window.navigateTo("/search");
    });
    await expect(page).toHaveTitle("Search - Open Science Catalogue");

    // 10. SPA navigation back to root
    await page.evaluate(() => {
      window.navigateTo("/");
    });
    await expect(page).toHaveTitle("Open Science Catalogue");
  });

  test("properly registers history entries when browsing inside catalog and handles back/forward buttons", async ({
    page,
  }) => {
    // 1. Start on the landing page
    await page.goto("/");
    await expect(page.locator("#indexIframe")).toBeVisible();

    // 2. Navigate to /catalog
    await page.evaluate(() => window.navigateTo("/catalog"));
    await expect(page).toHaveURL(/\/catalog$/);
    const browserEl = page.locator("stac-browser");
    await expect(browserEl).toBeAttached();
    await expect(browserEl.getByText("Products", { exact: true })).toBeVisible({ timeout: 15000 });

    // 3. Click "Products" inside STAC Browser
    await browserEl.getByText("Products", { exact: true }).click();
    await expect(page).toHaveURL(/\/products\/catalog$/);
    await expect(
      browserEl.getByText("Test Ocean Salinity Product", { exact: true })
    ).toBeVisible({ timeout: 15000 });

    // 4. Click "Test Ocean Salinity Product" inside STAC Browser
    await browserEl.getByText("Test Ocean Salinity Product", { exact: true }).click();
    await expect(page).toHaveURL(/\/products\/test-ocean-product\/collection$/);
    await expect(
      page.locator("osc-product-header").getByRole("heading", { name: "Test Ocean Salinity Product" })
    ).toBeVisible({ timeout: 15000 });

    // 5. Click browser Back: must return to /products/catalog (NOT outside the catalog!)
    await page.goBack();
    await expect(page).toHaveURL(/\/products\/catalog$/);
    await expect(
      browserEl.getByText("Test Ocean Salinity Product", { exact: true })
    ).toBeVisible({ timeout: 15000 });

    // 6. Click browser Back again: must return to /catalog
    await page.goBack();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(browserEl.getByText("Products", { exact: true })).toBeVisible({ timeout: 15000 });

    // 7. Click browser Back again: must return to / (landing page)
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#indexIframe")).toBeVisible();

    // 8. Click browser Forward: should return to /catalog
    await page.goForward();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(browserEl.getByText("Products", { exact: true })).toBeVisible({ timeout: 15000 });

    // 9. Click browser Forward again: should return to /products/catalog
    await page.goForward();
    await expect(page).toHaveURL(/\/products\/catalog$/);
    await expect(
      browserEl.getByText("Test Ocean Salinity Product", { exact: true })
    ).toBeVisible({ timeout: 15000 });
  });

  test("properly displays external STAC data and opens external catalogue links on current domain", async ({
    page,
  }) => {
    // 1. Visit product page that contains an external STAC catalog access link
    await page.goto("/products/test-ocean-product/collection");
    const dataAccess = page.locator("osc-data-access .osc-data-access");
    await expect(dataAccess).toBeVisible({ timeout: 15000 });

    // 2. Verify external access link unwraps legacy opensciencedata stac-browser URL:
    // Subtitle displays real data host (s3.waw4-1.cloudferro.com/...) rather than opensciencedata.esa.int/stac-browser/
    await expect(
      dataAccess.getByText("s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json")
    ).toBeVisible();

    // 3. Find the "Browse Catalogue" button for this external catalog:
    // It must use an in-app link on the current domain/origin (not target="_blank" to opensciencedata.esa.int)
    const browseCatBtn = dataAccess.locator(
      'a[data-osc-link*="/external/s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection"]'
    );
    await expect(browseCatBtn).toBeVisible();
    await expect(browseCatBtn).toHaveText(/Browse Catalogue/);

    // 4. Click "Browse Catalogue": navigates on the current host to /external/...
    await browseCatBtn.click();
    await expect(page).toHaveURL(
      /\/external\/s3\.waw4-1\.cloudferro\.com\/EarthCODE\/Catalogs\/4datlantic-ohc\/collection(\?.*)?$/
    );

    // 5. STAC Browser renders the external collection data properly
    const browserEl = page.locator("stac-browser");
    await expect(
      browserEl.getByRole("heading", { name: "Ocean Heat Content Change" })
    ).toBeVisible({ timeout: 15000 });
    await expect(
      browserEl.getByText("External dataset for ocean heat content.")
    ).toBeVisible();

    // 6. Browser Back returns to the product page on the current domain
    await page.goBack();
    await expect(page).toHaveURL(/\/products\/test-ocean-product\/collection$/);
    await expect(dataAccess).toBeVisible({ timeout: 15000 });

    // 7. Direct visit with protocol prefix (/external/https://...) normalizes cleanly to /external/s3...
    await page.goto(
      "/external/https://s3.waw4-1.cloudferro.com/EarthCODE/Catalogs/4datlantic-ohc/collection.json"
    );
    await expect(page).toHaveURL(
      /\/external\/s3\.waw4-1\.cloudferro\.com\/EarthCODE\/Catalogs\/4datlantic-ohc\/collection$/
    );
    await expect(
      browserEl.getByRole("heading", { name: "Ocean Heat Content Change" })
    ).toBeVisible({ timeout: 15000 });
  });
});
