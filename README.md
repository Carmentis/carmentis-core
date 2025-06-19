# Carmentis SDK

Carmentis SDK is a JavaScript/TypeScript library for interacting with the Carmentis blockchain platform.

## Installation

```bash
npm install @cmts-dev/carmentis-sdk
```

## Building the Project

The project can be built using the following commands:

```bash
# Clean the build directories
npm run clean

# Build the client version
npm run build:client

# Build the server version
npm run build:server

# Build everything (TypeScript compilation + client + server)
npm run build
```

## Testing

The project uses Jest for testing. To run the tests:

```bash
# Run all tests
npx jest

# Run tests with coverage
npx jest --coverage

# Run specific test file
npx jest path/to/test-file.spec.ts
```

Tests are located in `.spec.ts` files throughout the source code.

## Documentation

To generate documentation using JSDoc:

```bash
npx jsdoc -r -c jsdoc.json -t ./node_modules/better-docs -d docs src
```

This command will:
- Recursively scan the `src` directory for JSDoc comments
- Use the configuration in `jsdoc.json`
- Apply the better-docs template
- Output the documentation to the `docs` directory

## Project Structure

- `src/`: Source code
  - `common/`: Common utilities and components
  - `specs/`: Test specifications
- `dist/`: Build output
- `database/`: Database-related files

## Usage

### Client-side Usage

```javascript
import { Blockchain } from '@cmts-dev/carmentis-sdk/client';

// Initialize the blockchain client
const blockchain = new Blockchain(provider);

// Use the SDK functionality
// ...
```

### Server-side Usage

```javascript
import { Blockchain } from '@cmts-dev/carmentis-sdk/server';

// Initialize the blockchain server
const blockchain = new Blockchain(provider);

// Use the SDK functionality
// ...
```

## License

See the LICENSE.txt file for details.
