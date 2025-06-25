import { BlockchainUtils } from "../blockchain/blockchainUtils";
import { Utils } from "../utils/utils";

/**
 * Represents a provider class that interacts with both internal and external providers for managing blockchain states and microblocks.
 */
export class Provider {
  externalProvider: any;
  internalProvider: any;
  constructor(internalProvider: any, externalProvider: any) {
    this.internalProvider = internalProvider;
    this.externalProvider = externalProvider;
  }

  isKeyed() { return false; }

  async sendMicroblock(...args: any[]) {
    return await this.externalProvider.sendMicroblock(...args);
  }

  async awaitMicroblockAnchoring(...args: any[]) {
    return await this.externalProvider.awaitMicroblockAnchoring(...args);
  }

  async getAccountState(...args: any[]) {
    return await this.externalProvider.getAccountState(...args);
  }

  async getAccountHistory(...args: any[]) {
    return await this.externalProvider.getAccountHistory(...args);
  }

  async getAccountByPublicKeyHash(...args: any[]) {
    return await this.externalProvider.getAccountByPublicKeyHash(...args);
  }

  async storeMicroblock(hash: any, virtualBlockchainId: any, virtualBlockchainType: any, height: any, headerData: any, bodyData: any) {
    await this.internalProvider.setMicroblockInformation(
      hash,
      BlockchainUtils.encodeMicroblockInformation(virtualBlockchainType, virtualBlockchainId, headerData)
    );
    await this.internalProvider.setMicroblockBody(hash, bodyData);
  }

  async updateVirtualBlockchainState(virtualBlockchainId: any, type: any, height: any, lastMicroblockHash: any, customStateObject: any) {
    const stateData = BlockchainUtils.encodeVirtualBlockchainState(type, height, lastMicroblockHash, customStateObject);
    await this.internalProvider.setVirtualBlockchainState(virtualBlockchainId, stateData);
  }

  async getMicroblockInformation(hash: any) {
    // FIXME: we should avoid the encoding/decoding passes when getting data from the external provider
    let data = await this.internalProvider.getMicroblockInformation(hash);

    if(!data) {
      const info = await this.externalProvider.getMicroblockInformation(hash);

      if(info) {
        data = BlockchainUtils.encodeMicroblockInformation(info.virtualBlockchainType, info.virtualBlockchainId, info.header);
        await this.internalProvider.setMicroblockInformation(hash, data);
      }
    }
    return data && BlockchainUtils.decodeMicroblockInformation(data);
  }

  async getMicroblockBodys(hashes: any) {
    // get as much data as possible from the internal provider
    const res = [];
    const missingHashes = [];

    for(const hash of hashes) {
      const body = await this.internalProvider.getMicroblockBody(hash);

      if(body) {
        res.push({ hash, body });
      }
      else {
        missingHashes.push(hash);
      }
    }

    // if necessary, request missing data from the external provider
    if(missingHashes.length) {
      const externalData = await this.externalProvider.getMicroblockBodys(missingHashes);

      // save missing data in the internal provider and update res[]
      for(const { hash, body } of externalData.list) {
        await this.internalProvider.setMicroblockBody(hash, body);
        res.push({ hash, body });
      }

      // for convenience, we sort the list according to the original query order
      res.sort((a, b) => hashes.indexOf(a.hash) - hashes.indexOf(b.hash));
    }

    return res;
  }

  async getVirtualBlockchainInformation(virtualBlockchainId: any) {
  }

