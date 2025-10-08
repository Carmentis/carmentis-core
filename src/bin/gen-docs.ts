#!/usr/bin/env ts-node

import { generateDocumentation } from 'tsdoc-markdown';

const utilsEntryFile = 'src/common/common.ts';

await generateDocumentation({
    inputFiles: [utilsEntryFile],
    outputFile: './docs.md',
    buildOptions: {
        types: true,
        explore: true,
    }
});


console.log('✅ Documentation générée avec succès.');
