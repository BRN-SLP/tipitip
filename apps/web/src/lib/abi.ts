/**
 * On-chain interface for the deployed TipJar UUPS proxy. Trimmed to the
 * surface the dApp uses (register / tip / claim / read) — full ABI lives
 * in the contracts artifacts and is the source of truth for any debugging.
 */
export const tipJarAbi = [
  {
    type: "function",
    name: "registerArticle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "articleId", type: "bytes32" },
      { name: "contentHash", type: "bytes32" },
      { name: "slug", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "tipParagraph",
    stateMutability: "nonpayable",
    inputs: [
      { name: "articleId", type: "bytes32" },
      { name: "paragraphKey", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "claimEarnings",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingOf",
    stateMutability: "view",
    inputs: [{ name: "author", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V2 (post-fee upgrade): protocol fee in basis points (250 = 2.5%).
    // Reverts on the pre-upgrade V1 implementation; callers treat that as 0.
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
  {
    // V3 (on-chain support upgrade): record a free, gas-only endorsement with an
    // optional short message. Reverts on the pre-upgrade implementation.
    type: "function",
    name: "support",
    stateMutability: "nonpayable",
    inputs: [{ name: "message", type: "string" }],
    outputs: [],
  },
  {
    // V3: distinct wallets that have ever supported. Reverts pre-upgrade;
    // callers treat a revert as "support not live yet".
    type: "function",
    name: "uniqueSupporters",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V3: total support signals (counts repeat supports).
    type: "function",
    name: "supportCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    // V3: whether an address has ever recorded support.
    type: "function",
    name: "hasSupported",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "articleAuthor",
    stateMutability: "view",
    inputs: [{ name: "", type: "bytes32" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "cUSD",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "ArticleRegistered",
    inputs: [
      { name: "articleId", type: "bytes32", indexed: true },
      { name: "author", type: "address", indexed: true },
      { name: "contentHash", type: "bytes32", indexed: false },
      { name: "slug", type: "string", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Tipped",
    inputs: [
      { name: "articleId", type: "bytes32", indexed: true },
      { name: "paragraphKey", type: "bytes32", indexed: true },
      { name: "tipper", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "author", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Supported",
    inputs: [
      { name: "supporter", type: "address", indexed: true },
      { name: "message", type: "string", indexed: false },
      { name: "at", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

/** Minimal ERC-20 ABI for cUSD approve / allowance / balance reads. */
export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

/** ABI for the standalone TipiTipSupport endorsement counter (no funds). */
export const supportContractAbi = [
  {
    type: "function",
    name: "support",
    stateMutability: "nonpayable",
    inputs: [{ name: "message", type: "string" }],
    outputs: [],
  },
  {
    type: "function",
    name: "uniqueSupporters",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "supportCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "hasSupported",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Supported",
    inputs: [
      { name: "supporter", type: "address", indexed: true },
      { name: "message", type: "string", indexed: false },
      { name: "at", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

/** ABI for the TipiTipVault treasury (donate now; claim is parked for later). */
export const vaultAbi = [
  {
    type: "function",
    name: "donate",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "unallocatedBalance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "event",
    name: "Donated",
    inputs: [
      { name: "donor", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;
// @edge: test with maximum input length
// @perf: monitor allocation pattern here
// @a11y: check contrast ratio here
// @cleanup: remove legacy fallback path
// @todo: add unit test coverage
// @i18n: support right-to-left layout
