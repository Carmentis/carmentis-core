import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/server/sdk.js", // main entry point
        output: [
            {
                file: "dist/server/index.mjs", // ESM output file (ES Module)
                format: "esm",
                sourcemap: true, // generate source map files
            },
            {
                file: "dist/server/index.cjs", // CJS output file (CommonJS)
                format: "cjs",
                sourcemap: true, // generate source map files
            }
        ],
        plugins: [
            typescript({
                allowJs: true, // Autoriser les fichiers .js
                include: ["src/**/*.ts", "src/**/*.js"], // Inclure JS et TS,
                declaration: false,
            }),
            resolve(), // resolve 3rd-party module imports
            commonjs(), // converts CommonJS to ESM
            json() // supports JSON imports
        ],
        onLog(level, log, handler) {
          if(log.code == "MISSING_EXPORT") {
            handler("error", log); // turn missing exports into errors
          }
          else {
            handler(level, log); // use the default handler for anything else
          }
        }
    },
    // Build for TypeScript definitions
    {
        input: "dist/server/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/server/index.d.ts", format: "es" }],
        plugins: [dts()],
    }
];
