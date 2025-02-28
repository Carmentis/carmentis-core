import { SCHEMAS } from "../constants/constants.js";

const db = {
  [ SCHEMAS.DB_MICROBLOCK_INFO ]: new Map(),
  [ SCHEMAS.DB_MICROBLOCK_DATA ]: new Map(),
  [ SCHEMAS.DB_VB_INFO         ]: new Map()
};

export async function put(tableId, key, value) {
  db[tableId].set(key, value);
  return true;
}

export async function get(tableId, key) {
  return db[tableId].get(key);
}
