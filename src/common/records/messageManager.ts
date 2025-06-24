import { PathManager } from "./pathManager.js";

export class MessageManager {
  static async encode(msg, irLoader) {
    const texts = [],
          fields = [],
          parts = msg.split(/(\{\{.+?\}\})/);

    for(const index in parts) {
      const part = parts[index];

      if(index & 1) {
        const field = part.slice(2, -2).trim(),
              res = PathManager.parsePrefix(field);

        const irObject = await irLoader(res.blockIndex);

        const numericPath = PathManager.toNumericPath(irObject, res.pathString);

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
      const path = PathManager.fromNumericPath(irObject, numericPath);
      console.log(path);
    }
  }
}
