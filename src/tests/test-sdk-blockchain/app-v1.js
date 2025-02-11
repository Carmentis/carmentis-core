import { DATA } from "../../common/constants/constants.js";

export const APP_V1 = {
  "description": {
    "name": "FileSign",
    "logoUrl": "https://sign.testapps.carmentis.io/assets/img/logo.png",
    "homepageUrl": "https://sign.testapps.carmentis.io?id={{ID}}&version={{VERSION}}",
    "rootDomain": "sign.testapps.carmentis.io",
    "description": "The best way to sign files"
  },
  "definition": {
    "fields": [
      {
        "name": "transactionId",
        "type": DATA.STRING | DATA.OPTIONAL
      },
      {
        "name": "senderDocument",
        "type": DATA.STRUCT | DATA.OPTIONAL | 0
      },
      {
        "name": "recipientAnswer",
        "type": DATA.STRUCT | DATA.OPTIONAL | 1
      }
    ],
    "structures": [
      {
        "name": "document",
        "properties": [
          {
            "name": "file",
            "type": DATA.FILE | DATA.PRIVATE
          },
          {
            "name": "senderEmail",
            "type": DATA.STRING | DATA.PRIVATE
          },
          {
            "name": "recipientEmail",
            "type": DATA.STRING | DATA.PRIVATE
          }
        ]
      },
      {
        "name": "answer",
        "properties": [
          {
            "name": "status",
            "type": DATA.ENUM | DATA.PRIVATE | 0
          },
          {
            "name": "comment",
            "type": DATA.STRING | DATA.PRIVATE
          }
        ]
      }
    ],
    "masks": [
      {
        "name": "email",
        "regex": "/^(.)(.*?)(.@.*)$/",
        "substitution": "$1***$3"
      }
    ],
    "messages": [
      {
        "name": "fileSent",
        "content": "I approve the content of the file {{this.senderDocument.file}}. This file will be sent to {{this.senderDocument.recipientEmail}} for review."
      },
      {
        "name": "accept",
        "content": "I approve the content of the file {{last.senderDocument.file}} sent by {{last.senderDocument.senderEmail}} with the following comment: \"{{this.recipientAnswer.comment}}\"."
      },
      {
        "name": "decline",
        "content": "I decline the file {{last.senderDocument.file}} sent by {{last.senderDocument.senderEmail}} with the following comment: \"{{this.recipientAnswer.comment}}\"."
      }
    ],
    "enumerations": [
      {
        "name": "status",
        "values": [
          "accepted",
          "declined"
        ]
      }
    ]
  }
};
