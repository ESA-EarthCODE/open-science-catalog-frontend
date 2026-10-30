import CONFIG from "./merged-config.js";
import { filterPublications } from "../config.js";

let initPromise = null;

/**
 * Loads the pre-built `<stac-browser>` web component module and registers
 * all Open Science Catalogue custom metadata fields and extensions on its
 * exported `@radiantearth/stac-fields` Registry instance.
 *
 * NOTE: Currently served from `/stac-browser/stac-browser.js` built from
 * upstream draft PR #778 (`use-as-component` branch). Once STAC Browser v6.0.0
 * is published on npm (`@radiantearth/stac-browser`), the same module interface
 * is used.
 */
export function ensureStacBrowserLoaded() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const prefix = (CONFIG.pathPrefix || "/").endsWith("/")
      ? CONFIG.pathPrefix || "/"
      : `${CONFIG.pathPrefix}/`;
    const moduleUrl = `${prefix}stac-browser/stac-browser.js`;

    const mod = await import(/* @vite-ignore */ moduleUrl);
    const Registry = mod.Registry;

    if (Registry) {
      Registry.addExtension("sci", "Scientific Citation");

      Registry.addMetadataField("sci:doi", {
        label: "DOI",
        formatter: (value, field, spec, context) => {
          if (!value) return "";
          const links = context?.["osc:links"] || context?.links || [];
          const isCanonical =
            links.some((l) => l.rel === "has-version") &&
            !links.some((l) => l.rel === "is-version-of");
          if (isCanonical) {
            spec.label = "Canonical DOI";
          } else if (context?.version) {
            const v = String(context.version).trim();
            const vFormatted = v.toLowerCase().startsWith("v") ? v : `v${v}`;
            spec.label = `DOI (${vFormatted})`;
          } else {
            spec.label = "DOI";
          }
          const cleanDoi = String(value).replace(/^https?:\/\/doi\.org\//i, "");
          return `<a href="https://doi.org/${cleanDoi}" target="_blank" rel="noopener noreferrer">${cleanDoi}</a>`;
        },
      });

      Registry.addMetadataField("sci:publications", {
        label: "Publications & Additional DOIs",
        formatter: (value, field, spec, context) => {
          const remaining = filterPublications(value, context?.["sci:doi"]);
          if (remaining.length === 0) return "";
          const items = remaining.map((item) => {
            if (typeof item === "string") {
              const clean = item.replace(/^https?:\/\/doi\.org\//i, "");
              return `<a href="https://doi.org/${clean}" target="_blank" rel="noopener noreferrer" class="text-secondary small">${clean}</a>`;
            }
            if (typeof item === "object" && item !== null) {
              const cleanDoi = item.doi
                ? String(item.doi).replace(/^https?:\/\/doi\.org\//i, "")
                : null;
              const doiLink = cleanDoi
                ? `<a href="https://doi.org/${cleanDoi}" target="_blank" rel="noopener noreferrer" class="text-secondary small">${cleanDoi}</a>`
                : "";
              if (item.citation && cleanDoi) {
                return `<span class="small">${item.citation} (${doiLink})</span>`;
              } else if (item.citation) {
                return `<span class="small">${item.citation}</span>`;
              } else if (cleanDoi) {
                return doiLink;
              }
            }
            return String(item);
          });
          return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
        },
      });

      Registry.addMetadataField("created", {
        label: "Release date",
        formatter: (value) => {
          if (!value) return "";
          const d = new Date(value);
          if (isNaN(d.getTime())) return String(value);
          const dateStr = d.toISOString().slice(0, 10);
          return `<span title="${escapeHtml(String(value))}">${dateStr}</span>`;
        },
      });

      Registry.addMetadataField("updated", {
        label: "Last updated on OSC",
        formatter: (value) => {
          if (!value) return "";
          const d = new Date(value);
          if (isNaN(d.getTime())) return String(value);
          const dateStr = d.toISOString().slice(0, 10);
          return `<span title="${escapeHtml(String(value))}">${dateStr}</span>`;
        },
      });

      if (Registry.fields?.links?.rel?.mapping) {
        Registry.fields.links.rel.mapping.vcs = "Version Control System";
      }

      // Override standard STAC field labels for OSC terminology
      if (Registry.fields?.metadata?.created) {
        Registry.fields.metadata.created.label = "Release date";
      }
      if (Registry.fields?.metadata?.start_datetime) {
        Registry.fields.metadata.start_datetime.label = "Start date";
      }
      if (Registry.fields?.metadata?.end_datetime) {
        Registry.fields.metadata.end_datetime.label = "End date";
      }
    }

    if (typeof customElements !== "undefined") {
      await customElements.whenDefined("stac-browser");
    }

    return mod;
  })();

  return initPromise;
}
