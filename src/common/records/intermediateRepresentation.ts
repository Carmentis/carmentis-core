import { WriteStream, ReadStream } from "../data/byteStreams";
import { PathManager } from "./pathManager";
import { MaskManager } from "./maskManager";
import { TypeManager } from "../data/types";
import { PepperMerklizer, SaltMerklizer } from "./merklizer";
import { DATA } from "../constants/constants";

const MAX_UINT8_ARRAY_DUMP_SIZE = 24;

export class IntermediateRepresentation {
  channelDefinitions: any;
  irObject: any;
  object: any;
  usedChannels: any;
  /**
    Constructor
  */
  constructor() {
    this.irObject = [];
    this.channelDefinitions = new Map;
    this.object = {
      info: {},
      recordData: this.irObject
    };
  }

  addPublicChannel(id: any) {
    if(this.channelDefinitions.has(id)) {
      throw `channel ${id} was already added`;
    }
    this.channelDefinitions.set(id, { id, isPrivate: false });
  }

  addPrivateChannel(id: any) {
    if(this.channelDefinitions.has(id)) {
      throw `channel ${id} was already added`;
    }
    this.channelDefinitions.set(id, { id, isPrivate: true, pepper: PepperMerklizer.generatePepper() });
  }

  /**
    Initializes the IR object from a JSON-compatible object.
    @param {object} input
  */
  buildFromJson(input: any) {
    const output: any = [];

    processStructure(
      {
        root: input
      },
      output,
      false
    );

    this.irObject = output;

    function processNode(object: any, propertyName: any, container: any, insideArray: any) {
      const item = object[propertyName],
            type = TypeManager.getType(item);

      if(!TypeManager.isJsonType(type)) {
        throw `Invalid JSON type`;
      }

      const outputNode = {
        type: type
      };

      if(insideArray) {
        // @ts-expect-error TS(2339): Property 'index' does not exist on type '{ type: n... Remove this comment to see the full error message
        outputNode.index = +propertyName;
      }
      else {
        // @ts-expect-error TS(2339): Property 'name' does not exist on type '{ type: nu... Remove this comment to see the full error message
        outputNode.name = propertyName;
      }

      if(type == DATA.TYPE_OBJECT) {
        // @ts-expect-error TS(2339): Property 'properties' does not exist on type '{ ty... Remove this comment to see the full error message
        outputNode.properties = [];
        // @ts-expect-error TS(2339): Property 'properties' does not exist on type '{ ty... Remove this comment to see the full error message
        processStructure(item, outputNode.properties, false);
      }
      else if(type == DATA.TYPE_ARRAY) {
        // @ts-expect-error TS(2339): Property 'entries' does not exist on type '{ type:... Remove this comment to see the full error message
        outputNode.entries = [];
        // @ts-expect-error TS(2339): Property 'entries' does not exist on type '{ type:... Remove this comment to see the full error message
        processStructure(item, outputNode.entries, true);
      }
      else {
        // @ts-expect-error TS(2339): Property 'value' does not exist on type '{ type: n... Remove this comment to see the full error message
        outputNode.value = item;
        // @ts-expect-error TS(2339): Property 'attributes' does not exist on type '{ ty... Remove this comment to see the full error message
        outputNode.attributes = 0;
        // @ts-expect-error TS(2339): Property 'channelId' does not exist on type '{ typ... Remove this comment to see the full error message
        outputNode.channelId = null;
      }

      container.push(outputNode);
    }

    function processStructure(object: any, output: any, insideArray: any) {
      for(const propertyName in object) {
        processNode(object, propertyName, output, insideArray);
      }
    }
  }

  /**
    Exports the IR object to the serialized section format used for on-chain storage.
  */
  exportToSectionFormat() {
    const list = [];

    for(const channelId of this.usedChannels) {
      const channelInfo = this.channelDefinitions.get(channelId);
      const data = this.exportChannelToSectionFormat(channelInfo);
      const object = { channelId, data, isPrivate: channelInfo.isPrivate };

      if(channelInfo.isPrivate) {
        // @ts-expect-error TS(2339): Property 'merkleRootHash' does not exist on type '... Remove this comment to see the full error message
        object.merkleRootHash = this.getMerkleRootHash(channelId);
      }
      list.push(object);
    }
    return list;
  }

