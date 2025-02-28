import * as fieldSerializer from "../../common/serializers/field-serializer.js";
import { LIST } from "./data.js";
import { log, outcome } from "../logger.js";

const VERBOSE = false;

export async function run() {
  log("--- Testing field serializer ----");

  LIST.forEach(obj => {
    let success = true;

    obj.tests.forEach(([ def, value, isError, context ]) => {
      let error = true;

      try {
        let encoded = fieldSerializer.encodeSingle(def, value, context),
            decoded = fieldSerializer.decodeSingle(def, encoded, context);

        if(VERBOSE) {
          console.log([...encoded].map(v => v.toString(16).toUpperCase().padStart(2, "0")).join(" "));
        }

        error = JSON.stringify(decoded) != JSON.stringify(value);

        if(error) {
          console.log("inconsistent result for", JSON.stringify(value).slice(0, 40));
          console.log("Expected:", JSON.stringify(value));
          console.log("Got:", JSON.stringify(decoded));
        }
      }
      catch(e) {
        if(!isError) {
          console.log("unexpected error for", JSON.stringify(value).slice(0, 40), e);
        }
      }
      success &= error == isError;
    });
    outcome(obj.name, 12, success);
  });
}
