import { writeStream, readStream } from "./byteStreams.js";
import { pathManager } from "./pathManager.js";
import { maskManager } from "./maskManager.js";
import { jsonManager } from "./jsonManager.js";
import { pepperMerklizer, saltMerklizer } from "./merklizer.js";
import * as CST from "./constants.js";

export class intermediateRepresentation {
  constructor() {
    this.irObject = [];
    this.object = {
      info: {},
      recordData: this.irObject
    };
  }

  buildFromJson(input) {
    const output = [];

    processStructure(
      {
        root: input
      },
      output,
      false
    );

    this.irObject = output;

    function processNode(object, propertyName, container, insideArray) {
      const item = object[propertyName],
            type = jsonManager.getType(item);

      const outputNode = {
        type: type
      };

      if(insideArray) {
        outputNode.index = +propertyName;
      }
      else {
        outputNode.name = propertyName;
      }

      if(type == CST.T_OBJECT) {
        outputNode.properties = [];
        processStructure(item, outputNode.properties, false);
      }
      else if(type == CST.T_ARRAY) {
        outputNode.entries = [];
        processStructure(item, outputNode.entries, true);
      }
      else {
        outputNode.value = item;
        outputNode.attributes = 0;
        outputNode.channel = null;
      }

      container.push(outputNode);
    }

    function processStructure(object, output, insideArray) {
      for(const propertyName in object) {
        processNode(object, propertyName, output, insideArray);
      }
    }
  }

  exportToSectionFormat(channel) {
    const stream = new writeStream(),
          dictionary = this.buildDictionary(channel);

    stream.writeVarUint(dictionary.length);

    for(const name of dictionary) {
      stream.writeString(name);
    }

    this.traverseIrObject({
      channel: channel,
      onObject: (item, context, insideArray, parents) => {
        if(parents.length > 1) {
          writeIdentifier(item, insideArray);
        }
        stream.writeByte(item.type);
        stream.writeVarUint(countChildren(item.properties));
      },
      onArray: (item, context, insideArray, parents) => {
        if(parents.length > 1) {
          writeIdentifier(item, insideArray);
        }
        stream.writeByte(item.type);
        stream.writeVarUint(countChildren(item.entries));
      },
      onLeaf: (item, context, insideArray, parents) => {
        writeIdentifier(item, insideArray);
        stream.writeByte(item.type | item.attributes << 3);

        if(item.attributes == CST.MASKABLE) {
          stream.writeArray(item.visiblePartsBinary);
          stream.writeArray(item.hiddenPartsBinary);
        }
        else {
          stream.writeArray(item.valueBinary);
        }
      }
    });

    function writeIdentifier(item, insideArray) {
      stream.writeVarUint(
        insideArray ?
          item.index
        :
          dictionary.indexOf(item.name)
      );
    }

    function countChildren(list) {
      return list.reduce((cnt, item) =>
        cnt +=
          item.type == CST.T_ARRAY || item.type == CST.T_OBJECT ?
            item.channels.has(channel)
          :
            item.channel === channel,
        0
      );
    }

    return stream.getContent();
  }

