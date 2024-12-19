import * as schemaSerializer from "../../serializers/schema-serializer.js";
import * as DATA from "./data.js";
import { SCHEMAS } from "../../constants/constants.js";
import { log, outcome } from "../logger.js";

const VERBOSE = false;

export async function run() {
  log("---- Testing schema serializer ----");

  const list = [
    {
      title: "Array of integers / empty",
      schema: DATA.SCHEMA_ARRAY_INTEGERS,
      object: {
        array: []
      },
      isError: false
    },
    {
      title: "Array of integers / small",
      schema: DATA.SCHEMA_ARRAY_INTEGERS,
      object: {
        array: [ -123, 0, 456, 99999 ]
      },
      isError: false
    },
    {
      title: "Array of integers / large",
      schema: DATA.SCHEMA_ARRAY_INTEGERS,
      object: {
        array: [...Array(25000).keys()]
      },
      isError: false
    },
    {
      title: "Array of objects",
      schema: DATA.SCHEMA_ARRAY_OBJECTS,
      object: {
        array: [
          { foo: "hello", bar: 123 },
          { foo: "world", bar: 456 }
        ]
      },
      isError: false
    },
    {
      title: "Optional fields / all fields missing",
      schema: DATA.SCHEMA_OPTIONAL_FIELDS,
      object: {
        g03: {},
        g47: {},
        g89: {}
      },
      isError: false
    },
    {
      title: "Optional fields / no field missing",
      schema: DATA.SCHEMA_OPTIONAL_FIELDS,
      object: {
        g03: { v0: 0, v1: 1, v2: 2, v3: 3 },
        g47: { v4: 4, v5: 5, v6: 6, v7: 7 },
        g89: { v8: 8, v9: 9 }
      },
      isError: false
    },
    {
      title: "Optional fields / some fields missing",
      schema: DATA.SCHEMA_OPTIONAL_FIELDS,
      object: {
        g03: { v0: 0, v1: 1, v3: 3 },
        g47: { v6: 6, v7: 7 },
        g89: {}
      },
      isError: false
    },
    {
      title: "Microblock header with valid data",
      schema: SCHEMAS.MICROBLOCK_HEADER,
      object: DATA.MICROBLOCK_HEADER,
      isError: false
    },
    {
      title: "Microblock header with invalid data",
      schema: SCHEMAS.MICROBLOCK_HEADER,
      object: DATA.INVALID_MICROBLOCK_HEADER,
      isError: true
    },
    {
      title: "Full microblock",
      schema: SCHEMAS.MICROBLOCK,
      object: {
        header: DATA.MICROBLOCK_HEADER,
        body: DATA.MICROBLOCK_BODY,
      },
      isError: false
    },
    {
      title: "Application definition",
      schema: SCHEMAS.APPLICATION_DEFINITION,
      object: DATA.APPLICATION_DEFINITION,
      isError: false
    },
    {
      title: "Application record",
      schema: DATA.APPLICATION_DEFINITION.fields,
      object: DATA.APPLICATION_RECORD,
      context: {
        structures: DATA.APPLICATION_DEFINITION.structures,
        enumerations: DATA.APPLICATION_DEFINITION.enumerations
      },
      isError: false
    },
    {
      title: "Oracle definition",
      schema: SCHEMAS.ORACLE_DEFINITION,
      object: DATA.ORACLE_DEFINITION,
      isError: false
    }
  ];

  list.forEach((test, n) => {
    let error = true,
        size = "n/a";

    try {
      let encoded = schemaSerializer.encode(test.schema, test.object, test.context),
          decoded = schemaSerializer.decode(test.schema, encoded, test.context);

      if(VERBOSE) {
        console.log([...encoded].slice(0, 16).map(v => v.toString(16).padStart(2, "0").toUpperCase()).join(" ") + (encoded.length > 16 ? " (...)" : ""));
      }

      size = encoded.length;
      error = JSON.stringify(decoded) != JSON.stringify(test.object);

      if(error) {
        console.log("inconsistent result for", JSON.stringify(test.object).slice(0, 32));
        console.log(encoded);
        console.log(JSON.stringify(test.object));
        console.log(JSON.stringify(decoded));
      }
    }
    catch(e) {
      if(!test.isError) {
        console.log("unexpected error:", e);
      }
    }

    let success = error == test.isError;

    outcome(test.title, 50, success, `size: ${size}`);
  });
}
