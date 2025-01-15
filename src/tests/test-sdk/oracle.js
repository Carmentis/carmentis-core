import { DATA } from "../../constants/constants.js";

export const ORACLE = {
  "description": {
    "name": "Email oracle"
  },
  "definition": {
    "services": [
      {
        name: "emailService",
        request: [
          {
            "name": "transactionId",
            "type": DATA.STRING | DATA.OPTIONAL
          }
        ],
        answer: [
          {
            "name": "transactionId",
            "type": DATA.STRING | DATA.OPTIONAL
          }
        ]
      }
    ],
    "structures": [
      {
        "name": "document",
        "properties": [
          {
            "name": "email",
            "type": DATA.STRING
          },
          {
            "name": "senderEmail",
            "type": DATA.STRING
          },
          {
            "name": "recipientEmail",
            "type": DATA.STRING
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