  importFromSectionFormat(channel, content) {
    const stream = new readStream(content);

    const dictionarySize = stream.readVarUint(),
          dictionary = [];

    for(let n = 0; n < dictionarySize; n++) {
      dictionary.push(stream.readString());
    }

    readNode(this.irObject, false, true);

    function readNode(container, insideArray, isRoot = false) {
      const id = isRoot ? null : stream.readVarUint(),
            name = insideArray ? null : isRoot ? "root" : dictionary[id],
            param = stream.readByte(),
            type = param & 0x7,
            attributes = param >> 3;

      let newItem = true,
          item;

      if(type == CST.T_OBJECT || type == CST.T_ARRAY) {
        // if this item is an object or an array, it may have been already created while processing another channel,
        // in which case we must re-use the existing instance
        item = container.find(item => insideArray ? item.index == id : item.name == name);
        newItem = item === undefined;
      }

      if(newItem) {
        item = { type };

        if(insideArray) {
          item.index = id;
        }
        else {
          item.name = name;
        }
      }

      if(type == CST.T_OBJECT) {
        (item.channels = item.channels || new Set).add(channel);
        readObject(item);
      }
      else if(type == CST.T_ARRAY) {
        (item.channels = item.channels || new Set).add(channel);
        readArray(item, !newItem);
      }
      else {
        if(attributes == CST.MASKABLE) {
          let ptr;

          item.visibleParts = [];
          item.hiddenParts = [];

          ptr = stream.getPointer();

          for(let n = stream.readVarUint(); n--;) {
            item.visibleParts.push(stream.readString());
          }
          item.visiblePartsBinary = stream.extractFrom(ptr);
          ptr = stream.getPointer();

          for(let n = stream.readVarUint(); n--;) {
            item.hiddenParts.push(stream.readString());
          }
          item.hiddenPartsBinary = stream.extractFrom(ptr);

          item.value = maskManager.getFullText(item.visibleParts, item.hiddenParts);
        }
        else {
          item.value = stream.read(type);
          item.valueBinary = stream.getLastField();
        }
        item.attributes = attributes;
        item.channel = channel;
      }

      if(newItem) {
        container.push(item);
      }
    }

    function readObject(parent) {
      const nProperties = stream.readVarUint();

      parent.properties = parent.properties || [];

      for(let n = 0; n < nProperties; n++) {
        readNode(parent.properties, false);
      }
    }

    function readArray(parent, sortRequired) {
      const nEntries = stream.readVarUint();

      parent.entries = parent.entries || [];

      for(let n = 0; n < nEntries; n++) {
        readNode(parent.entries, true);
      }

      if(sortRequired) {
        parent.entries.sort((a, b) => a.index - b.index);
      }
    }
  }

  exportToProof(info) {
    const proofIr = new intermediateRepresentation,
          merkleData = [];

    for(const channel of this.channels) {
      const merklizer = this.merklize(channel),
            merkleObject = merklizer.generateTree(),
            knownPositions = new Set;

      console.log("export/merkleObject", merkleObject);

      this.traverseIrObject({
        channel: channel,
        onLeaf: (item, context, insideArray, parents) => {
          if(!(item.attributes & CST.REDACTED)) {
            knownPositions.add(item.leafIndex);

            const proofItem = proofIr.createBranch(parents);

            proofItem.attributes = item.attributes;
            proofItem.channel = item.channel;
            proofItem.leafIndex = item.leafIndex;

            if(item.attributes & CST.MASKABLE) {
              proofItem.visibleSalt = item.visibleSalt;
              proofItem.visibleParts = item.visibleParts;

              if(item.attributes & CST.MASKED) {
                proofItem.hiddenHash = item.hiddenHash;
              }
              else {
                proofItem.hiddenSalt = item.hiddenSalt;
                proofItem.hiddenParts = item.hiddenParts;
              }
            }
            else if(item.attributes & CST.HASHABLE) {
              proofItem.salt = item.salt;

              if(item.attributes & CST.HASHED) {
                proofItem.hash = item.hash;
              }
              else {
                proofItem.value = item.value;
              }
            }
            else {
              proofItem.salt = item.salt;
              proofItem.value = item.value;
            }
          }
        }
      });

      merkleData.push({
        channel: channel,
        nLeaves: merkleObject.nLeaves,
        witnesses: merklizer.getWitnesses(knownPositions)
      });
    }

    const infoObject = proofIr.object.info;

    infoObject.type = "proof";
    infoObject.microblock = info.microblock;
    infoObject.timestamp = (new Date).toJSON();
    infoObject.author = info.author;

    proofIr.object.merkleData = merkleData;

    return proofIr.object;
  }

  importFromProof(proof) {
    this.object = proof;
    this.irObject = proof.recordData;
    this.populateChannels();
    this.serializeFields();

    for(const channel of this.channels) {
      const merklizer = this.merklize(channel),
            merkleObject = merklizer.generateTree();

      console.log("import/merkleObject", merkleObject);
    }
  }

