export const APPROVAL_STEP1_MONO_CHANNEL = {
  channels: [
    {
      name: "mainChannel",
      keyOwner: "fileSign"
    }
  ],
  channelInvitations: {
    sender: [
      "mainChannel"
    ]
  },
  permissions: {
    mainChannel: [ "senderDocument.*" ],
  }
};

export const APPROVAL_STEP2_MONO_CHANNEL = {
  channelInvitations: {
    recipient: [
      "mainChannel"
    ]
  },
  permissions: {
    mainChannel: [ "recipientAnswer.*" ],
  }
};

export const APPROVAL_STEP1_MULTI_CHANNEL = {
  channels: [
    {
      name: "mainChannel",
      keyOwner: "fileSign"
    },
    {
      name: "senderChannel",
      keyOwner: "fileSign"
    },
    {
      name: "recipientChannel",
      keyOwner: "fileSign"
    }
  ],
  channelInvitations: {
    sender: [ "mainChannel", "senderChannel" ]
  },
  permissions: {
    mainChannel: [ "senderDocument.file" ],
    senderChannel: [ "senderDocument.senderEmail" ],
    recipientChannel: [ "senderDocument.recipientEmail" ],
  }
};

export const APPROVAL_STEP2_MULTI_CHANNEL = {
};