  async getVirtualBlockchainStateInternal(virtualBlockchainId: any) {
    return await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);
  }

  async getVirtualBlockchainHeaders(virtualBlockchainId: any, knownHeight: any) {
    const stateData = await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);
    const state = BlockchainUtils.decodeVirtualBlockchainState(stateData);

    // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
    let height = state.height;
    // @ts-expect-error TS(2339): Property 'lastMicroblockHash' does not exist on ty... Remove this comment to see the full error message
    let microblockHash = state.lastMicroblockHash;
    const headers = [];

    while(height > knownHeight) {
      const infoData = await this.internalProvider.getMicroblockInformation(microblockHash);
      const info = BlockchainUtils.decodeMicroblockInformation(infoData);
      // @ts-expect-error TS(2339): Property 'header' does not exist on type '{}'.
      headers.push(info.header);
      // @ts-expect-error TS(2339): Property 'header' does not exist on type '{}'.
      microblockHash = BlockchainUtils.previousHashFromHeader(info.header);
      height--;
    }
    return headers;
  }

  async getVirtualBlockchainContent(virtualBlockchainId: any) {
    let microblockHashes: string | any[] = [];
    let state;

    // get the state of this VB from our internal provider
    const stateData = await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);

    // if found, make sure that we still have all the microblock headers up to the height associated to this state
    // and that they are consistent
    if(stateData) {
      state = BlockchainUtils.decodeVirtualBlockchainState(stateData);

      // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
      let height = state.height;
      // @ts-expect-error TS(2339): Property 'lastMicroblockHash' does not exist on ty... Remove this comment to see the full error message
      let microblockHash = state.lastMicroblockHash;
      const headers = [];

      while(height) {
        const infoData = await this.internalProvider.getMicroblockInformation(microblockHash);

        if(!infoData) {
          break;
        }
        const info = BlockchainUtils.decodeMicroblockInformation(infoData);
        // @ts-expect-error TS(2339): Property 'header' does not exist on type '{}'.
        headers.push(info.header);
        // @ts-expect-error TS(2339): Property 'header' does not exist on type '{}'.
        microblockHash = BlockchainUtils.previousHashFromHeader(info.header);
        height--;
      }

      if(height == 0) {
        const check = BlockchainUtils.checkHeaderList(headers);

        if(check.valid) {
          check.hashes.reverse();

          if(Utils.binaryIsEqual(check.hashes[0], virtualBlockchainId)) {
            microblockHashes = check.hashes;
          }
          else {
            console.error("WARNING - genesis microblock hash from internal storage does not match VB identifier");
          }
        }
        else {
          console.error("WARNING - inconsistent hash chain in internal storage");
        }
      }
    }

    // query our external provider for state update and new headers, starting at the known height
    const knownHeight = microblockHashes.length;
    const vbUpdate = await this.externalProvider.getVirtualBlockchainUpdate(virtualBlockchainId, knownHeight);

    if(!vbUpdate.exists) {
      return null;
    }

    if(vbUpdate.changed) {
      // check the consistency of the new headers
      const check = BlockchainUtils.checkHeaderList(vbUpdate.headers);

      if(!check.valid) {
        throw `received headers are inconsistent`;
      }

      // make sure that the 'previous hash' field of the first new microblock matches the last known hash
      if(knownHeight) {
        const firstNewHeader = vbUpdate.headers[vbUpdate.headers.length - 1];
        const linkedHash = BlockchainUtils.previousHashFromHeader(firstNewHeader);

        if(!Utils.binaryIsEqual(linkedHash, microblockHashes[knownHeight - 1])) {
          throw `received headers do not link properly to the last known header`;
        }
      }

      // update the VB state in our internal provider
      await this.internalProvider.setVirtualBlockchainState(virtualBlockchainId, vbUpdate.stateData);

      state = BlockchainUtils.decodeVirtualBlockchainState(vbUpdate.stateData);

      // update the microblock information in our internal provider
      for(let n = 0; n < vbUpdate.headers.length; n++) {
        await this.internalProvider.setMicroblockInformation(
          check.hashes[n],
          // @ts-expect-error TS(2339): Property 'type' does not exist on type '{}'.
          BlockchainUtils.encodeMicroblockInformation(state.type, virtualBlockchainId, vbUpdate.headers[n])
        );
      }

      // add the new hashes to the hash list
      microblockHashes = [ ...microblockHashes, ...check.hashes.reverse() ];
    }

    return { state, microblockHashes };
  }
}
