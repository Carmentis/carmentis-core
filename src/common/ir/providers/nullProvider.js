import { Provider } from "./provider.js";

export class NullProvider extends Provider {
  constructor() {
    super();
  }

  getMicroblock(identifier) {
    return null;
  }

  setMicroblock(identifier, data) {
    // ignored
  }
}
