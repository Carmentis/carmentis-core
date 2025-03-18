import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/application/sdk.js", // main entry point
        output: [
            {
                file: "dist/application/index.mjs", // ESM output file (ES Module)
                format: "esm",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/application/index.cjs", // CJS output file (CommonJS)
                format: "cjs",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/application/index.js", // IIFE output file
                format: "iife",
                name: "Carmentis",
                sourcemap: false
            }
        ],
        plugins: [
            typescript({
                compilerOptions: {
                    target: 'es6',
                },
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
        input: "dist/application/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/application/index.d.ts", format: "es" }],
        plugins: [dts()]
    }
];
