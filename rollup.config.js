import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import dts from "rollup-plugin-dts";

export default [
    {
        input: 'src/sdk.js', // Point d'entrée principal
        output: [
            {
                file: 'dist/index.mjs', // Fichier de sortie ESM (Module ES)
                format: 'esm',
                sourcemap: true, // Génère des fichiers de source map
            },
            {
                file: 'dist/index.cjs', // Fichier de sortie CJS (CommonJS)
                format: 'cjs',
                sourcemap: true, // Génère des fichiers de source map
            }
        ],
        plugins: [
            resolve(), // Résout les imports de modules tiers
            commonjs(), // Convertit CommonJS en ESM
            json(), // Supporte les importations JSON
        ]
    },
    // Build for TypeScript definitions
    {
        input: "types/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
];