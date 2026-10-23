import CONFIG from "../merged-config.js";
import { escapeHtml } from "../utils/links.js";

function buildStaticParams(includeProductBase = false) {
  const prefix = (CONFIG.pathPrefix || "/").replace(/\/?$/, "/");
  const params = new URLSearchParams({
    baseUrl: CONFIG.staticEndpoint || "",
    apiUrl: CONFIG.apiUrl || "",
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
        style="border: none; width: 100%; height: 100%;"
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

export function renderFairPage(container) {
  container.innerHTML = `
    <div class="fair-page-container">
      <div class="fair-content">
        <h1 class="fair-title">The FAIR Guiding Principles</h1>
        <h2 class="h4 mb-3 text-secondary">Findable, Accessible, Interoperable, and Reusable</h2>
        <h3 class="h5 mb-4 text-muted">A Framework for Open Science and Data Stewardship</h3>
        <hr class="mb-5">

        <section class="mb-5 lead-section">
          <p class="lead">
            In 2016, the <strong>FAIR Guiding Principles for scientific data management and stewardship</strong> were published in <em>Scientific Data</em>. These principles provide a guideline for those wishing to enhance the reusability of their data holdings.
          </p>
          <p>
            The principles put specific emphasis on enhancing the ability of machines to automatically find and use the data, in addition to supporting its reuse by individuals. Here is a placeholder overview of the four core pillars.
          </p>
        </section>

        <section id="findable" class="mb-5">
          <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
            <span class="badge bg-warning me-2 text-dark fair-pillar-badge">F</span> Findable
          </h3>
          <p>
            The first step in reusing data is to find them. Metadata and data should be easy to find for both humans and computers. Machine-readable metadata are essential for automatic discovery of datasets and services.
          </p>
          <ul>
            <li><strong>F1.</strong> (Meta)data are assigned a globally unique and persistent identifier.</li>
            <li><strong>F2.</strong> Data are described with rich metadata.</li>
            <li><strong>F3.</strong> Metadata clearly and explicitly include the identifier of the data they describe.</li>
            <li><strong>F4.</strong> (Meta)data are registered or indexed in a searchable resource.</li>
          </ul>
        </section>

        <section id="accessible" class="mb-5">
          <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
            <span class="badge bg-primary me-2 fair-pillar-badge">A</span> Accessible
          </h3>
          <p>
            Once the user finds the required data, they need to know how these can be accessed, possibly including authentication and authorisation.
          </p>
          <ul>
            <li><strong>A1.</strong> (Meta)data are retrievable by their identifier using a standardised communications protocol.</li>
            <li><strong>A1.1</strong> The protocol is free, open, and universally implementable.</li>
            <li><strong>A1.2</strong> The protocol allows for an authentication and authorisation procedure, where necessary.</li>
            <li><strong>A2.</strong> Metadata are accessible, even when the data are no longer available.</li>
          </ul>
        </section>

        <section id="interoperable" class="mb-5">
          <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
            <span class="badge bg-danger me-2 fair-pillar-badge">I</span> Interoperable
          </h3>
          <p>
            The data usually need to be integrated with other data. In addition, the data need to interoperate with applications or workflows for analysis, storage, and processing.
          </p>
          <ul>
            <li><strong>I1.</strong> (Meta)data use a formal, accessible, shared, and broadly applicable language for representation.</li>
            <li><strong>I2.</strong> (Meta)data use vocabularies that follow FAIR principles.</li>
            <li><strong>I3.</strong> (Meta)data include qualified references to other (meta)data.</li>
          </ul>
        </section>

        <section id="reusable" class="mb-5">
          <h3 class="h4 border-bottom pb-2 mb-3 d-flex align-items-center">
            <span class="badge bg-success me-2 fair-pillar-badge">R</span> Reusable
          </h3>
          <p>
            The ultimate goal of FAIR is to optimise the reuse of data. To achieve this, metadata and data should be well-described so that they can be replicated and/or combined in different settings.
          </p>
          <ul>
            <li><strong>R1.</strong> (Meta)data are richly described with a plurality of accurate and relevant attributes.</li>
            <li><strong>R1.1.</strong> (Meta)data are released with a clear and accessible data usage license.</li>
            <li><strong>R1.2.</strong> (Meta)data are associated with detailed provenance.</li>
            <li><strong>R1.3.</strong> (Meta)data meet domain-relevant community standards.</li>
          </ul>
        </section>

        <p class="text-muted text-center mt-5">
          <small>
            For more details, visit the official
            <a href="https://www.go-fair.org/fair-principles/" target="_blank" rel="noopener">GO FAIR Initiative</a>.
          </small>
        </p>
      </div>
    </div>
  `;
}

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
