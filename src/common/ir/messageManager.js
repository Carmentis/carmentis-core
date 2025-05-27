import { pathManager } from "./pathManager.js";

export class messageManager {
  static async encode(msg, irLoader) {
    const texts = [],
          fields = [],
          parts = msg.split(/(\{\{.+?\}\})/);

    for(const index in parts) {
      const part = parts[index];

      if(index & 1) {
        const field = part.slice(2, -2).trim(),
              res = pathManager.parsePrefix(field);

        const irObject = await irLoader(res.blockIndex);

        const numericPath = pathManager.toNumericPath(irObject, res.pathString);

        fields.push(numericPath);
      }
      else {
        texts.push(part);
      }
    }

    while(texts[texts.length - 1] == "") {
      texts.pop();
    }

    return {
      texts: texts,
      fields: fields
    };
  }

  static async decode(msg, irLoader) {
    for(const numericPath of msg.fields) {
      const irObject = await irLoader(0);
      const path = pathManager.fromNumericPath(irObject, numericPath);
      console.log(path);
    }
  }
}