  /**
    Exports a given channel to the serialized section format used for on-chain storage.
  */
  exportChannelToSectionFormat(channelInfo: any) {
    const stream = new WriteStream();

    if(channelInfo.isPrivate) {
      stream.writeByteArray(channelInfo.pepper);
    }

    const dictionary = this.buildDictionary(channelInfo.id);

    stream.writeVarUint(dictionary.length);

    for(const name of dictionary) {
      // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
      stream.writeString(name);
    }

    this.traverseIrObject({
      channelId: channelInfo.id,
      onObject: (item: any, context: any, insideArray: any, parents: any) => {
        if(parents.length > 1) {
          writeIdentifier(item, insideArray);
        }
        stream.writeByte(item.type);
        stream.writeVarUint(countChildren(item.properties));
      },
      onArray: (item: any, context: any, insideArray: any, parents: any) => {
        if(parents.length > 1) {
          writeIdentifier(item, insideArray);
        }
        stream.writeByte(item.type);
        stream.writeVarUint(countChildren(item.entries));
      },
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
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

    return stream.getByteStream();

    function writeIdentifier(item: any, insideArray: any) {
      stream.writeVarUint(
        insideArray ?
          item.index
        :
          dictionary.indexOf(item.name)
      );
    }

    function countChildren(list: any) {
      return list.reduce((cnt: any, item: any) =>
        cnt +=
          item.type == DATA.TYPE_ARRAY || item.type == DATA.TYPE_OBJECT ?
            item.channels.has(channelInfo.id)
          :
            item.channelId === channelInfo.id,
        0
      );
    }
  }

  /**
    Imports the IR object from the serialized section format.
  */
  importFromSectionFormat(list: any) {
    for(const object of list) {
      const channelInfo = this.channelDefinitions.get(object.channelId);
      this.importChannelFromSectionFormat(channelInfo, object.data);

      if(channelInfo.isPrivate) {
        const merkleRootHash = this.getMerkleRootHash(object.channelId);

        if(merkleRootHash != object.merkleRootHash) {
          throw `inconsistent Merkle root hash (expected: ${object.merkleRootHash}, computed: ${merkleRootHash})`;
        }
      }
    }
  }

  /**
    Imports a given channel from the serialized section format.
  */
  importChannelFromSectionFormat(channelInfo: any, data: any) {
    const stream = new ReadStream(data);

    if(channelInfo.isPrivate) {
      channelInfo.pepper = stream.readByteArray(32);
    }

    const dictionarySize = stream.readVarUint(),
          dictionary: any = [];

    for(let n = 0; n < dictionarySize; n++) {
      // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
      dictionary.push(stream.readString());
    }

    readNode(this.irObject, false, true);

    function readNode(container: any, insideArray: any, isRoot = false) {
      const id = isRoot ? null : stream.readVarUint();
            // @ts-expect-error TS(2538): Type 'null' cannot be used as an index type.
      const name = insideArray ? null : isRoot ? "root" : dictionary[id];
      const param = stream.readByte();
      const type = param & 0x7;
      const attributes = param >> 3;

      let newItem = true,
          item;

      if(type == DATA.TYPE_OBJECT || type == DATA.TYPE_ARRAY) {
        // if this item is an object or an array, it may have been already created while processing another channel,
        // in which case we must re-use the existing instance
        item = container.find((item: any) => insideArray ? item.index == id : item.name == name);
        newItem = item === undefined;
      }

      if(newItem) {
        item = { type };

        if(insideArray) {
          // @ts-expect-error TS(2339): Property 'index' does not exist on type '{ type: n... Remove this comment to see the full error message
          item.index = id;
        }
        else {
          // @ts-expect-error TS(2339): Property 'name' does not exist on type '{ type: nu... Remove this comment to see the full error message
          item.name = name;
        }
      }

      if(type == DATA.TYPE_OBJECT) {
        (item.channels = item.channels || new Set).add(channelInfo.id);
        readObject(item);
      }
      else if(type == DATA.TYPE_ARRAY) {
        (item.channels = item.channels || new Set).add(channelInfo.id);
        readArray(item, !newItem);
      }
      else {
        if(attributes == DATA.MASKABLE) {
          let ptr;

          item.visibleParts = [];
          item.hiddenParts = [];

          ptr = stream.getPointer();

          for(let n = stream.readVarUint(); n--;) {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            item.visibleParts.push(stream.readString());
          }
          item.visiblePartsBinary = stream.extractFrom(ptr);
          ptr = stream.getPointer();

          for(let n = stream.readVarUint(); n--;) {
            // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
            item.hiddenParts.push(stream.readString());
          }
          item.hiddenPartsBinary = stream.extractFrom(ptr);

          item.value = MaskManager.getFullText(item.visibleParts, item.hiddenParts);
        }
        else {
          item.value = stream.readJsonValue(type);
          item.valueBinary = stream.getLastField();
        }
        item.attributes = attributes;
        item.channelId = channelInfo.id;
      }

      if(newItem) {
        container.push(item);
      }
    }

    function readObject(parent: any) {
      const nProperties = stream.readVarUint();

      parent.properties = parent.properties || [];

      for(let n = 0; n < nProperties; n++) {
        readNode(parent.properties, false);
      }
    }

    function readArray(parent: any, sortRequired: any) {
      const nEntries = stream.readVarUint();

      parent.entries = parent.entries || [];

      for(let n = 0; n < nEntries; n++) {
        readNode(parent.entries, true);
      }

      if(sortRequired) {
        parent.entries.sort((a: any, b: any) => a.index - b.index);
      }
    }
  }

  /**
    Exports the IR object to a proof, as a JSON-compatible object.
    @param {object} info - An object containing meta-data about the proof.
  */
  exportToProof(info: any) {
    const proofIr = new IntermediateRepresentation,
          merkleData = [];

    for(const channelId of this.usedChannels) {
      const channelInfo = this.channelDefinitions.get(channelId);

      if(!channelInfo.isPrivate) {
        continue;
      }

      const merklizer = this.getMerklizer(channelId),
            merkleObject = merklizer.generateTree(),
            knownPositions = new Set;

      this.traverseIrObject({
        channelId: channelId,
        onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
          if(!(item.attributes & DATA.REDACTED)) {
            knownPositions.add(item.leafIndex);

            const proofItem = proofIr.createBranch(parents);

            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            proofItem.attributes = item.attributes;
            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            proofItem.channelId = item.channelId;
            // @ts-expect-error TS(2532): Object is possibly 'undefined'.
            proofItem.leafIndex = item.leafIndex;

            if(item.attributes & DATA.MASKABLE) {
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
              proofItem.visibleSalt = item.visibleSalt;
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
              proofItem.visibleParts = item.visibleParts;

              if(item.attributes & DATA.MASKED) {
                // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                proofItem.hiddenHash = item.hiddenHash;
              }
              else {
                // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                proofItem.hiddenSalt = item.hiddenSalt;
                // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                proofItem.hiddenParts = item.hiddenParts;
              }
            }
            else if(item.attributes & DATA.HASHABLE) {
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
              proofItem.salt = item.salt;

              if(item.attributes & DATA.HASHED) {
                // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                proofItem.hash = item.hash;
              }
              else {
                // @ts-expect-error TS(2532): Object is possibly 'undefined'.
                proofItem.value = item.value;
              }
            }
            else {
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
              proofItem.salt = item.salt;
              // @ts-expect-error TS(2532): Object is possibly 'undefined'.
              proofItem.value = item.value;
            }
          }
        }
      });

      merkleData.push({
        channelId: channelId,
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
  importFromProof(proof: any) {
    this.object = proof;
    this.irObject = proof.recordData;
    this.populateChannels();
    this.serializeFields();

    const merkleData = [];

    for(const channelId of this.usedChannels) {
      const channelInfo = this.channelDefinitions.get(channelId);

      if(!channelInfo.isPrivate) {
        continue;
      }

      const merklizer = this.getMerklizer(channelId),
            merkleObject = merklizer.generateTree();

      merkleData.push({
        channelId: channelId,
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
  createBranch(itemList: any) {
    let container = this.irObject,
        insideArray = false;

    for(const currentItem of itemList) {
      if(currentItem.type == DATA.TYPE_OBJECT || currentItem.type == DATA.TYPE_ARRAY) {
        let refItem = container.find((item: any) => insideArray ? item.index == currentItem.index : item.name == currentItem.name);

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

    function createNewItem(item: any) {
      const newItem = {
        type: item.type
      };

      if(insideArray) {
        // @ts-expect-error TS(2339): Property 'index' does not exist on type '{ type: a... Remove this comment to see the full error message
        newItem.index = item.index;
      }
      else {
        // @ts-expect-error TS(2339): Property 'name' does not exist on type '{ type: an... Remove this comment to see the full error message
        newItem.name = item.name;
      }
      return newItem;
    }
  }

  getMerkleRootHash(channelId: any) {
    const merklizer = this.getMerklizer(channelId),
          merkleObject = merklizer.generateTree();

    return merkleObject.rootHash;
  }

  /**
    Internal method to create a merklizer for a given channel, using either the channel pepper or the salts.
    @param {number} channel - The identifier of the channel.
  */
  getMerklizer(channelId: any) {
    let merklizer: any;

    if(this.object.info.type == "proof") {
      const merkleData = this.object.merkleData.find((obj: any) => obj.channelId == channelId);
      merklizer = new SaltMerklizer(merkleData.nLeaves, merkleData.witnesses);
    }
    else {
      const channelInfo = this.channelDefinitions.get(channelId);
      merklizer = new PepperMerklizer(channelInfo.pepper);
    }

    this.traverseIrObject({
      channelId: channelId,
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
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
            ...[ ...value.slice(0, MAX_UINT8_ARRAY_DUMP_SIZE) ].map((v) =>
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
  setChannel(pathStringList: any, channelId: any) {
    if(!this.channelDefinitions.has(channelId)) {
      throw `channel ${channelId} is undefined`;
    }

    this.processPath(
      pathStringList,
      (item: any) => {
        item.channelId = channelId;
      }
    );
  }

  /**
    Sets the 'maskable' attribute for a set of fields and define their visible and hidden parts using explicit positions, lengths and replacement strings.
    @param {string} pathStringList - A string describing the set of fields.
    @param {array} maskedParts - An array describing the masked parts.
  */
  setAsMaskable(pathStringList: any, maskedParts: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
        const obj = MaskManager.applyMask(item.value, maskedParts);

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
  setAsMaskableByRegex(pathStringList: any, regex: any, substitution: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
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
  setAsHashable(pathStringList: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
        item.attributes = (item.attributes & ~DATA.PROPERTIES) | DATA.HASHABLE;
      }
    );
  }

  /**
    Marks a set of fields as 'redacted'.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsRedacted(pathStringList: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
        item.attributes = (item.attributes & ~DATA.FORMAT) | DATA.REDACTED;
      }
    );
  }

  /**
    Marks a set of fields as 'masked'.
    @param {string} pathStringList - A string describing the set of fields.
  */
  setAsMasked(pathStringList: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
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
  setAsHashed(pathStringList: any) {
    this.processPath(
      pathStringList,
      (item: any) => {
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
  processPath(pathStringList: any, callback: any) {
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
    Also loads the sorted list of all channels in the array this.usedChannels.
  */
  populateChannels() {
    this.traverseIrObject({
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
        for(let i = 0; i < parents.length - 1; i++) {
          if(item.channelId === null) {
            throw `field '${PathManager.fromParents(parents)}' is not assigned to any channel`;
          }
          (parents[i].channels = parents[i].channels || new Set).add(item.channelId);
        }
      }
    });

    this.usedChannels = [...this.irObject[0].channels].sort((a, b) => a - b);

    for(const channelId of this.usedChannels) {
      if(!this.channelDefinitions.has(channelId)) {
        throw `channel ${channelId} is undefined`;
      }
    }
  }

  /**
    Internal method to build a dictionary of field names for a given channel.
    @param {number} channel - The channel identifier.
  */
  buildDictionary(channelId: any) {
    const dictionary = new Map;

    // collect all names and count how many times they appear
    this.traverseIrObject({
      channelId: channelId,
      onObject: (item: any, context: any, insideArray: any, parents: any) => {
        if(parents.length > 1 && !insideArray) {
          processItem(item);
        }
      },
      onArray: (item: any, context: any, insideArray: any, parents: any) => {
        if(!insideArray) {
          processItem(item);
        }
      },
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
        if(!insideArray) {
          processItem(item);
        }
      }
    });

    function processItem(item: any) {
      dictionary.set(item.name, dictionary.has(item.name) ? dictionary.get(item.name) + 1 : 1)
    }

    // turn that into a lookup sorted by use frequency in descending order
    const arr = [];

    for(const [ key, count ] of dictionary) {
      arr.push([ count, key ]);
    }

    // @ts-expect-error TS(2769): No overload matches this call.
    const lookup = new Map([...arr.sort((a, b) => b[0] - a[0]).map((a, i) => [ a[1], i ])]);

    return [...lookup.keys()];
  }

  /**
    Internal method to serialize the primitive fields.
  */
  serializeFields() {
    this.traverseIrObject({
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
        const stream = new WriteStream();

        if(item.attributes & DATA.MASKABLE) {
          stream.writeVarUint(item.visibleParts.length);

          for(const str of item.visibleParts) {
            // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
            stream.writeString(str);
          }
          item.visiblePartsBinary = stream.getByteStream();

          if(!(item.attributes & DATA.MASKED)) {
            stream.clear();
            stream.writeVarUint(item.hiddenParts.length);

            for(const str of item.hiddenParts) {
              // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
              stream.writeString(str);
            }
            item.hiddenPartsBinary = stream.getByteStream();
          }
        }
        else if(!(item.attributes & DATA.HASHED)) {
          stream.writeJsonValue(item.type, item.value);
          item.valueBinary = stream.getByteStream();
        }
      }
    });
  }

  // !! not used
  unserializeFields() {
    this.traverseIrObject({
      onPrimitive: (item: any) => {
        const stream = new ReadStream(item.valueBinary);

        // @ts-expect-error TS(2339): Property 'read' does not exist on type 'ReadStream... Remove this comment to see the full error message
        item.value = stream.read(item.type);
      }
    });
  }

  /**
    Internal method to traverse the IR object and calling optional callbacks on each node.
    @param {object} options - An object containing the traversal options.
  */
  traverseIrObject(options: any) {
    processStructure(this.irObject, options.initialContext, false, []);

    function hasChannel(item: any, isPrimitive: any) {
      return (
        options.channelId === undefined || (
          isPrimitive?
            item.channelId === options.channelId
          :
            item.channels.has(options.channelId)
        )
      );
    }

    function processNode(item: any, context: any, insideArray: any, parents: any) {
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

    function processStructure(list: any, context: any, insideArray: any, parents: any) {
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
      onArray: (item: any, context: any, insideArray: any) => {
        return context[insideArray ? item.index : item.name] = [];
      },
      onObject: (item: any, context: any, insideArray: any) => {
        return context[insideArray ? item.index : item.name] = {};
      },
      onPrimitive: (item: any, context: any, insideArray: any, parents: any) => {
        context[insideArray ? item.index : item.name] = item.value;
      }
    });

    // @ts-expect-error TS(2339): Property 'root' does not exist on type '{}'.
    return object.root;
  }
}
