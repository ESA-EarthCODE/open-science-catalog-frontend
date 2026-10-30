import CONFIG from "../merged-config.js";
import { escapeHtml } from "../utils/links.js";

const FAIR_DESCRIPTIONS = {
  // --- FINDABLE ---
  "fair:Findable_has_doi": "F1 — The dataset has an associated globally unique, persistent DOI.",
  "fair:Findable_rich_metadata": "F2 — The metadata is richly described using the OSC extension.",
  "fair:Findable_identifier":
    "F3 — The metadata clearly and explicitly include the identifier of the data it describes",
  "fair:Findable_stac_assets":
    "F3.1 — The metadata has per-file STAC items or assets that explicitly include the identifier of the data it describes.",
  "fair:Findable_indexed":
    "F4 — The (meta)data are registered or indexed in a searchable resource.",
  "fair:Findable_indexed_approved_metadata":
    "F4.1 — The metadata are registered or indexed in an approved domain.",
  "fair:Findable_indexed_approved_data":
    "F4.2 — The data are registered or indexed in an approved domain.",

  // --- ACCESSIBLE ---
  "fair:Accessible_general":
    "A1 —  Metadata are accessible over HTTPS via STAC API, OGC CSW (20.2/3.0.0), OpenSearch, OAI-PMH, or SRU.",
  "fair:Accessible_protocols": "A1.1 — Protocols are open, free, and universally implementable.",
  "fair:Accessible_files":
    "A1.2 — The percentage of randomly chosen assets that were successfully opened programatically.",
  "fair:Accessible_metadata":
    "A2 — Metadata are accessible, even when the data are no longer available",

  // --- INTEROPERABLE ---
  "fair:Interoperable_uses_formal_language":
    "I1 — The metadata uses formal, accessible representation languages (e.g., JSON in STAC).",
  "fair:Interoperable_controlled_vocabularies":
    "I2 — The dataset adopts controlled FAIR vocabularies aligned with CF Standard Names and GCMD Keywords via the STAC OSC extension.",
  "fair:Interoperable_related_links":
    "I3 — The dataset has qualified links to related projects, experiments, themes, and variables.",
  "fair:Interoperable_has_documentation":
    "I3.1 — The dataset has additional information such as guides, research papers and others.",

  // --- REUSABLE ---
  "fair:Reusable_rich_descriptions":
    "R1 — The dataset provides rich, domain-appropriate descriptions about variables, themes, and spatial/temporal extent.",
  "fair:Reusable_has_license": "R1.1 — The products are published with clear, standardized licenses.",
  "fair:Reusable_workflow_exists":
    "R1.2 — The dataset has an associated workflow to record processing provenance.",
  "fair:Reusable_cloud_assets_rate":
    "R1.3 — The percentage of assets that align with community standards by being in cloud-native formats (e.g., Zarr, COG, GeoParquet).",
  "fair:Reusable_has_visualisation":
    "R1.4 — The dataset has an associated visualisation dashboard, notebooks or tools.",
  "fair:Reusable_has_access_example":
    "R1.5 — The dataset has an associated access example script or notebook.",
};

