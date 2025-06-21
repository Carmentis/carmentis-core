import { createDefaultPreset } from "ts-jest";
import resolve from "@rollup/plugin-node-resolve";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  rootDir: '.',
  testMatch: ['<rootDir>/dist/**/*.spec.js'],
  /*
  transform: {
    ...tsJestTransformCfg,

    '^\.src\/.+\\.(ts|tsx|js)$': [
        'ts-jest', { isolatedModules: true, useESM: true,  tsconfig: '<rootDir>/tsconfig.json' }
    ],


  },

   */
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  setupFilesAfterEnv: [
      //'./src/common/dev-node/dev-node.js'
  ],
  transformIgnorePatterns: []




  //transformIgnorePatterns: [`<rootDir>/node_modules/(?!@noble)/`, `<rootDir>/node_modules/@noble/post-quantum/`, `<rootDir>/node_modules/@noble/secp256k1/`],
};