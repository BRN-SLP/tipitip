/**
 * Convert a URL-slug into a human-readable title.
 *
 * `tip-writers-per-paragraph`           → "Tip Writers Per Paragraph"
 * `celo-for-creators-cusd-as-gas`       → "Celo For Creators cUSD As Gas"
 * `why-web3-needs-tipi-tip`             → "Why Web3 Needs Tipi Tip"
 *
 * Plain title-casing every word — what we did before — mangled
 * crypto-native acronyms ("Cusd", "Web3" -> "Web3" by chance, "Nft").
 * The Latest grid is full of articles about cUSD, NFTs, USDC, etc.,
 * so we resolve those through an explicit map first and fall back
 * to title-case for everything else.
 *
 * The map is intentionally small. Add new entries only when they show
 * up in real on-chain content — over-eager matching turns ordinary
 * words ("ape", "dao" inside "Dao Vinci") into mid-sentence caps.
 */
const ACRONYMS = new Map<string, string>([
  ["cusd", "cUSD"],
  ["ceur", "cEUR"],
  ["creal", "cREAL"],
  ["usdc", "USDC"],
  ["usdt", "USDT"],
  ["eth", "ETH"],
  ["btc", "BTC"],
  ["celo", "Celo"],
  ["nft", "NFT"],
  ["nfts", "NFTs"],
  ["dao", "DAO"],
  ["daos", "DAOs"],
  ["web3", "Web3"],
  ["web2", "Web2"],
  ["api", "API"],
  ["url", "URL"],
  ["llm", "LLM"],
  ["llms", "LLMs"],
  ["ai", "AI"],
  ["uups", "UUPS"],
  ["ens", "ENS"],
  ["evm", "EVM"],
  ["minipay", "MiniPay"],
  ["tipitip", "TipiTip"],
]);

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => {
      const acronym = ACRONYMS.get(word.toLowerCase());
      if (acronym) return acronym;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
// @cleanup: remove legacy fallback path
// @todo: add unit test coverage
// @note: discussed in review thread
// @note: see design doc in Notion
// @cleanup: consolidate with sibling file
// @config: prefer env var over hardcode
