/**
 * Self-contained inline tipping engine.
 *
 * Framework-agnostic: a plain factory used by both the React
 * `TipParagraphsInline` component and the vanilla `<tipitip-paragraphs>`
 * web component. It owns the entire on-chain flow with nothing but viem
 * and an injected EIP-1193 provider, so it works on any host page
 * (WordPress, Ghost, plain HTML, a React app) without wagmi.
 *
 * Flow on each tip:
 *   1. allowance(reader, tipJar) < amount  ->  approve(tipJar, PRE_APPROVE)
 *      and wait. One extra tx, once per reader per article-set.
 *   2. tipParagraph(articleId, paragraphKey, amount) and wait.
 *
 * Inside MiniPay, both txs carry `feeCurrency: cUSD` so gas is paid in
 * the stablecoin the wallet actually holds (CIP-64 fee abstraction).
 * Regular EVM wallets must NOT receive `feeCurrency`, so the override is
 * applied only when MiniPay is detected.
 */
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  type Hex,
} from "viem";
import { celo, celoSepolia } from "viem/chains";

import { erc20Abi, tipJarAbi } from "./abi.js";
import {
  CELO_MAINNET,
  CHAIN_CONFIG,
  isSupportedChainId,
  type SupportedChainId,
} from "./chain.js";

export type { SupportedChainId } from "./chain.js";

/** Minimal shape of an injected EIP-1193 provider. */
interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  isMiniPay?: boolean;
}

export type TipStatus =
  | { kind: "idle" }
  | { kind: "connecting" }
  | { kind: "approving"; txHash?: Hex }
  | { kind: "tipping"; txHash?: Hex }
  | { kind: "success"; txHash: Hex }
  | { kind: "error"; message: string };

export interface TipEngineConfig {
  /** Celo Mainnet (42220, default) or Celo Sepolia (11142220). */
  chainId?: SupportedChainId;
  /** Override the TipJar proxy address (staging / fork / redeploy). */
  tipJarAddress?: Hex;
  /** Override the cUSD token address. */
  cusdAddress?: Hex;
  /** Override the read RPC endpoint. */
  rpcUrl?: string;
  /** Allowance pre-approved on first tip, in whole cUSD. Default "100". */
  preApproveCusd?: string;
}

export interface TipParams {
  articleId: Hex;
  paragraphKey: Hex;
  amountWei: bigint;
  /** Lifecycle callback for UI (button states, toasts). */
  onStatus?: (status: TipStatus) => void;
}

export interface TipEngine {
  readonly chainId: SupportedChainId;
  /** True if an injected EIP-1193 provider is present on the page. */
  hasProvider(): boolean;
  /** True when running inside the MiniPay wallet webview. */
  isMiniPay(): boolean;
  /** Connected reader address, or null before connect(). */
  getAddress(): Hex | null;
  /** Prompt the wallet for account access. Returns the reader address. */
  connect(): Promise<Hex>;
  /** Run the allowance + tip flow for one paragraph. */
  tip(params: TipParams): Promise<{ approveTx?: Hex; tipTx: Hex }>;
}

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
}

function detectMiniPay(provider: Eip1193Provider | null): boolean {
  if (provider?.isMiniPay) return true;
  if (typeof navigator === "undefined") return false;
  return /MiniPay/i.test(navigator.userAgent);
}

export function hasInjectedProvider(): boolean {
  return getInjectedProvider() !== null;
}

export function createTipEngine(config: TipEngineConfig = {}): TipEngine {
  const chainId: SupportedChainId =
    config.chainId && isSupportedChainId(config.chainId)
      ? config.chainId
      : CELO_MAINNET;

  const defaults = CHAIN_CONFIG[chainId];
  const tipJar = config.tipJarAddress ?? defaults.tipJar;
  const cusd = config.cusdAddress ?? defaults.cUSD;
  const rpcUrl = config.rpcUrl ?? defaults.rpcUrl;
  const preApprove = parseUnits(config.preApproveCusd ?? "100", 18);
  const viemChain = chainId === CELO_MAINNET ? celo : celoSepolia;

  const publicClient = createPublicClient({
    chain: viemChain,
    transport: http(rpcUrl),
  });

  let address: Hex | null = null;

  function provider(): Eip1193Provider {
    const p = getInjectedProvider();
    if (!p) {
      throw new Error(
        "No wallet found. Open this page in MiniPay or a Celo-compatible wallet.",
      );
    }
    return p;
  }

  function walletClient() {
    return createWalletClient({
      chain: viemChain,
      transport: custom(provider()),
    });
  }

  // MiniPay pays gas in cUSD (CIP-64). Other wallets reject feeCurrency,
  // so it is applied only inside MiniPay.
  function feeOverride(): { feeCurrency?: Hex } {
    return detectMiniPay(getInjectedProvider()) ? { feeCurrency: cusd } : {};
  }

  return {
    chainId,
    hasProvider: () => hasInjectedProvider(),
    isMiniPay: () => detectMiniPay(getInjectedProvider()),
    getAddress: () => address,

    async connect(): Promise<Hex> {
      const [addr] = await walletClient().requestAddresses();
      if (!addr) throw new Error("Wallet returned no account.");
      address = addr;
      return addr;
    },

    async tip({ articleId, paragraphKey, amountWei, onStatus }: TipParams) {
      const emit = (s: TipStatus) => onStatus?.(s);
      if (amountWei <= 0n) throw new Error("Tip amount must be positive.");

      try {
        if (!address) {
          emit({ kind: "connecting" });
          await this.connect();
        }
        const reader = address as Hex;
        const wallet = walletClient();
        const fee = feeOverride();

        const allowance = (await publicClient.readContract({
          address: cusd,
          abi: erc20Abi,
          functionName: "allowance",
          args: [reader, tipJar],
        })) as bigint;

        let approveTx: Hex | undefined;
        if (allowance < amountWei) {
          const approveAmount = preApprove > amountWei ? preApprove : amountWei;
          emit({ kind: "approving" });
          approveTx = await wallet.writeContract({
            account: reader,
            chain: viemChain,
            address: cusd,
            abi: erc20Abi,
            functionName: "approve",
            args: [tipJar, approveAmount],
            ...fee,
          });
          emit({ kind: "approving", txHash: approveTx });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
        }

        emit({ kind: "tipping" });
        const tipTx = await wallet.writeContract({
          account: reader,
          chain: viemChain,
          address: tipJar,
          abi: tipJarAbi,
          functionName: "tipParagraph",
          args: [articleId, paragraphKey, amountWei],
          ...fee,
        });
        emit({ kind: "tipping", txHash: tipTx });
        await publicClient.waitForTransactionReceipt({ hash: tipTx });
        emit({ kind: "success", txHash: tipTx });

        return { approveTx, tipTx };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message.split("\n")[0] : "Transaction failed.";
        emit({ kind: "error", message });
        throw err instanceof Error ? err : new Error(message);
      }
    },
  };
}
