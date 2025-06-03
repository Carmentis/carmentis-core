import { WriteStream, ReadStream } from "./byteStreams.js";
import { PathManager } from "./pathManager.js";
import { MaskManager } from "./maskManager.js";
import { TypeManager } from "./typeManager.js";
import { PepperMerklizer, SaltMerklizer } from "./merklizer.js";
import { DATA } from "./constants/constants.js";

const MAX_UINT8_ARRAY_DUMP_SIZE = 24;

export class IntermediateRepresentation {
  /**
    Constructor
  */
  constructor() {
    this.irObject = [];
    this.object = {
      info: {},
      recordData: this.irObject
    };
  }

  /**
    Initializes the IR object from a JSON-compatible object.
    @param {object} input
  */
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
            type = TypeManager.getType(item);

      if(!TypeManager.isJsonType(type)) {
        throw `Invalid JSON type`;
      }

      const outputNode = {
        type: type
      };

      if(insideArray) {
        outputNode.index = +propertyName;
      }
      else {
        outputNode.name = propertyName;
      }

      if(type == DATA.TYPE_OBJECT) {
        outputNode.properties = [];
        processStructure(item, outputNode.properties, false);
      }
      else if(type == DATA.TYPE_ARRAY) {
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

  /**
    Exports the IR object to the serialized section format used for on-chain storage.
  */
  exportToSectionFormat(channel, isPrivate) {
    const stream = new WriteStream();

    if(isPrivate) {
      const pepper = PepperMerklizer.generatePepper();

      stream.writeByteArray(pepper);
    }

    const dictionary = this.buildDictionary(channel);

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
      onPrimitive: (item, context, insideArray, parents) => {
        writeIdentifier(item, insideArray);
        stream.writeByte(item.type | item.attributes << 3);

        if(item.attributes == DATA.MASKABLE) {
          stream.writeByteArray(item.visiblePartsBinary);
          stream.writeByteArray(item.hiddenPartsBinary);
        }
        else {
          stream.writeByteArray(item.valueBinary);
        }
      }
    });

