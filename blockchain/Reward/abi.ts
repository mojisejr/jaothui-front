export const abiReward = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "_jaothuiAddr", internalType: "address" },
      { type: "address", name: "_history", internalType: "address" },
    ],
  },
  {
    type: "event",
    name: "RoleAdminChanged",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32", indexed: true },
      {
        type: "bytes32",
        name: "previousAdminRole",
        internalType: "bytes32",
        indexed: true,
      },
      {
        type: "bytes32",
        name: "newAdminRole",
        internalType: "bytes32",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RoleGranted",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32", indexed: true },
      {
        type: "address",
        name: "account",
        internalType: "address",
        indexed: true,
      },
      {
        type: "address",
        name: "sender",
        internalType: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RoleRevoked",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32", indexed: true },
      {
        type: "address",
        name: "account",
        internalType: "address",
        indexed: true,
      },
      {
        type: "address",
        name: "sender",
        internalType: "address",
        indexed: true,
      },
    ],
    anonymous: false,
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bytes32", name: "", internalType: "bytes32" }],
    name: "ADMIN",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bytes32", name: "", internalType: "bytes32" }],
    name: "DEFAULT_ADMIN_ROLE",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "addReward",
    inputs: [
      { type: "uint256", name: "_tokenId", internalType: "uint256" },
      {
        type: "tuple",
        name: "_input",
        internalType: "struct JaothuiRewardManager.InputReward",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "uint256", name: "microchip", internalType: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "addRewardBatch",
    inputs: [
      { type: "uint256[]", name: "_tokenIds", internalType: "uint256[]" },
      {
        type: "tuple[]",
        name: "_inputs",
        internalType: "struct JaothuiRewardManager.InputReward[]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "uint256", name: "microchip", internalType: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "addRewardBatchOf",
    inputs: [
      { type: "uint256", name: "_tokenId", internalType: "uint256" },
      {
        type: "tuple[]",
        name: "_inputs",
        internalType: "struct JaothuiRewardManager.InputReward[]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "uint256", name: "microchip", internalType: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      {
        type: "tuple[][]",
        name: "",
        internalType: "struct JaothuiRewardManager.REWARD[][]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "bool", name: "active", internalType: "bool" },
          { type: "uint256", name: "createdAt", internalType: "uint256" },
        ],
      },
    ],
    name: "getAllReward",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      {
        type: "tuple[]",
        name: "",
        internalType: "struct JaothuiRewardManager.REWARD[]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "bool", name: "active", internalType: "bool" },
          { type: "uint256", name: "createdAt", internalType: "uint256" },
        ],
      },
    ],
    name: "getReward",
    inputs: [{ type: "uint256", name: "_tokenId", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      {
        type: "tuple[]",
        name: "",
        internalType: "struct JaothuiRewardManager.REWARD[]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "bool", name: "active", internalType: "bool" },
          { type: "uint256", name: "createdAt", internalType: "uint256" },
        ],
      },
    ],
    name: "getRewardByMicrochip",
    inputs: [{ type: "uint256", name: "_microchip", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      {
        type: "tuple[][]",
        name: "",
        internalType: "struct JaothuiRewardManager.REWARD[][]",
        components: [
          { type: "string", name: "rewardUri", internalType: "string" },
          { type: "bool", name: "active", internalType: "bool" },
          { type: "uint256", name: "createdAt", internalType: "uint256" },
        ],
      },
    ],
    name: "getRewardOf",
    inputs: [{ type: "address", name: "_owner", internalType: "address" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bytes32", name: "", internalType: "bytes32" }],
    name: "getRoleAdmin",
    inputs: [{ type: "bytes32", name: "role", internalType: "bytes32" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "grantRole",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32" },
      { type: "address", name: "account", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bool", name: "", internalType: "bool" }],
    name: "hasRole",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32" },
      { type: "address", name: "account", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "history",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bool", name: "", internalType: "bool" }],
    name: "initialized",
    inputs: [{ type: "uint256", name: "", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "jaothui",
    inputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
    name: "microchipToTokenId",
    inputs: [{ type: "uint256", name: "", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "renounceRole",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32" },
      { type: "address", name: "account", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "revokeRole",
    inputs: [
      { type: "bytes32", name: "role", internalType: "bytes32" },
      { type: "address", name: "account", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "setActive",
    inputs: [
      { type: "uint256", name: "_tokenId", internalType: "uint256" },
      { type: "uint256", name: "_index", internalType: "uint256" },
      { type: "uint256", name: "_rewardIndex", internalType: "uint256" },
      { type: "bool", name: "_value", internalType: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "setHistory",
    inputs: [{ type: "address", name: "_history", internalType: "address" }],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "setJaothuiAddress",
    inputs: [
      { type: "address", name: "_jaothuiAddr", internalType: "address" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    outputs: [],
    name: "setUninitialize",
    inputs: [{ type: "uint256", name: "_tokenId", internalType: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "bool", name: "", internalType: "bool" }],
    name: "supportsInterface",
    inputs: [{ type: "bytes4", name: "interfaceId", internalType: "bytes4" }],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [
      { type: "string", name: "rewardUri", internalType: "string" },
      { type: "bool", name: "active", internalType: "bool" },
      { type: "uint256", name: "createdAt", internalType: "uint256" },
    ],
    name: "tokenIdToReward",
    inputs: [
      { type: "uint256", name: "", internalType: "uint256" },
      { type: "uint256", name: "", internalType: "uint256" },
    ],
  },
  {
    type: "function",
    stateMutability: "view",
    outputs: [{ type: "uint256", name: "", internalType: "uint256" }],
    name: "totalReward",
    inputs: [],
  },
];
