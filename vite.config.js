import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { accessSync, existsSync, readFileSync } from "fs";
import { resolve, join, extname } from "node:path";
import { ViteEjsPlugin } from "vite-plugin-ejs";
import yargs from "yargs";

import { run as downloadCdns } from "./scripts/download-cdns.js";
import { run as buildStacBrowser } from "./scripts/build-stac-browser.js";

const configSchema = JSON.parse(
  readFileSync(new URL("./config.schema.json", import.meta.url), "utf-8")
);
const package_ = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

const optionsForType = (type) =>
  Object.entries(configSchema.properties)
    .filter(
      ([, schema]) => Array.isArray(schema.type) && schema.type.includes(type)
    )
    .map(([key]) => key);

const defaultConfigPath = fileURLToPath(new URL("./config.js", import.meta.url));

const parseArrayEnv = (value) => {
  const raw = Array.isArray(value) ? value.join(" ") : String(value);
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return trimmed
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

const parseEnvConfig = (rawEnv) => {
  const envArgs = Object.entries(rawEnv)
    .filter(([key]) => key.startsWith("SB_") && key !== "SB_CONFIG")
    .flatMap(([key, value]) => [`--${key.slice(3)}`, value]);

  const env = yargs(envArgs)
    .parserConfiguration({ "camel-case-expansion": false })
    .boolean(optionsForType("boolean"))
    .number(optionsForType("number").concat(optionsForType("integer")))
    .option(
      Object.fromEntries([
        ...optionsForType("array").map((k) => [k, { coerce: parseArrayEnv }]),
        ...optionsForType("object").map((k) => [k, { coerce: JSON.parse }]),
      ])
    ).argv;

  delete env._;
  delete env.$0;

  return env;
};

const resolveExternalConfigPath = (configFile) => {
  if (!configFile) {
    return defaultConfigPath;
  }
  const configPath = resolve(process.cwd(), configFile);
  try {
    accessSync(configPath);
  } catch {
    throw new Error(`The config file "${configFile}" could not be found.`);
  }
  return configPath;
};

export default defineConfig(async ({ mode }) => {
  // Ensure EOx web components and the <stac-browser> web component bundle are ready
  await downloadCdns();
  await buildStacBrowser();

  const rawEnv = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  };
  const env = parseEnvConfig(rawEnv);
  const externalConfigPath = resolveExternalConfigPath(rawEnv.SB_CONFIG);
  const defaultConfig = (await import(pathToFileURL(defaultConfigPath).href)).default ?? {};
  const externalConfig = (await import(pathToFileURL(externalConfigPath).href)).default ?? {};
  const config = Object.assign({}, defaultConfig, externalConfig, env);
  const dynamicConfig = ["true", "1", "yes"].includes(
    String(rawEnv.DYNAMIC_CONFIG || "").toLowerCase()
  );
  const configFromEnv = dynamicConfig
    ? Object.fromEntries(Object.entries(env).filter(([k]) => k !== "pathPrefix"))
    : env;

  return {
    base: dynamicConfig ? "./" : config.pathPrefix,
    build: {
      sourcemap: mode !== "minimal",
    },
    define: {
      APP_VERSION: JSON.stringify(package_.version),
      CONFIG_FROM_ENV: JSON.stringify(configFromEnv),
    },
    plugins: [
      {
        name: "serve-prebuilt-public-esm",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            let urlPath = (req.url || "").split("?")[0];
            const base = (config.pathPrefix || "/").replace(/\/$/, "");
            if (base && urlPath.startsWith(base)) {
              urlPath = urlPath.slice(base.length);
            }
            if (urlPath.startsWith("/stac-browser/") || urlPath.startsWith("/eox/")) {
              const filePath = join(process.cwd(), "public", urlPath);
              if (existsSync(filePath)) {
                const ext = extname(filePath);
                const mime =
                  ext === ".css"
                    ? "text/css; charset=utf-8"
                    : ext === ".json"
                      ? "application/json; charset=utf-8"
                      : "application/javascript; charset=utf-8";
                res.setHeader("Content-Type", mime);
                res.end(readFileSync(filePath));
                return;
              }
            }
            next();
          });
        },
      },
      ViteEjsPlugin(config),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@stac-browser-external-config": externalConfigPath,
      },
    },
    server: {
      port: 8080,
    },
  };
});
