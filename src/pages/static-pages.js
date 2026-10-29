import CONFIG from "../merged-config.js";
import { escapeHtml } from "../utils/links.js";

function buildStaticParams(includeProductBase = false) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const params = new URLSearchParams({
    baseUrl: CONFIG.staticEndpoint || "",
    apiUrl: CONFIG.apiUrl || "",
    workspaceRoot: CONFIG.workspaceRoot || "",
    discourseRoot: CONFIG.discourseRoot || "",
    fontUrl: `${window.location.origin}${prefix}css/fonts/notesesabold/NotesESAbold.ttf`,
  });
  if (includeProductBase) {
    params.set("productBaseUrl", window.location.origin + prefix);
  }
  return params.toString();
}

export function renderLandingPage(container) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const src = `${prefix}index-static.html?${buildStaticParams(false)}`;
  container.innerHTML = `
    <div class="iframe-wrapper landing-iframe-wrapper">
      <iframe
        id="indexIframe"
        src="${escapeHtml(src)}"
        title="Open Science Catalogue"
        width="100%"
        height="100%"
        style="border: none; width: 100%; height: 100%; display: block;"
      ></iframe>
    </div>
  `;
}

export function renderMetricsPage(container) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const src = `${prefix}metrics.html?${buildStaticParams(false)}`;
  container.innerHTML = `
    <div class="iframe-wrapper shell-iframe-wrapper">
      <iframe
        id="metricsIframe"
        src="${escapeHtml(src)}"
        title="Metrics"
        width="100%"
        height="100%"
        style="border: none; width: 100%; height: 100%;"
      ></iframe>
    </div>
  `;
}

export function renderSearchPage(container) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const src = `${prefix}search.html?${buildStaticParams(true)}`;
  container.innerHTML = `
    <div class="iframe-wrapper shell-iframe-wrapper">
      <iframe
        id="searchIframe"
        src="${escapeHtml(src)}"
        title="Search"
        width="100%"
        height="100%"
        style="border: none; width: 100%; height: 100%;"
      ></iframe>
    </div>
  `;
}

function toAppPath(relativePath) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const clean = (relativePath || "").replace(/^\/+/, "");
  return prefix + clean;
}

