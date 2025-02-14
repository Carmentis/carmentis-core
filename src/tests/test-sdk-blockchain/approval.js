export const APPROVAL_MONO_CHANNEL = {
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

export const APPROVAL_MULTI_CHANNEL = {
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