  createBranch(parents) {
    let container = this.irObject,
        insideArray = false;

    for(const currentItem of parents) {
      if(currentItem.type == CST.T_OBJECT || currentItem.type == CST.T_ARRAY) {
        let refItem = container.find(item => insideArray ? item.index == currentItem.index : item.name == currentItem.name);

        if(!refItem) {
          refItem = createNewItem(currentItem);

          if(currentItem.type == CST.T_OBJECT) {
            refItem.properties = [];
          }
          else {
            refItem.entries = [];
          }
          container.push(refItem);
        }
        container = refItem.type == CST.T_OBJECT ? refItem.properties : refItem.entries;
        insideArray = refItem.type == CST.T_ARRAY;
      }
      else {
        const refItem = createNewItem(currentItem);

        container.push(refItem);

        return refItem;
      }
    }

    function createNewItem(item) {
      const newItem = {
        type: item.type
      };

      if(insideArray) {
        newItem.index = item.index;
      }
      else {
        newItem.name = item.name;
      }
      return newItem;
    }
  }

  merklize(channel) {
    let merklizer;

    if(this.object.info.type == "proof") {
      const merkleData = this.object.merkleData.find(obj => obj.channel == channel);
      merklizer = new saltMerklizer(merkleData.nLeaves, merkleData.witnesses);
    }
    else {
      merklizer = new pepperMerklizer(this.object.info.pepper);
    }

    this.traverseIrObject({
      channel: channel,
      onLeaf: (item, context, insideArray, parents) => {
        merklizer.addItem(item, parents);
      }
    });

    return merklizer;
  }

  getIRObject() {
    return this.irObject;
  }

  dumpIRObject() {
    return jsonManager.stringifyIRObject(this.irObject);
  }

  setChannel(pathStringList, channelName) {
    this.processPath(
      pathStringList,
      item => {
        item.channel = channelName;
      }
    );
  }

  setAsMaskableByCallback(pathStringList, callback) {
    this.processPath(
      pathStringList,
      item => {
        const list = callback(item.value),
              obj = maskManager.applyMask(item.value, list);

        item.visibleParts = obj.visible;
        item.hiddenParts = obj.hidden;
        item.attributes = CST.MASKABLE;
      }
    );
  }

  setAsMaskableByRegex(pathStringList, regex, substitution) {
    this.processPath(
      pathStringList,
      item => {
        const list = maskManager.getListFromRegex(item.value, regex, substitution),
              obj = maskManager.applyMask(item.value, list);

        item.visibleParts = obj.visible;
        item.hiddenParts = obj.hidden;
        item.attributes = (item.attributes & ~CST.PROPERTIES) | CST.MASKABLE;
      }
    );
  }

