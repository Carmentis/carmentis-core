import { DATA } from "../../common/constants/constants.js";

export const ORACLE = {
  "description": {
    "name": "Email oracle"
  },
  "definition": {
    "services": [
      {
        name: "verifyEmail",
        request: [
          {
            "name": "publicKey",
            "type": DATA.STRING
          },
          {
            "name": "email",
            "type": DATA.STRING
          }
        ],
        answer: [
          {
            "name": "publicKey",
            "type": DATA.STRING
          },
          {
            "name": "email",
            "type": DATA.STRING
          },
          {
            "name": "status",
            "type": DATA.ENUM | 0
          }
        ]
      }
    ],
    "structures": [
    ],
    "masks": [
    ],
    "enumerations": [
      {
        "name": "status",
        "values": [
          "failure",
          "success"
        ]
      }
    ]
  }
};