    return stream.getContent();

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
          item.type == DATA.TYPE_ARRAY || item.type == DATA.TYPE_OBJECT ?
            item.channels.has(channel)
          :
            item.channel === channel,
        0
      );
    }
  }

  /**
    Imports the IR object from the serialized section format.
  */
  importFromSectionFormat(channel, content) {
    const stream = new ReadStream(content);

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

      if(type == DATA.TYPE_OBJECT || type == DATA.TYPE_ARRAY) {
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

      if(type == DATA.TYPE_OBJECT) {
        (item.channels = item.channels || new Set).add(channel);
        readObject(item);
      }
      else if(type == DATA.TYPE_ARRAY) {
        (item.channels = item.channels || new Set).add(channel);
        readArray(item, !newItem);
      }
      else {
        if(attributes == DATA.MASKABLE) {
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

          item.value = MaskManager.getFullText(item.visibleParts, item.hiddenParts);
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

  /**
    Exports the IR object to a proof, as a JSON-compatible object.
    @param {object} info - An object containing meta-data about the proof.
  */
  exportToProof(info) {
    const proofIr = new IntermediateRepresentation,
          merkleData = [];

    for(const channel of this.channels) {
      const merklizer = this.merklize(channel),
            merkleObject = merklizer.generateTree(),
            knownPositions = new Set;

      this.traverseIrObject({
        channel: channel,
        onPrimitive: (item, context, insideArray, parents) => {
          if(!(item.attributes & DATA.REDACTED)) {
            knownPositions.add(item.leafIndex);

            const proofItem = proofIr.createBranch(parents);

            proofItem.attributes = item.attributes;
            proofItem.channel = item.channel;
            proofItem.leafIndex = item.leafIndex;

            if(item.attributes & DATA.MASKABLE) {
              proofItem.visibleSalt = item.visibleSalt;
              proofItem.visibleParts = item.visibleParts;

              if(item.attributes & DATA.MASKED) {
                proofItem.hiddenHash = item.hiddenHash;
              }
              else {
                proofItem.hiddenSalt = item.hiddenSalt;
                proofItem.hiddenParts = item.hiddenParts;
              }
            }
            else if(item.attributes & DATA.HASHABLE) {
              proofItem.salt = item.salt;

              if(item.attributes & DATA.HASHED) {
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

  /**
    Imports the IR object from a proof.
    @param {object} proof - The proof object generated by the exportToProof() method.
  */
  importFromProof(proof) {
    this.object = proof;
    this.irObject = proof.recordData;
    this.populateChannels();
    this.serializeFields();

    const merkleData = [];

    for(const channel of this.channels) {
      const merklizer = this.merklize(channel),
            merkleObject = merklizer.generateTree();

      merkleData.push({
        channel: channel,
        rootHash: merkleObject.rootHash
      });
    }
    return merkleData;
  }

  /**
    Internal method to create a branch in the object tree, including a primitive type and all its parents.
    Only a minimal set of properties is included for each node: 'type', 'name'/'index', 'properties'/'entries'.
    @param {array} itemList - An array containing the primitive item, preceded by all its parents.
  */
  createBranch(itemList) {
    let container = this.irObject,
        insideArray = false;

    for(const currentItem of itemList) {
      if(currentItem.type == DATA.TYPE_OBJECT || currentItem.type == DATA.TYPE_ARRAY) {
        let refItem = container.find(item => insideArray ? item.index == currentItem.index : item.name == currentItem.name);

        if(!refItem) {
          refItem = createNewItem(currentItem);

          if(currentItem.type == DATA.TYPE_OBJECT) {
            refItem.properties = [];
          }
          else {
            refItem.entries = [];
          }
          container.push(refItem);
        }
        insideArray = refItem.type == DATA.TYPE_ARRAY;
        container = insideArray ? refItem.entries : refItem.properties;
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

  /**
    Internal method to create a Merkle tree for a given channel, using either the channel pepper or the salts.
    @param {number} channel - The identifier of the channel.
  */
  merklize(channel) {
    let merklizer;

    if(this.object.info.type == "proof") {
      const merkleData = this.object.merkleData.find(obj => obj.channel == channel);
      merklizer = new SaltMerklizer(merkleData.nLeaves, merkleData.witnesses);
    }
    else {
      merklizer = new PepperMerklizer(this.object.info.pepper);
    }

    this.traverseIrObject({
      channel: channel,
      onPrimitive: (item, context, insideArray, parents) => {
        merklizer.addItem(item, parents);
      }
    });

    return merklizer;
  }

  /**
    Returns the IR object.
  */
  getIRObject() {
    return this.irObject;
  }

  /**
    Returns a formatted dump of the IR object, with uint8 arrays turned into truncated hexadecimal strings for readability.
  */
  dumpIRObject() {
    return JSON.stringify(
      this.irObject,
      (key, value) => {
        if(value instanceof Uint8Array) {
          return [
            `<${value.length} byte(s)>`,
            ...[ ...value.slice(0, MAX_UINT8_ARRAY_DUMP_SIZE) ].map(v =>
              v.toString(16).toUpperCase().padStart(2, "0")
            )
          ].join(" ") +
          (value.length > MAX_UINT8_ARRAY_DUMP_SIZE ? " .." : "");
        }
        if(value instanceof Set) {
          return [ ...value ];
        }
        return value;
      },
      2
    );
  }

  /**
    Associates a set of fields to a channel.
    @param {string} pathStringList - A string describing the set of fields.
    @param {number} channel - The channel identifier.
  */
  setChannel(pathStringList, channel) {
    this.processPath(
      pathStringList,
      item => {
        item.channel = channel;
      }
    );
  }

  /**
    Sets the 'maskable' attribute for a set of fields and define their visible and hidden parts using a callback function.
    The callback function will receive the field value and must return an object with 'visible' and 'hidden' properties,
    each consisting of a list of sub-strings.
    @param {string} pathStringList - A string describing the set of fields.
    @param {function} callback - The callback function.
  */
  setAsMaskableByCallback(pathStringList, callback) {
    this.processPath(
      pathStringList,
      item => {
        const list = callback(item.value),
              obj = MaskManager.applyMask(item.value, list);

        item.visibleParts = obj.visible;
        item.hiddenParts = obj.hidden;
        item.attributes = DATA.MASKABLE;
      }
    );
  }

  /**
    Sets the 'maskable' attribute for a set of fields and define their visible and hidden parts using a regular expression and a substitution string.
    @param {string} pathStringList - A string describing the set of fields.
    @param {RegExp} regex - A regular expression whose capturing groups must cover the entire field value, e.g. /^(.)(.*?)(@.)(.*?)(\..*)$/.
    @param {string} substitution - The substitution string, which should include references to capturing groups and placeholders for hidden parts, e.g. "$1***$3***$5".
  */
  setAsMaskableByRegex(pathStringList, regex, substitution) {
    this.processPath(
      pathStringList,
      item => {
        const list = MaskManager.getListFromRegex(item.value, regex, substitution),
              obj = MaskManager.applyMask(item.value, list);

        item.visibleParts = obj.visible;
        item.hiddenParts = obj.hidden;
        item.attributes = (item.attributes & ~DATA.PROPERTIES) | DATA.MASKABLE;
      }
    );
  }

  /**
    Sets the 'hashable' attribute for a set of fields.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsHashable(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        item.attributes = (item.attributes & ~DATA.PROPERTIES) | DATA.HASHABLE;
      }
    );
  }

  /**
    Marks a set of fields as 'redacted'.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsRedacted(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.REDACTED;
      }
    );
  }

  /**
    Marks a set of fields as 'masked'.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsMasked(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        if(!(item.attributes & DATA.MASKABLE)) {
          throw "this item is not maskable";
        }
        if(item.attributes & DATA.FORMAT) {
          throw "the format of this item was already set";
        }
        item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.MASKED;
      }
    );
  }

  /**
    Marks a set of fields as 'hashed'.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsHashed(pathStringList) {
    this.processPath(
      pathStringList,
      item => {
        if(!(item.attributes & DATA.HASHABLE)) {
          throw "this item is not hashable";
        }
        if(item.attributes & DATA.FORMAT) {
          throw "the format of this item was already set";
        }
        item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.HASHED;
      }
    );
  }

  /**
    Internal method to apply a callback function to each field included in a set of fields.
    @param {string} pathStringList - A string describing the set of fields.
    @param {function} callback - The callback function, which will receive the field item as argument.
  */
  processPath(pathStringList, callback) {
    const pathStrings = pathStringList.split(/, */);

    for(const pathString of pathStrings) {
      const res = PathManager.parsePrefix(pathString);

      if(res.prefix != "this") {
        throw `the path must start with 'this'`;
      }

      PathManager.processCallback(this.irObject, res.pathString, callback);
    }
  }

  /**
    Internal method to populate the channel identifiers from the primitive fields to their parents.
    Also loads the sorted list of all channels in the array this.channels.
  */
  populateChannels() {
    this.traverseIrObject({
      onPrimitive: (item, context, insideArray, parents) => {
        for(let i = 0; i < parents.length - 1; i++) {
          (parents[i].channels = parents[i].channels || new Set).add(item.channel);
        }
      }
    });

    this.channels = [...this.irObject[0].channels].sort((a, b) => a - b);
  }

  /**
    Internal method to build a dictionary of field names for a given channel.
    @param {number} channel - The channel identifier.
  */
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
      onPrimitive: (item, context, insideArray, parents) => {
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

  /**
    Internal method to serialize the primitive fields.
  */
  serializeFields() {
    this.traverseIrObject({
      onPrimitive: (item, context, insideArray, parents) => {
        const stream = new WriteStream();

        if(item.attributes & DATA.MASKABLE) {
          stream.writeVarUint(item.visibleParts.length);

          for(const str of item.visibleParts) {
            stream.writeString(str);
          }
          item.visiblePartsBinary = stream.getContent();

          if(!(item.attributes & DATA.MASKED)) {
            stream.clear();
            stream.writeVarUint(item.hiddenParts.length);

            for(const str of item.hiddenParts) {
              stream.writeString(str);
            }
            item.hiddenPartsBinary = stream.getContent();
          }
        }
        else if(!(item.attributes & DATA.HASHED)) {
          stream.write(item.type, item.value);
          item.valueBinary = stream.getContent();
        }
      }
    });
  }

  // !! not used
  unserializeFields() {
    this.traverseIrObject({
      onPrimitive: item => {
        const stream = new ReadStream(item.valueBinary);

        item.value = stream.read(item.type);
      }
    });
  }

  /**
    Internal method to traverse the IR object and calling optional callbacks on each node.
    @param {object} options - An object containing the traversal options.
  */
  traverseIrObject(options) {
    processStructure(this.irObject, options.initialContext, false, []);

    function hasChannel(item, isPrimitive) {
      return (
        options.channel === undefined || (
          isPrimitive?
            item.channel === options.channel
          :
            item.channels.has(options.channel)
        )
      );
    }

    function processNode(item, context, insideArray, parents) {
      const newParents = [ ...parents, item ];

      if(item.type == DATA.TYPE_ARRAY) {
        if(hasChannel(item, false)) {
          const newContext = options.onArray && options.onArray(item, context, insideArray, newParents);

          processStructure(item.entries, newContext, true, newParents);
        }
      }
      else if(item.type == DATA.TYPE_OBJECT) {
        if(hasChannel(item, false)) {
          const newContext = options.onObject && options.onObject(item, context, insideArray, newParents);

          processStructure(item.properties, newContext, false, newParents);
        }
      }
      else {
        if(hasChannel(item, true)) {
          options.onPrimitive && options.onPrimitive(item, context, insideArray, newParents);
        }
      }
    }

    function processStructure(list, context, insideArray, parents) {
      for(const item of list) {
        processNode(item, context, insideArray, parents);
      }
    }
  }

  /**
    Exports the IR object back to the core JSON-compatible object it describes.
  */
  exportToJson() {
    const object = {};

    this.traverseIrObject({
      initialContext: object,
      onArray: (item, context, insideArray) => {
        return context[insideArray ? item.index : item.name] = [];
      },
      onObject: (item, context, insideArray) => {
        return context[insideArray ? item.index : item.name] = {};
      },
      onPrimitive: (item, context, insideArray, parents) => {
        context[insideArray ? item.index : item.name] = item.value;
      }
    });

    return object.root;
  }
}
