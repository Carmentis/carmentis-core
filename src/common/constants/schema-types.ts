

/**
 * Error schema
 */
export interface ErrorSchema {
  type: number;
  id: number;
  arg: string[];
}

/**
 * Record related interfaces
 */
export interface RecordActorSchema {
  name: string;
}

export interface RecordChannelSchema {
  name: string;
  public: boolean;
}

export interface RecordChannelAssignationSchema {
  fieldPath: string;
  channelName: string;
}

export interface RecordActorAssignationSchema {
  actorName: string;
  channelName: string;
}

export interface RecordMaskedPartSchema {
  position: number;
  length: number;
  replacementString: string;
}

export interface RecordMaskableFieldSchema {
  fieldPath: string;
  maskedParts: RecordMaskedPartSchema[];
}

export interface RecordHashableFieldSchema {
  fieldPath: string;
}

export interface RecordDescriptionSchema {
  applicationId: string;
  virtualBlockchainId?: string;
  data: any;
  actors?: RecordActorSchema[];
  channels?: RecordChannelSchema[];
  channelAssignations?: RecordChannelAssignationSchema[];
  actorAssignations?: RecordActorAssignationSchema[];
  hashableFields?: RecordHashableFieldSchema[];
  maskableFields?: RecordMaskableFieldSchema[];
  author: string;
  endorser?: string;
}

/**
 * Account related interfaces
 */
export interface AccountStateSchema {
  height: number;
  balance: number;
  lastHistoryHash: Uint8Array;
}

export interface AccountHistorySchema {
  height: number;
  previousHistoryHash: Uint8Array;
  type: number;
  timestamp: number;
  linkedAccount: Uint8Array;
  amount: number;
  chainReference: Uint8Array;
}

/**
 * Virtual blockchain state interfaces
 */
export interface VirtualBlockchainStateSchema {
  type: number;
  height: number;
  lastMicroblockHash: Uint8Array;
  customState: Uint8Array;
}

export interface AccountVbStateSchema {
  signatureAlgorithmId: number;
  publicKeyHeight: number;
}

export interface ValidatorNodeVbStateSchema {
  // Empty in the original schema
}

export interface OrganizationVbStateSchema {
  signatureAlgorithmId: number;
  publicKeyHeight: number;
  descriptionHeight: number;
}

export interface ApplicationVbStateSchema {
  signatureAlgorithmId: number;
  organizationId: Uint8Array;
  descriptionHeight: number;
}

export interface AppLedgerChannelVbStateSchema {
  name: string;
  isPrivate: boolean;
  creatorId: number;
}

export interface AppLedgerActorInvitationVbStateSchema {
  channelId: number;
  height: number;
}

export interface AppLedgerActorVbStateSchema {
  name: string;
  subscribed: boolean;
  invitations: AppLedgerActorInvitationVbStateSchema[];
}

export interface AppLedgerVbStateSchema {
  signatureAlgorithmId: number;
  applicationId: Uint8Array;
  channels: AppLedgerChannelVbStateSchema[];
  actors: AppLedgerActorVbStateSchema[];
}

/**
 * Microblock related interfaces
 */
export interface MicroblockHeaderSchema {
  magicString: string;
  protocolVersion: number;
  height: number;
  previousHash: Uint8Array;
  timestamp: number;
  gas: number;
  gasPrice: number;
  bodyHash: Uint8Array;
}

export interface MicroblockSectionSchema {
  type: number;
  data: Uint8Array;
}

export interface MicroblockBodySchema {
  body: MicroblockSectionSchema[];
}

export interface MicroblockInformationSchema {
  virtualBlockchainId: Uint8Array;
  virtualBlockchainType: number;
  header: Uint8Array;
}

/**
 * Node message types enum
 */
export enum NodeMessageTypes {
  MSG_ERROR = 0x00,
  MSG_GET_VIRTUAL_BLOCKCHAIN_STATE = 0x01,
  MSG_VIRTUAL_BLOCKCHAIN_STATE = 0x02,
  MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE = 0x03,
  MSG_VIRTUAL_BLOCKCHAIN_UPDATE = 0x04,
  MSG_GET_MICROBLOCK_INFORMATION = 0x05,
  MSG_MICROBLOCK_INFORMATION = 0x06,
  MSG_AWAIT_MICROBLOCK_ANCHORING = 0x07,
  MSG_MICROBLOCK_ANCHORING = 0x08,
  MSG_GET_MICROBLOCK_BODYS = 0x09,
  MSG_MICROBLOCK_BODYS = 0x0A,
  MSG_GET_ACCOUNT_STATE = 0x0B,
  MSG_ACCOUNT_STATE = 0x0C,
  MSG_GET_ACCOUNT_HISTORY = 0x0D,
  MSG_ACCOUNT_HISTORY = 0x0E,
  MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH = 0x0F,
  MSG_ACCOUNT_BY_PUBLIC_KEY_HASH = 0x10,
  MSG_GET_OBJECT_LIST = 0x11,
  MSG_OBJECT_LIST = 0x12,
  MSG_ANS_ERROR = 0xFF
}