  setAsHashable(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        item.attributes = (item.attributes & ~CST.PROPERTIES) | CST.HASHABLE;
      }
    );
  }

  setAsRedacted(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
//      if(item.attributes & CST.FORMAT) {
//        throw "the format of this item was already set";
//      }
        item.attributes = (item.attributes & ~CST.FORMAT) | CST.REDACTED;
      }
    );
  }

  setAsMasked(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        if(!(item.attributes & CST.MASKABLE)) {
          throw "this item is not maskable";
        }
        if(item.attributes & CST.FORMAT) {
          throw "the format of this item was already set";
        }
        item.attributes = (item.attributes & ~CST.FORMAT) | CST.MASKED;
      }
    );
  }

  setAsHashed(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        if(!(item.attributes & CST.HASHABLE)) {
          throw "this item is not hashable";
        }
        if(item.attributes & CST.FORMAT) {
          throw "the format of this item was already set";
        }
        item.attributes = (item.attributes & ~CST.FORMAT) | CST.HASHED;
      }
    );
  }

  processPath(pathStringList, callback) {
    const pathStrings = pathStringList.split(/, */);

    for(const pathString of pathStrings) {
      const res = pathManager.parsePrefix(pathString);

      if(res.prefix != "this") {
        throw `the path must start with 'this'`;
      }

      pathManager.processCallback(this.irObject, res.pathString, callback);
    }
  }

  populateChannels() {
    this.channels = new Set;

    this.traverseIrObject({
      onLeaf: (item, context, insideArray, parents) => {
        for(let i = 0; i < parents.length - 1; i++) {
          (parents[i].channels = parents[i].channels || new Set).add(item.channel);
          this.channels.add(item.channel);
        }
      }
    });
  }

  buildDictionary(channel) {
    const dictionary = new Map;

    // collect all names and count how many times they appear
    this.traverseIrObject({
      channel: channel,
      onObject: (item, context, insideArray, parents) => {
        if(parents.length > 1 && !insideArray) {
          processItem(item);
        }
      },
      onArray: (item, context, insideArray, parents) => {
        if(!insideArray) {
          processItem(item);
        }
      },
      onLeaf: (item, context, insideArray, parents) => {
        if(!insideArray) {
          processItem(item);
        }
      }
    });

    function processItem(item) {
      dictionary.set(item.name, dictionary.has(item.name) ? dictionary.get(item.name) + 1 : 1)
    }

    // turn that into a lookup sorted by use frequency in descending order
    const arr = [];

    for(const [ key, count ] of dictionary) {
      arr.push([ count, key ]);
    }

    const lookup = new Map([...arr.sort((a, b) => b[0] - a[0]).map((a, i) => [ a[1], i ])]);

    return [...lookup.keys()];
  }

  serializeFields() {
    this.traverseIrObject({
      onLeaf: (item, context, insideArray, parents) => {
        const stream = new writeStream();

        if(item.attributes & CST.MASKABLE) {
          stream.writeVarUint(item.visibleParts.length);

          for(const str of item.visibleParts) {
            stream.writeString(str);
          }
          item.visiblePartsBinary = stream.getContent();

          if(!(item.attributes & CST.MASKED)) {
            stream.clear();
            stream.writeVarUint(item.hiddenParts.length);

            for(const str of item.hiddenParts) {
              stream.writeString(str);
            }
            item.hiddenPartsBinary = stream.getContent();
          }
        }
        else if(!(item.attributes & CST.HASHED)) {
          stream.write(item.type, item.value);
          item.valueBinary = stream.getContent();
        }
      }
    });
  }

  // !! not used
  unserializeFields() {
    this.traverseIrObject({
      onLeaf: item => {
        const stream = new readStream(item.valueBinary);

        item.value = stream.read(item.type);
      }
    });
  }

  traverseIrObject(options) {
    processStructure(this.irObject, options.initialContext, false, []);

    function hasChannel(item, isLeaf) {
      return (
        options.channel === undefined || (
          isLeaf?
            item.channel === options.channel
          :
            item.channels.has(options.channel)
        )
      );
    }

    function processNode(item, context, insideArray, parents) {
      const newParents = [ ...parents, item ];

      if(item.type == CST.T_ARRAY) {
        if(hasChannel(item, false)) {
          const newContext = options.onArray && options.onArray(item, context, insideArray, newParents);

          processStructure(item.entries, newContext, true, newParents);
        }
      }
      else if(item.type == CST.T_OBJECT) {
        if(hasChannel(item, false)) {
          const newContext = options.onObject && options.onObject(item, context, insideArray, newParents);

          processStructure(item.properties, newContext, false, newParents);
        }
      }
      else {
        if(hasChannel(item, true)) {
          options.onLeaf && options.onLeaf(item, context, insideArray, newParents);
        }
      }
    }

    function processStructure(list, context, insideArray, parents) {
      for(const item of list) {
        processNode(item, context, insideArray, parents);
      }
    }
  }

  exportToJson() {
    const object = {};

    this.traverseIrObject({
      initialContext: object,
      onArray: (item, context) => {
        return context[item.name] = [];
      },
      onObject: (item, context) => {
        return context[item.name] = {};
      },
      onLeaf: (item, context, insideArray, parents) => {
        context[insideArray ? item.index : item.name] = item.value;
      }
    });

    return object.root;
  }
}
