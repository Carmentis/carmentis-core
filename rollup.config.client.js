import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

export default [
    {
        input: "src/client/sdk.js", // main entry point
        output: [
            {
                file: "dist/client/index.mjs", // ESM output file (ES Module)
                format: "esm",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/client/index.cjs", // CJS output file (CommonJS)
                format: "cjs",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/client/index.js", // IIFE output file
                format: "iife",
                name: "Carmentis",
                sourcemap: false
            }
        ],
        plugins: [
            resolve(), // resolve 3rd-party module imports
            commonjs(), // converts CommonJS to ESM
            json() // supports JSON imports
        ]
    },
    // Build for TypeScript definitions
    {
        input: "types/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/client/index.d.ts", format: "es" }],
        plugins: [dts()]
    }
];
