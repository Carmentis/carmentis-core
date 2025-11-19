export interface RecordActor {
    name: string;
}

export interface RecordChannel {
    name: string;
    public: boolean;
}

export interface RecordChannelAssignation {
    fieldPath: string;
    channelName: string;
}

export interface RecordActorAssignation {
    actorName: string;
    channelName: string;
}

export interface RecordMaskedPart {
    position: number;
    length: number;
    replacementString: string;
}

export interface RecordMaskableField {
    fieldPath: string;
    maskedParts: RecordMaskedPart[];
}

export interface RecordHashableField {
    fieldPath: string;
}

export interface StateUpdateRequest<DataType = any> {
    /**
     * Links the record to an application.
     */
    applicationId: string;

    /**
     * Links the record to an existing transactional flow. When omitted, the record is put in a new virtual blockchain.
     */
    virtualBlockchainId?: string;
    data: DataType;
    actors?: RecordActor[];
    channels?: RecordChannel[];
    channelAssignations?: RecordChannelAssignation[];
    actorAssignations?: RecordActorAssignation[];
    hashableFields?: RecordHashableField[];
    maskableFields?: RecordMaskableField[];
    author: string;
    endorser?: string;
    approvalMessage?: string;
}