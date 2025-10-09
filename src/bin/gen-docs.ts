#!/usr/bin/env ts-node

import { generateDocumentation } from 'tsdoc-markdown';

const utilsEntryFile = 'src/common/common.ts';

generateDocumentation({
    inputFiles: [utilsEntryFile],
    outputFile: './docs.md',
    buildOptions: {
        types: true,
        explore: true,
    }
});