export function renderAboutPage(container) {
  container.innerHTML = `
    <div class="about-page-container fair-page-container">
      <div class="about-content fair-content">
        <h1 class="about-title fair-title">About the Open Science Catalogue</h1>
        <h2 class="h4 mb-3 text-secondary">A FAIR-enhanced catalogue of Earth Observation and geoscience assets</h2>
        <p class="lead mb-4">
          A catalogue of geoscience products, datasets, software, workflows, and research resources from ESA and partner initiatives, FAIR-enhanced through EarthCODE services and openly shared in accordance with ESA Open Science principles.
        </p>
        <hr class="mb-5">

        <!-- What products can I find here? -->
        <section id="what-products" class="mb-5">
          <h2 class="h3 border-bottom pb-2 mb-3 text-primary">What products can I find here?</h2>
          <p class="section-lead-text mb-4">
            The majority of pages on opensciencedata.esa.int only hold metadata for each product and project. The actual data and its documentation are maintained and accessible at the data providers, outside of esa.int, for the majority of cases. Products vary in geographical and temporal extent, production methodology, validation and quality. Please refer to the documentation of each product for details. Explore the catalogue, consisting of:
          </p>

          <div class="about-elements-grid">
            <div class="about-element-card">
              <h3><i class="mdi mdi-satellite-variant text-primary"></i> EO Missions</h3>
              <p>Earth Observation Satellite Missions.</p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("eo-missions/catalog"))}" data-osc-link="${escapeHtml(toAppPath("eo-missions/catalog"))}" class="card-btn">
                  Explore Missions <i class="mdi mdi-arrow-right"></i>
                </a>
              </div>
            </div>

            <div class="about-element-card">
              <h3><i class="mdi mdi-database text-primary"></i> Data Collections</h3>
              <p>A growing collection of harmonised, analysis-ready data cubes bringing together innovative, experimental, and state-of-the-art Earth Observation products from projects within a common scientific theme.</p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("data-collections/catalog"))}" data-osc-link="${escapeHtml(toAppPath("data-collections/catalog"))}" class="card-btn">
                  Explore Collections <i class="mdi mdi-arrow-right"></i>
                </a>
              </div>
            </div>

            <div class="about-element-card">
              <h3><i class="mdi mdi-earth text-primary"></i> Themes</h3>
              <p>Browse the products by scientific domain: Atmosphere, Land, Ocean and more.</p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("themes/catalog"))}" data-osc-link="${escapeHtml(toAppPath("themes/catalog"))}" class="card-btn">
                  Explore Themes <i class="mdi mdi-arrow-right"></i>
                </a>
              </div>
            </div>

            <div class="about-element-card">
              <h3><i class="mdi mdi-chart-bell-curve text-primary"></i> Variables</h3>
              <p>Browse through a huge range of available geoscience, climate and environmental variables.</p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("variables/catalog"))}" data-osc-link="${escapeHtml(toAppPath("variables/catalog"))}" class="card-btn">
                  Explore Variables <i class="mdi mdi-arrow-right"></i>
                </a>
              </div>
            </div>

            <div class="about-element-card">
              <h3><i class="mdi mdi-folder-multiple text-primary"></i> Projects</h3>
              <p>Explore the list of ESA-funded research projects and their related outputs.</p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("projects/catalog"))}" data-osc-link="${escapeHtml(toAppPath("projects/catalog"))}" class="card-btn">
                  Explore Projects <i class="mdi mdi-arrow-right"></i>
                </a>
              </div>
            </div>

            <div class="about-element-card card-featured">
              <h3><i class="mdi mdi-sitemap text-primary"></i> Products / Experiments / Workflows</h3>
              <p>
                In EarthCODE, a published data Product is the result of a defined scientific process, which is captured as an Experiment. An Experiment record links a specific output product back to the exact Workflow used to create it, making the entire research process transparent and reproducible.
              </p>
              <p>
                A workflow defines the set of processing steps used in an experiment. It is not just source code—it is something that can be formally executed within a platform using a defined interface. Workflows may take different forms, including:
              </p>
              <ul class="workflow-types">
                <li><strong>openEO Process Graphs</strong></li>
                <li><strong>OGC API Processes</strong> (e.g. CWL, Application Package)</li>
                <li><strong>MLflow models</strong></li>
                <li><strong>Jupyter Notebooks</strong></li>
              </ul>
              <p>
                This ensures workflows can be cross-executable between platforms, promoting interoperability and reuse. The OSC provides the central interface to discover and access these interconnected components, enabling FAIR science.
              </p>
              <p class="mb-3">
                <i class="mdi mdi-book-open-page-variant text-primary"></i>
                <strong>Read more:</strong>
                <a href="https://esa-earthcode.github.io/documentation/Technical%20Documentation/Workflows%20and%20Experiments/working-with-workflows" target="_blank" rel="noopener">Working with Workflows and Experiments in EarthCODE</a>
              </p>
              <div class="card-actions">
                <a href="${escapeHtml(toAppPath("products/catalog"))}" data-osc-link="${escapeHtml(toAppPath("products/catalog"))}" class="card-btn">
                  Explore Products
                </a>
                <a href="${escapeHtml(toAppPath("experiments/catalog"))}" data-osc-link="${escapeHtml(toAppPath("experiments/catalog"))}" class="card-btn btn-outline">
                  Explore Experiments
                </a>
                <a href="${escapeHtml(toAppPath("workflows/catalog"))}" data-osc-link="${escapeHtml(toAppPath("workflows/catalog"))}" class="card-btn btn-outline">
                  Explore Workflows
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- FAIR Principles: From Principles to Practice -->
        <section id="fair-principles" class="mb-5">
          <h2 class="h3 border-bottom pb-2 mb-3 text-primary">FAIR Principles: From Principles to Practice</h2>
          
          <div class="about-callout mb-4">
            <h4 class="h5 mb-2 text-primary"><i class="mdi mdi-information text-primary"></i> FAIR in EarthCODE</h4>
            <p class="mb-2">
              In 2016, the <strong>FAIR Guiding Principles for scientific data management and stewardship</strong> were published in <em>Scientific Data</em> (Wilkinson et al., <a href="https://doi.org/10.1038/sdata.2016.18" target="_blank" rel="noopener">DOI: 10.1038/sdata.2016.18</a>). They provide a structured framework to ensure that both scientific data and processing workflows can be efficiently discovered, accessed, and reused across disciplines.
            </p>
            <p class="mb-0">
              In EarthCODE, turning FAIR principles into practice requires a complete FAIR and Open infrastructure that supports the entire research lifecycle—connecting Products, Workflows, and Experiments.
            </p>
          </div>

          <div class="about-callout about-callout-warning mb-4">
            <p class="mb-1"><strong><i class="mdi mdi-alert-circle text-warning"></i> FAIR is not binary: FAIR is a spectrum</strong></p>
            <p class="mb-0">Given the increasing volume and complexity of Earth Observation (EO) data, achieving FAIRness is a continuous process of metadata enrichment, standardisation, and capability enhancement.</p>
          </div>

          <div class="about-callout mb-4">
            <p class="mb-1"><strong><i class="mdi mdi-lock-open-outline text-primary"></i> FAIR Does Not Imply Open</strong></p>
            <p class="mb-0">FAIR does not mean data or software must be completely public or unrestricted—only that they are well-described, structured, and reusable under clearly defined, standardized conditions and licenses.</p>
          </div>

          <p class="mb-4">
            FAIR implementation in the Open Science Catalogue relies on three foundational pillars:
          </p>
          <ul class="mb-4">
            <li><strong>Metadata as the Foundation:</strong> Structured, standardized metadata based on the STAC (SpatioTemporal Asset Catalog) specification and the STAC OSC extension.</li>
            <li><strong>Technical Infrastructure:</strong> Persistent identifiers (DOIs), explicit metadata links, and global discovery indexed in searchable resources.</li>
            <li><strong>Community Agreements:</strong> Shared scientific conventions, such as CF Standard Names and GCMD Keywords, to ensure semantic interoperability across earth science domains.</li>
          </ul>

          <div id="findable" class="mb-4">
            <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
              <span class="badge bg-warning me-2 text-dark fair-pillar-badge">F</span> Findable
            </h3>
            <p>
              The first step in reusing data is to find them. Metadata and data should be easy to find for both humans and computers. Machine-readable metadata are essential for automatic discovery of datasets and services.
            </p>
            <ul>
              <li><strong>F1.</strong> (Meta)data are assigned a globally unique and persistent identifier (DOI).</li>
              <li><strong>F2.</strong> Data are described with rich metadata using the STAC OSC extension.</li>
              <li><strong>F3.</strong> Metadata clearly and explicitly include the identifier of the data they describe under access links.</li>
              <li><strong>F4.</strong> (Meta)data are registered or indexed in a searchable resource such as the Open Science Catalogue.</li>
            </ul>
          </div>

          <div id="accessible" class="mb-4">
            <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
              <span class="badge bg-primary me-2 fair-pillar-badge">A</span> Accessible
            </h3>
            <p>
              Once the user finds the required data, they need to know how these can be accessed, possibly including authentication and authorisation.
            </p>
            <ul>
              <li><strong>A1.</strong> (Meta)data are retrievable by their identifier using standardised communications protocols (HTTPS, STAC API, OGC CSW).</li>
              <li><strong>A1.1</strong> The protocol is free, open, and universally implementable.</li>
              <li><strong>A1.2</strong> The protocol allows for an authentication and authorisation procedure (e.g., OpenID Connect), where necessary.</li>
              <li><strong>A2.</strong> Metadata are accessible, even when the data are no longer available or hosted externally.</li>
            </ul>
          </div>

          <div id="interoperable" class="mb-4">
            <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
              <span class="badge bg-danger me-2 fair-pillar-badge">I</span> Interoperable
            </h3>
            <p>
              The data usually need to be integrated with other data. In addition, the data need to interoperate with applications or workflows for analysis, storage, and processing.
            </p>
            <ul>
              <li><strong>I1.</strong> (Meta)data use a formal, accessible, shared, and broadly applicable language for representation (JSON in STAC).</li>
              <li><strong>I2.</strong> (Meta)data use controlled FAIR vocabularies aligned with CF Standard Names and GCMD Keywords.</li>
              <li><strong>I3.</strong> (Meta)data include qualified references to related projects, experiments, workflows, and documentation.</li>
            </ul>
          </div>

          <div id="reusable" class="mb-4">
            <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
              <span class="badge bg-success me-2 fair-pillar-badge">R</span> Reusable
            </h3>
            <p>
              The ultimate goal of FAIR is to optimise the reuse of data. To achieve this, metadata and data should be well-described so that they can be replicated and/or combined in different settings.
            </p>
            <ul>
              <li><strong>R1.</strong> (Meta)data are richly described with domain-appropriate attributes (variables, themes, spatial/temporal extent).</li>
              <li><strong>R1.1.</strong> (Meta)data are released with a clear and accessible data usage license (such as Creative Commons).</li>
              <li><strong>R1.2.</strong> (Meta)data are associated with detailed provenance linking output products to experiments and workflows.</li>
              <li><strong>R1.3.</strong> (Meta)data meet domain-relevant community standards, preferring cloud-native formats (Zarr, COG, GeoParquet).</li>
            </ul>
          </div>
        </section>

        <!-- The FAIR Assessment Tool -->
        <section id="fair-tool" class="mb-5">
          <h2 class="h3 border-bottom pb-2 mb-3 text-primary">The FAIR Assessment Tool</h2>
          <p class="mb-3">
            To provide transparency and facilitate continuous improvement of scientific assets, the Open Science Catalogue integrates an automated FAIR assessment tool directly into every product collection view.
          </p>

          <h4 class="h5 mt-4 mb-2 text-primary">How it works</h4>
          <p>
            When a dataset or STAC Collection is registered, updated, or previewed, an automated validation and scoring pipeline inspects its metadata against over 20 concrete evaluation rules derived from the FAIR principles. These tests assess:
          </p>
          <ul>
            <li><strong>Findability:</strong> Persistent DOI registration, STAC OSC rich metadata extension compliance, explicit asset pointers, and catalog indexing.</li>
            <li><strong>Accessibility:</strong> Availability of standard HTTPS and STAC API endpoints, open protocol usage, and programmatic asset fetch accessibility.</li>
            <li><strong>Interoperability:</strong> Formal STAC representation, adherence to controlled scientific vocabularies (CF Conventions, GCMD), and bidirectional links to projects and workflows.</li>
            <li><strong>Reusability:</strong> Standardized licenses, reproducible execution workflows, documentation guides, access examples, and adoption of cloud-native formats (Cloud-Optimized GeoTIFF, Zarr, GeoParquet).</li>
          </ul>

          <h4 class="h5 mt-4 mb-2 text-primary">What it shows</h4>
          <p>
            The FAIR assessment component provides an intuitive, interactive visualization for researchers and data providers:
          </p>
          <ul>
            <li>
              <strong>Overall Score &amp; Level:</strong> A percentage rating classified into achievement tiers:
              <strong>Advanced</strong> (100%), <strong>Moderate</strong> (&ge; 70%), <strong>Initial</strong> (&ge; 30%), or <strong>Incomplete</strong> (&lt; 30%).
            </li>
            <li>
              <strong>Interactive Donut Chart:</strong> A visual breakdown showing proportional compliance across the Findable, Accessible, Interoperable, and Reusable pillars.
            </li>
            <li>
              <strong>Detailed Checklist:</strong> An expandable and collapsible breakdown of all individual metrics with pass/fail indicators, allowing users to inspect the exact requirements and criteria.
            </li>
          </ul>

          <h4 class="h5 mt-4 mb-2 text-primary">Software and Tools Used</h4>
          <p>
            The FAIR assessment suite is built using open-source, modular technologies:
          </p>
          <div class="software-badge-list">
            <span class="software-badge">&lt;osc-fair-assessment&gt;</span>
            <span class="software-badge">@eox/chart (Chart.js)</span>
            <span class="software-badge">open-science-catalog-validation</span>
            <span class="software-badge">stac-node-validator</span>
            <span class="software-badge">STAC Browser</span>
          </div>
          <ul>
            <li>
              <strong><code>&lt;osc-fair-assessment&gt;</code>:</strong> Reusable Web Component implemented for the Open Science Catalogue frontend, seamlessly slotted into product pages and available as a standalone preview tool.
            </li>
            <li>
              <strong><code>@eox/chart</code>:</strong> EOxElements web component wrapper around Chart.js, providing accessible and reactive donut chart rendering.
            </li>
            <li>
              <strong><code>open-science-catalog-validation</code>:</strong> Automated STAC validation engine developed for EarthCODE, leveraging <code>stac-node-validator</code> and JSON Schema validation against the STAC OSC extension.
            </li>
            <li>
              <strong><code>STAC Browser</code>:</strong> Embedded community Web Component enabling intuitive browsing of geospatial metadata collections and items.
            </li>
          </ul>

          <p class="mt-4">
            <i class="mdi mdi-open-in-new text-primary"></i>
            For more details and implementation guidelines, refer to the official
            <a href="https://esa-earthcode.github.io/documentation/Community%20and%20Best%20Practices/FAIR%20and%20Open%20Science%20Best%20Practices/#from-fair-principles-to-fair-in-practice" target="_blank" rel="noopener">
              EarthCODE Documentation: FAIR and Open Science Best Practices
            </a>.
          </p>
        </section>
      </div>
    </div>
  `;
}

