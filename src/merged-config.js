import defaultConfig from "../config.js";
import externalConfig from "@stac-browser-external-config";

const envConfig = typeof CONFIG_FROM_ENV === "object" && CONFIG_FROM_ENV ? CONFIG_FROM_ENV : {};
const runtimeConfig =
  typeof window !== "undefined" &&
  typeof window.STAC_BROWSER_CONFIG === "object" &&
  window.STAC_BROWSER_CONFIG
    ? window.STAC_BROWSER_CONFIG
    : {};

const merged = Object.assign({}, defaultConfig, externalConfig, envConfig, runtimeConfig);

export default merged;