function prettify(str) {
  if (!str) return "";
  return str
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export class OscFairAssessment extends HTMLElement {
  constructor() {
    super();
    this._stac = null;
    this._chartSpec = null;
    this._chartData = null;
    this._metricsList = [];
    this._expandedGroups = new Set();

    this.addEventListener("click", (e) => {
      const header = e.target.closest("[data-category-key]");
      if (header) {
        const key = header.getAttribute("data-category-key");
        if (this._expandedGroups.has(key)) {
          this._expandedGroups.delete(key);
        } else {
          this._expandedGroups.add(key);
        }
        this._renderTable();
      }
    });
  }

  set stac(collection) {
    this._stac = collection;
    this._expandedGroups.clear();
    if (!this._hasFairAssessment(collection)) {
      this._chartSpec = null;
      this._chartData = null;
      this._metricsList = [];
      this.innerHTML = "";
      return;
    }
    this._computeChart(collection);
    this.render();
  }

  get stac() {
    return this._stac;
  }

  _hasFairAssessment(data) {
    if (!data || data.type !== "Collection") return false;
    return (
      (data.access && typeof data.access === "object" && !Array.isArray(data.access)) ||
      Object.keys(data).some((key) => key.startsWith("fair:"))
    );
  }

  _getFairLevel(percent) {
    if (percent === 100) return "Advanced";
    if (percent >= 70) return "Moderate";
    if (percent >= 30) return "Initial";
    return "Incomplete";
  }

  _categoryColor(groupKey) {
    const groupLower = groupKey.toLowerCase();
    if (groupLower.includes("findable")) return "#f58518";
    if (groupLower.includes("accessible")) return "#4c78a8";
    if (groupLower.includes("interoperable")) return "#e15759";
    return "#76b7b2";
  }

  _badgeStyleCss(level) {
    const base =
      "padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; color: #ffffff;";
    if (level === "Advanced") return `${base} background-color: #145c32;`;
    if (level === "Moderate") return `${base} background-color: #0b4f6c;`;
    if (level === "Initial") return `${base} background-color: #b25e00;`;
    return `${base} background-color: #a8201a;`;
  }

  _computeChart(collection) {
    const chartData = [];
    let totalMetrics = 0;
    let trueMetrics = 0;

    if (
      collection.access &&
      typeof collection.access === "object" &&
      !Array.isArray(collection.access)
    ) {
      for (const groupName in collection.access) {
        const groupData = collection.access[groupName];
        const groupLabel = prettify(groupName.split(":").pop());

        for (const metricName in groupData) {
          const metricData = groupData[metricName];
          const value = metricData.value;
          const score = (typeof value === "number" ? value >= 0.5 : value) ? 1 : 0;
          let metricLabel = prettify(metricName);
          let description = metricData.description || "";
          if (description && description.includes(" — ")) {
            metricLabel = description.split(" — ")[0].trim();
            description = description.split(" — ").slice(1).join(" — ").trim();
          }

          let groupOrder = 4;
          let normalizedGroup = "Reusable";
          const groupLower = groupName.toLowerCase();
          if (groupLower.includes("findable")) {
            groupOrder = 1;
            normalizedGroup = "Findable";
          } else if (groupLower.includes("accessible")) {
            groupOrder = 2;
            normalizedGroup = "Accessible";
          } else if (groupLower.includes("interoperable")) {
            groupOrder = 3;
            normalizedGroup = "Interoperable";
          }

          const isPassed = typeof value === "boolean" ? value : score === 1;
          chartData.push({
            group: normalizedGroup,
            groupLabel,
            groupOrder,
            metric: metricName,
            metricLabel,
            value,
            passed: isPassed ? "true" : "false",
            score,
            description,
          });

          totalMetrics++;
          trueMetrics += score;
        }
      }
    } else {
      for (const key in FAIR_DESCRIPTIONS) {
        if (typeof collection[key] === "undefined") {
          continue;
        }

        const value = collection[key];
        const metricName = key.replace("fair:", "");
        const groupName = metricName.split("_")[0];

        const groupLabel = prettify(groupName);
        let metricLabel = prettify(metricName.replace(groupName + "_", ""));
        let description = FAIR_DESCRIPTIONS[key];
        if (description && description.includes(" — ")) {
          metricLabel = description.split(" — ")[0].trim();
          description = description.split(" — ").slice(1).join(" — ").trim();
        }

        let groupOrder = 4;
        let normalizedGroup = "Reusable";
        const groupLower = groupName.toLowerCase();
        if (groupLower.includes("findable")) {
          groupOrder = 1;
          normalizedGroup = "Findable";
        } else if (groupLower.includes("accessible")) {
          groupOrder = 2;
          normalizedGroup = "Accessible";
        } else if (groupLower.includes("interoperable")) {
          groupOrder = 3;
          normalizedGroup = "Interoperable";
        }

        let score = 0;
        if (typeof value === "boolean") {
          score = value ? 1 : 0;
        } else if (typeof value === "number") {
          score = value >= 0.5 ? 1 : 0;
        }

        const isPassed = typeof value === "boolean" ? value : score === 1;
        chartData.push({
          group: normalizedGroup,
          groupLabel,
          groupOrder,
          metric: key,
          metricLabel,
          value,
          passed: isPassed ? "true" : "false",
          score,
          description,
        });

        totalMetrics++;
        trueMetrics += score;
      }
    }

    if (chartData.length === 0) {
      this._chartSpec = null;
      this._chartData = null;
      this._metricsList = [];
      return;
    }

    const overallPercentage =
      totalMetrics > 0 ? Math.round((trueMetrics / totalMetrics) * 100) : 0;

    const scoreData = [{ percent: overallPercentage, label: `${overallPercentage}%` }];
    const categoryData = [];
    const seenGroups = new Set();
    chartData.forEach((item) => {
      if (!seenGroups.has(item.group)) {
        seenGroups.add(item.group);
        const count = chartData.filter((x) => x.group === item.group).length;
        categoryData.push({
          group: item.group,
          groupLabel: item.groupLabel,
          groupOrder: item.groupOrder,
          count,
        });
      }
    });

    this._chartSpec = {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      description: "FAIR Accessibility Donut Chart",
      background: "transparent",
      layer: [
        {
          data: { name: "myData" },
          mark: { type: "arc", outerRadius: 120, innerRadius: 60, stroke: "#fff" },
          encoding: {
            theta: { aggregate: "count", stack: true },
            color: {
              field: "group",
              type: "nominal",
              scale: {
                domain: ["Findable", "Accessible", "Interoperable", "Reusable"],
                range: ["#f58518", "#4c78a8", "#e15759", "#76b7b2"],
              },
              legend: null,
            },
            opacity: {
              field: "score",
              type: "quantitative",
              scale: { range: [0.4, 1.0] },
              legend: null,
            },
            order: { field: "groupOrder", type: "quantitative" },
            tooltip: [
              { field: "metricLabel", title: "Metric" },
              { field: "group", title: "Category" },
              { field: "passed", title: "Passed" },
              { field: "description", title: "Description" },
            ],
          },
        },
        {
          data: { name: "myData" },
          mark: { type: "text", radius: 90, fill: "#fff", fontSize: 9, fontWeight: "bold" },
          encoding: {
            theta: { field: "metric", aggregate: "count", stack: true },
            text: { field: "metricLabel", type: "nominal" },
            order: { field: "groupOrder", type: "quantitative" },
          },
        },
        {
          data: { name: "myData" },
          mark: { type: "arc", outerRadius: 145, innerRadius: 115, stroke: "#fff" },
          encoding: {
            theta: { field: "metric", aggregate: "count", stack: true },
            color: {
              field: "group",
              type: "nominal",
              scale: {
                domain: ["Findable", "Accessible", "Interoperable", "Reusable"],
                range: ["#f58518", "#4c78a8", "#e15759", "#76b7b2"],
              },
              title: "Access Category",
            },
            opacity: {
              field: "score",
              aggregate: "mean",
              type: "quantitative",
              scale: { range: [0.3, 1.0] },
              legend: null,
            },
            order: { field: "groupOrder", type: "quantitative" },
            tooltip: null,
          },
        },
        {
          data: { name: "categoryData" },
          mark: { type: "text", radius: 130, fill: "#ffffff", fontSize: 13, fontWeight: "bold" },
          encoding: {
            theta: { field: "count", type: "quantitative", stack: true },
            text: { field: "groupLabel", type: "nominal" },
            order: { field: "groupOrder", type: "quantitative" },
          },
        },
        {
          data: { name: "scoreData" },
          mark: { type: "text", fontSize: 34, fontWeight: "bold", color: "#111" },
          encoding: {
            text: { field: "label", type: "nominal" },
          },
        },
      ],
      view: { stroke: null },
    };

    this._chartData = {
      myData: chartData,
      scoreData,
      categoryData,
    };
    this._metricsList = chartData;
  }

  _getCategories() {
    if (!this._metricsList || this._metricsList.length === 0) return [];
    const groups = {};
    this._metricsList.forEach((item) => {
      const groupKey = item.group;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          name: item.groupLabel,
          key: groupKey,
          passed: 0,
          total: 0,
          metrics: [],
        };
      }
      groups[groupKey].total++;
      if (item.score === 1) {
        groups[groupKey].passed++;
      }
      groups[groupKey].metrics.push(item);
    });
    return Object.values(groups).map((g) => {
      const percentage = g.total > 0 ? Math.round((g.passed / g.total) * 100) : 0;
      return {
        ...g,
        percentage,
        level: this._getFairLevel(percentage),
      };
    });
  }

  _buildTableHtml() {
    const categories = this._getCategories();
    return categories
      .map((category) => {
        const isExpanded = this._expandedGroups.has(category.key);
        const color = this._categoryColor(category.key);
        const chevronSvg = isExpanded
          ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chevron"><polyline points="18 15 12 9 6 15" /></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="chevron"><polyline points="6 9 12 15 18 9" /></svg>`;

        const bodyHtml = isExpanded
          ? `
            <div class="card-body p-0 animate-fade">
              <div class="pb-2 mb-2 text-secondary category-summary">
                Passed ${category.passed} of ${category.total} FAIR checks.
              </div>
              ${category.metrics
                .map(
                  (metric) => `
                  <div class="py-2 px-0 d-flex align-items-start metric-row">
                    <div class="me-3 mt-1 d-flex align-items-center justify-content-center metric-icon-container">
                      ${
                        metric.score === 1
                          ? `<span class="text-success fw-bold fs-5" title="Passed">✓</span>`
                          : `<span class="text-danger fw-bold fs-5" title="Failed">✗</span>`
                      }
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-bold text-dark metric-label">${escapeHtml(
                        metric.metricLabel
                      )}</div>
                      <div class="text-secondary metric-description">${escapeHtml(
                        metric.description
                      )}</div>
                    </div>
                  </div>
                `
                )
                .join("")}
            </div>
          `
          : "";

        return `
          <div class="card mb-3 category-card" style="border-left-color: ${color};">
            <div
              class="card-header d-flex justify-content-between align-items-center cursor-pointer bg-white py-3"
              data-category-key="${escapeHtml(category.key)}"
            >
              <div class="d-flex align-items-center">
                <span class="fw-bold me-2 category-title" style="color: ${color};">
                  ${escapeHtml(category.name)}
                </span>
              </div>
              <div class="d-flex align-items-center gap-2 text-nowrap">
                <span class="fw-semibold text-secondary category-percentage">
                  ${category.percentage}%
                </span>
                <span style="${this._badgeStyleCss(category.level)}">
                  ${escapeHtml(category.level)}
                </span>
                <span class="text-muted d-flex align-items-center justify-content-center">
                  ${chevronSvg}
                </span>
              </div>
            </div>
            ${bodyHtml}
          </div>
        `;
      })
      .join("");
  }

  _renderTable() {
    const tableEl = this.querySelector(".fair-table");
    if (tableEl) {
      tableEl.innerHTML = this._buildTableHtml();
    }
  }

  render() {
    if (!this._chartSpec || !this._chartData) {
      this.innerHTML = "";
      return;
    }

    const aboutPageUrl = `${CONFIG.pathPrefix || "/"}about`;

    this.innerHTML = `
      <section class="fair-assessment mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h2 class="mb-0">FAIR Assessment</h2>
          <a
            href="${escapeHtml(aboutPageUrl)}#fair-tool"
            data-osc-link="/about#fair-tool"
            class="small text-secondary fw-semibold text-decoration-none d-inline-flex align-items-center gap-1"
            title="Learn how the FAIR score is calculated"
          >
            <span>How is this scored?</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/></svg>
          </a>
        </div>
        <div class="row align-items-start">
          <div class="col-lg-6 col-12 d-flex justify-content-center mb-4 mb-lg-0">
            <div class="chart-container">
              <eox-chart></eox-chart>
              <a
                href="${escapeHtml(aboutPageUrl)}"
                data-osc-link="/about"
                class="fair-info-btn"
                title="Learn more about FAIR principles"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="info-icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </a>
            </div>
          </div>
          <div class="col-lg-6 col-12">
            <div class="fair-table">
              ${this._buildTableHtml()}
            </div>
          </div>
        </div>
      </section>
    `;

    const chartEl = this.querySelector("eox-chart");
    if (chartEl) {
      chartEl.spec = this._chartSpec;
      chartEl.dataValues = this._chartData;
    }
  }
}

if (typeof customElements !== "undefined" && !customElements.get("osc-fair-assessment")) {
  customElements.define("osc-fair-assessment", OscFairAssessment);
}