export const renderFairPage = renderAboutPage;

export function renderFairPreviewPage(container) {
  const query = new URLSearchParams(window.location.search);
  const title = query.get("title") || "Product Title";

  const fairKeys = [
    "Findable_has_doi",
    "Findable_rich_metadata",
    "Findable_identifier",
    "Findable_stac_assets",
    "Findable_indexed",
    "Findable_indexed_approved_metadata",
    "Findable_indexed_approved_data",
    "Accessible_general",
    "Accessible_protocols",
    "Accessible_files",
    "Accessible_metadata",
    "Interoperable_uses_formal_language",
    "Interoperable_controlled_vocabularies",
    "Interoperable_related_links",
    "Interoperable_has_documentation",
    "Reusable_rich_descriptions",
    "Reusable_has_license",
    "Reusable_workflow_exists",
    "Reusable_cloud_assets_rate",
    "Reusable_has_visualisation",
    "Reusable_has_access_example",
  ];

  const fairData = {};
  let foundAny = false;

  for (const key of fairKeys) {
    const value = query.has(`fair:${key}`) ? query.get(`fair:${key}`) : query.get(key);
    if (value !== null && value !== undefined) {
      foundAny = true;
      const lowerVal = String(value).toLowerCase();
      if (lowerVal === "true" || lowerVal === "1") {
        fairData[`fair:${key}`] = true;
      } else if (lowerVal === "false" || lowerVal === "0") {
        fairData[`fair:${key}`] = false;
      } else {
        const num = parseFloat(value);
        fairData[`fair:${key}`] = !isNaN(num) ? num : value;
      }
    }
  }

  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-12 col-lg-10 fair-preview-content">
          <h1 class="mb-2 text-uppercase text-primary">${escapeHtml(title)}</h1>
          <h2 class="h5 mb-4 text-muted">FAIR Assessment Preview</h2>
          <hr class="mb-5">
          ${
            foundAny
              ? `<div class="assessment-container"><osc-fair-assessment></osc-fair-assessment></div>`
              : `<div class="text-center py-5"><p class="text-danger">No FAIR data provided. Please specify FAIR scores as URL query parameters.</p></div>`
          }
        </div>
      </div>
    </div>
  `;

  if (foundAny) {
    const fairEl = container.querySelector("osc-fair-assessment");
    if (fairEl) {
      fairEl.stac = {
        id: "preview-collection",
        type: "Collection",
        stac_version: "1.0.0",
        title,
        ...fairData,
      };
    }
  }
}

export function renderPrivacyNoticePage(container) {
  container.innerHTML = `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-10 col-lg-8 privacy-content">
          <h1 class="mb-4">PRIVACY NOTICE</h1>
          <h2 class="h4 mb-3">Open Science Data Catalogue</h2>
          <h3 class="h5 mb-5">https://opensciencedata.esa.int</h3>
          <hr class="mb-5">

          <div class="toc mb-5 p-4 bg-light rounded border">
            <h4 class="h5 mb-3">Table of Contents</h4>
            <ul class="list-unstyled mb-0">
              <li><a href="#introduction">Introduction</a></li>
              <li>
                <a href="#1-general-information">1. General Information</a>
                <ul class="ps-3 list-unstyled">
                  <li><a href="#11-whom-is-the-data-controller">- 1.1. Whom is the Data Controller?</a></li>
                  <li><a href="#12-what-are-the-contact-details-of-esa-data-protection-officer">- 1.2. What are the contact details of ESA Data Protection Officer?</a></li>
                  <li><a href="#13-what-type-of-personal-data-about-you-is-collected-and-further-processed">- 1.3. What type of personal data about you is collected and further processed?</a></li>
                  <li><a href="#14-how-is-your-personal-data-collected-or-processed">- 1.4. How is your personal data collected or processed?</a></li>
                  <li><a href="#15-why-is-your-personal-data-collected-and-processed">- 1.5. Why is your personal data collected and processed?</a></li>
                  <li><a href="#16-to-whom-might-we-disclose-your-personal-data">- 1.6. To whom might we disclose your personal data?</a></li>
                </ul>
              </li>
              <li><a href="#2-third-party-it-tools-including-social-media">2. Third Party IT Tools, Including Social Media</a></li>
              <li>
                <a href="#3-your-personal-data">3. Your Personal Data</a>
                <ul class="ps-3 list-unstyled">
                  <li><a href="#31-how-long-do-we-retain-your-personal-data-for">- 3.1. How long do we retain your personal data for?</a></li>
                  <li><a href="#32-how-can-you-erase-rectify-complete-or-amend-your-personal-data">- 3.2. How can you erase, rectify, complete or amend your personal data?</a></li>
                </ul>
              </li>
              <li><a href="#4-in-case-of-a-data-protection-incident">4. In Case of a Data Protection Incident</a></li>
              <li><a href="#5-your-consent">5. Your Consent</a></li>
            </ul>
          </div>

          <section id="introduction" class="mb-5">
            <h3 class="h4 border-bottom pb-2 mb-3">Introduction</h3>
            <p>The European Space Agency (herein the “Agency” or “ESA”) is an intergovernmental organisation established by its Convention opened for signature in Paris on 30 May 1795 having its headquarters located at 24 rue du Général Bertrand, CS 30798, 75345 Paris Cedex 07, France.</p>
            <p>Protection of Personal Data is of great importance for ESA, which strives to ensure a high level of protection as required by the ESA Framework on Personal Data Protection (herein the “ESA PDP Framework”) which applies in this field.</p>
            <p><a href="http://www.esa.int/About_Us/Law_at_ESA/Highlights_of_ESA_rules_and_regulations" target="_blank">http://www.esa.int/About_Us/Law_at_ESA/Highlights_of_ESA_rules_and_regulations</a></p>
          </section>

          <section id="1-general-information" class="mb-5">
            <h3 class="h4 border-bottom pb-2 mb-3">1. General Information</h3>
            <div id="11-whom-is-the-data-controller" class="mb-4">
              <h4 class="h5">1.1. Whom is the Data Controller?</h4>
              <p>Your personal data is collected and further processed as shown below upon the decision alone by ESA. Thus, the Data Controller is ESA.</p>
            </div>
            <div id="12-what-are-the-contact-details-of-esa-data-protection-officer" class="mb-4">
              <h4 class="h5">1.2. What are the contact details of ESA Data Protection Officer?</h4>
              <p>According to ESA PDP Framework, your first point of contact concerning personal data matters is the ESA Data Protection Officer (“DPO”), who may be contacted at <a href="mailto:DPO@esa.int">DPO@esa.int</a>.</p>
            </div>
          </section>

          <p class="text-muted text-center mt-5"><small>Refer to full ESA PDP Framework policy docs for additional guidelines.</small></p>
        </div>
      </div>
    </div>
  `;
}