/**
 * Wallet interface message types enum
 */
export enum WiMessageTypes {
  WIMSG_REQUEST = 0x0,
  WIMSG_UPDATE_QR = 0x1,
  WIMSG_CONNECTION_TOKEN = 0x2,
  WIMSG_FORWARDED_ANSWER = 0x3,
  WIMSG_GET_CONNECTION_INFO = 0x4,
  WIMSG_ANSWER = 0x5,
  WIMSG_CONNECTION_INFO = 0x6,
  WIMSG_CONNECTION_ACCEPTED = 0x7,
  WIMSG_FORWARDED_REQUEST = 0x8
}

/**
 * Wallet interface request types enum
 */
export enum WiRequestTypes {
  WIRQ_AUTH_BY_PUBLIC_KEY = 0x0,
  WIRQ_DATA_APPROVAL = 0x1,
  WIRQ_GET_EMAIL = 0x2,
  WIRQ_GET_USER_DATA = 0x3
}

/**
 * Wallet operator message types enum
 */
export enum WalletOpMessageTypes {
  MSG_APPROVAL_HANDSHAKE = 0x00,
  MSG_ACTOR_KEY = 0x01,
  MSG_APPROVAL_SIGNATURE = 0x02,
  MSG_ANS_ACTOR_KEY_REQUIRED = 0x80,
  MSG_ANS_APPROVAL_DATA = 0x81,
  MSG_ANS_APPROVAL_SIGNATURE = 0x82,
  MSG_ANS_ERROR = 0xFF
}

/**
 * Wallet interface related interfaces
 */
export interface WiQrCodeSchema {
  qrId: Uint8Array;
  timestamp: number;
  serverUrl: string;
}

export interface WiRequestSchema {
  requestType: number;
  request: Uint8Array;
  deviceId: Uint8Array;
  withToken: number;
}

export interface WiUpdateQrSchema {
  qrId: Uint8Array;
  timestamp: number;
}

export interface WiConnectionTokenSchema {
  token: Uint8Array;
}

export interface WiForwardedAnswerSchema {
  answerType: number;
  answer: Uint8Array;
}

export interface WiGetConnectionInfoSchema {
  qrId: Uint8Array;
}

export interface WiAnswerSchema {
  answerType: number;
  answer: Uint8Array;
}

export interface WiConnectionInfoSchema {
  // Empty in the original schema
}

export interface WiConnectionAcceptedSchema {
  qrId: Uint8Array;
}

export interface WiForwardedRequestSchema {
  requestType: number;
  request: Uint8Array;
}

/**
 * Wallet interface request interfaces
 */
export interface WiAuthByPublicKeyRequestSchema {
  challenge: Uint8Array;
}

export interface WiGetEmailRequestSchema {
  // Empty in the original schema
}

export interface WiGetUserDataRequestSchema {
  requiredData: string[];
}

export interface WiDataApprovalRequestSchema {
  dataId: Uint8Array;
  serverUrl: string;
}

/**
 * Wallet interface answer interfaces
 */
export interface WiAuthByPublicKeyAnswerSchema {
  publicKey: string;
  signature: string;
}

export interface WiGetEmailAnswerSchema {
  email: string;
}

export interface WiDataApprovalAnswerSchema {
  vbHash: Uint8Array;
  mbHash: Uint8Array;
  height: number;
}

export interface WiGetUserDataAnswerSchema {
  userData: string[];
}

/**
 * Wallet operator message interfaces
 */
export interface WalletOpApprovalHandshakeSchema {
  dataId: Uint8Array;
}

export interface WalletOpActorKeySchema {
  dataId: Uint8Array;
  actorKey: string;
}

export interface WalletOpApprovalSignatureSchema {
  dataId: Uint8Array;
  signature: Uint8Array;
}

export interface WalletOpAnsActorKeyRequiredSchema {
  genesisSeed: Uint8Array;
}

export interface WalletOpAnsApprovalDataSchema {
  data: Uint8Array;
}

export interface WalletOpAnsApprovalSignatureSchema {
  vbHash: Uint8Array;
  mbHash: Uint8Array;
  height: number;
}

export interface WalletOpAnsErrorSchema {
  error: Error;
}

// Constants
export const WI_MAX_SERVER_URL_LENGTH = 100;
export const MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET = 12;
export const MICROBLOCK_HEADER_BODY_HASH_OFFSET = 57;
export const MICROBLOCK_HEADER_SIZE = 89;
