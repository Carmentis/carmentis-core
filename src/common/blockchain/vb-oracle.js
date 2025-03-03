import { ERRORS, ID, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { organizationVb } from "./vb-organization.js";
import * as crypto from "../crypto/crypto.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import { sectionError, oracleError } from "../errors/error.js";

// ============================================================================================================================ //
//  oracleVb                                                                                                                    //
// ============================================================================================================================ //
export class oracleVb extends virtualBlockchain {
  constructor(id) {
    super(ID.OBJ_ORACLE, id);
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.ORACLE_DECLARATION, object);
  }

  async addDescription(object) {
    await this.addSection(SECTIONS.ORACLE_DESCRIPTION, object);
  }

  async addDefinition(object) {
    await this.addSection(SECTIONS.ORACLE_DEFINITION, object);
  }

  async sign() {
    return await this.addSignature(this.constructor.rootPrivateKey, SECTIONS.ORACLE_SIGNATURE);
  }

  async getOrganizationVb() {
    if(!this.state.organizationId) {
      throw new oracleError(ERRORS.ORACLE_MISSING_ORG);
    }

    let vb = new organizationVb(this.state.organizationId);

    await vb.load();

    return vb;
  }

  async getDefinition(version) {
    let object;

    object = await this.findSection(
      SECTIONS.ORACLE_DEFINITION,
      object => version == undefined || object.version == version
    );

    if(object) {
      return object.definition;
    }

    return undefined;
  }

  getService(definition, serviceName) {
    let service = definition && definition.services.find(obj => obj.name == serviceName);

    if(!service) {
      throw new oracleError(ERRORS.ORACLE_UNKNOWN_SERVICE, serviceName);
    }
    return service;
  }

  async encodeServiceRequest(version, serviceName, dataObject, organizationId, privateKey) {
    let definition = await this.getDefinition(version),
        service = this.getService(definition, serviceName);

    let data = schemaSerializer.encode(
      service.request,
      dataObject,
      {
        internalStructures: definition.internalStructures,
        enumerations: definition.enumerations
      }
    );

    let body = {
      organizationId: organizationId,
      oracleId      : this.id,
      serviceName   : serviceName,
      data          : data
    };

    let encodedBody = schemaSerializer.encode(
      SCHEMAS.ORACLE_REQUEST_BODY,
      body
    );

    let request = {
      body: encodedBody,
      signature: crypto.secp256k1.sign(privateKey, encodedBody)
    };

    let ownerVb = new organizationVb(this.state.organizationId);

    await ownerVb.load();

    let server = await ownerVb.getServer();

    return {
      endpoint: server.endpoint,
      request: request
    };
  }

  static decodeServiceRequestBody(body) {
    return schemaSerializer.decode(
      SCHEMAS.ORACLE_REQUEST_BODY,
      body
    );
  }

  async decodeServiceRequest(version, serviceName, request) {
    let definition = await this.getDefinition(version),
        service = definition && definition.services.find(obj => obj.name == serviceName);

    if(!service) {
      throw new oracleError(ERRORS.ORACLE_UNKNOWN_SERVICE, serviceName);
    }

    let body = this.constructor.decodeServiceRequestBody(request.body);

    let senderVb = new organizationVb(body.organizationId);

    await senderVb.load();

    if(!crypto.secp256k1.verify(senderVb.state.publicKey, request.body, request.signature)) {
      throw new oracleError(ERRORS.ORACLE_BAD_REQUEST_SIGNATURE);
    }

    body.data = schemaSerializer.decode(
      service.request,
      body.data,
      {
        internalStructures: definition.internalStructures,
        enumerations: definition.enumerations
      }
    );

    return body;
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ORACLE_DECLARATION: {
        let ownerVb = new organizationVb(object.organizationId);

        await ownerVb.load();

        this.state.organizationId = object.organizationId;
        break;
      }

      case SECTIONS.ORACLE_DESCRIPTION: {
        break;
      }

      case SECTIONS.ORACLE_DEFINITION: {
        break;
      }

      case SECTIONS.ORACLE_SIGNATURE: {
        let vb = await this.getOrganizationVb();

        this.verifySignature(mb, vb.state.publicKey, object);
        mb.payerPublicKey = vb.state.publicKey;
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_ORACLE]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.ORACLE_STRUCTURE.test(pattern);
  }
}
