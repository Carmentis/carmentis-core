import { SCHEMAS } from "../constants/constants.js";
import { SchemaSerializer, SchemaUnserializer } from "../serializers/schemaSerializer.js";

export class Provider {
  constructor(internalProvider, externalProvider) {
    this.internalProvider = internalProvider;
    this.externalProvider = externalProvider;
  }

  async sendMicroblockContent(hash, headerData, bodyData) {
  }

  async getMicroblockInformation(hash) {
    let data = await this.internalProvider.getMicroblockInformation(hash);

    if(!data) {
      data = await this.externalProvider.getMicroblockInformation(hash);

      if(data) {
        await this.internalProvider.setMicroblockInformation(hash, data);
      }
    }
    return data && this.constructor.decodeMicroblockInformation(data);
  }

  async getMicroblockInformationBulk(hash, count) {
    const list = [];

    let currentHash = hash,
        currentCount = count;

    while(currentCount) {
      const data = await this.internalProvider.getMicroblockInformation(currentHash);

      if(!data) {
        break;
      }

      const object = this.constructor.decodeMicroblockInformation(data);
      list.push(object);
      currentHash = object.previousHash;
      currentCount--;
    }

    if(currentCount) {
      const externalList = await this.externalProvider.getMicroblockInformationBulk(currentHash, currentCount);

      for(const data of externalList) {
        await this.internalProvider.setMicroblockInformation(currentHash, data);
        const object = this.constructor.decodeMicroblockInformation(data);
        list.push(object);
        currentHash = object.previousHash;
      }
    }

    return list;
  }

  async getMicroblockContent(hash) {
    let data = await this.internalProvider.getMicroblockContent(hash);

    if(!data) {
      data = await this.externalProvider.getMicroblockContent(hash);

      if(data) {
        await this.internalProvider.setMicroblockContent(hash, data);
      }
    }
    return data;
  }

  async getVirtualBlockchainState(identifier) {
    let data = await this.internalProvider.getVirtualBlockchainState(identifier);

    if(!data) {
      data = await this.externalProvider.getVirtualBlockchainState(identifier);

      if(data) {
        await this.internalProvider.setVirtualBlockchainState(identifier, data);
      }
    }
    return data && this.constructor.decodeVirtualBlockchainState(data);
  }

  async setMicroblockInformation(hash, virtualBlockchainType, virtualBlockchainId, previousHash) {
    const data = this.constructor.encodeMicroblockInformation(virtualBlockchainType, virtualBlockchainId, previousHash);
    await this.internalProvider.setMicroblockInformation(hash, data);
  }

  async setMicroblockContent(hash, data) {
    await this.internalProvider.setMicroblockContent(hash, data);
  }

  async setVirtualBlockchainState(identifier, type, height, lastMicroblockHash, customStateObject) {
    const data = this.constructor.encodeVirtualBlockchainState(type, height, lastMicroblockHash, customStateObject);
    await this.internalProvider.setVirtualBlockchainState(identifier, data);
  }

  static encodeMicroblockInformation(virtualBlockchainType, virtualBlockchainId, previousHash) {
    const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_INFORMATION),
          data = serializer.serialize({ virtualBlockchainType, virtualBlockchainId, previousHash });

    return data;
  }

  static decodeMicroblockInformation(data) {
    const unserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_INFORMATION),
          object = unserializer.unserialize(data);

    return object;
  }

  static encodeVirtualBlockchainState(type, height, lastMicroblockHash, customStateObject) {
    const customStateSerializer = new SchemaSerializer(SCHEMAS.STATES[type]),
          customState = customStateSerializer.serialize(customStateObject);

    const stateObject = {
      type,
      height,
      lastMicroblockHash,
      customState
    };

    const stateSerializer = new SchemaSerializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE),
          data = stateSerializer.serialize(stateObject);

    return data;
  }

  static decodeVirtualBlockchainState(data) {
    const stateUnserializer = new SchemaUnserializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE),
          stateObject = stateUnserializer.unserialize(data);

    const customStateUnserializer = new SchemaUnserializer(SCHEMAS.STATES[stateObject.type]),
          customStateObject = customStateUnserializer.unserialize(stateObject.customState);

    stateObject.customState = customStateObject;

    return stateObject;
  }
}
