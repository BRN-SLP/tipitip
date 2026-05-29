/**
 * `<tipitip-paragraphs>` custom element.
 *
 * A zero-React, single-import way to drop inline per-paragraph cUSD
 * tipping onto any site (WordPress, Ghost, plain HTML). Wraps the same
 * framework-agnostic viem `tip-engine` the React inline component uses,
 * so behaviour stays identical across form factors.
 *
 * Usage:
 *   <script type="module" src="https://esm.sh/@tipitip/embed/vanilla"></script>
 *   <tipitip-paragraphs
 *     article-id="0x..."
 *     tip-amount="0.005"
 *     chain-id="42220"></tipitip-paragraphs>
 *
 * Attributes:
 *   article-id     (required) 32-byte hex article id
 *   base-url       TipiTip API origin (default production)
 *   chain-id       42220 (default) | 11142220
 *   tip-amount     whole cUSD per tap (default "0.005")
 *   poll-interval  stats refresh ms (default "30000", "0" disables)
 */
import { parseUnits, type Hex } from "viem";

import { splitParagraphs } from "./markdown.js";
import { renderInlineMarkdown } from "./markdown-inline.js";
import { deriveParagraphKey } from "./paragraph-key.js";
import { createTipEngine, type SupportedChainId } from "./tip-engine.js";

const DEFAULT_BASE_URL = "https://tipitip-sable.vercel.app";

interface TipStats {
  count: number;
  total: string;
}

function formatCusd(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    if (wei === 0n) return "0";
    const scale = 10n ** 18n;
    const whole = wei / scale;
    const frac = (wei % scale)
      .toString()
      .padStart(18, "0")
      .slice(0, 4)
      .replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole.toString();
  } catch {
    return "0";
  }
}

/** Standard preset amounts, matching the canonical reader + React embed. */
const PRESETS = [0.001, 0.005, 0.01, 0.05];
/** Largest single custom tip (fat-finger guard; one-shot revert is the
 *  real safety). */
const MAX_CUSTOM_CUSD = 100;

class TipitipParagraphs extends HTMLElement {
  private engine: ReturnType<typeof createTipEngine> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private stats: Record<string, TipStats> = {};
  private paragraphs: string[] = [];
  private optimistic: Record<number, number> = {};
  private address: Hex | null = null;
  private root: ShadowRoot;
  // Active tip amount + the last preset to revert to. A custom amount is
  // one-shot: it fires once then snaps back to lastPreset, so it can never
  // silently repeat on the next tap.
  private amount = 0.005;
  private lastPreset = 0.005;
  private customOpen = false;
  private customText = "";

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
  }

  private attr(name: string, fallback = ""): string {
    return this.getAttribute(name) ?? fallback;
  }

  private get articleId(): Hex {
    return this.attr("article-id") as Hex;
  }
  private get baseUrl(): string {
    return this.attr("base-url", DEFAULT_BASE_URL).replace(/\/+$/, "");
  }
  private get chainId(): SupportedChainId {
    return Number(this.attr("chain-id", "42220")) === 11142220
      ? 11142220
      : 42220;
  }
  private get tipAmount(): number {
    const n = Number(this.attr("tip-amount", "0.005"));
    return Number.isFinite(n) && n > 0 ? n : 0.005;
  }
  private get pollInterval(): number {
    const n = Number(this.attr("poll-interval", "30000"));
    return Number.isFinite(n) ? n : 30000;
  }

  connectedCallback(): void {
    if (!this.articleId) {
      this.root.innerHTML = `<p style="color:#b91c1c;font-size:14px">tipitip-paragraphs: missing article-id</p>`;
      return;
    }
    this.engine = createTipEngine({ chainId: this.chainId });
    this.amount = this.tipAmount;
    this.lastPreset = this.tipAmount;
    this.renderShell("Loading article…");
    void this.loadBody();
    void this.pullStats();
    if (this.pollInterval > 0) {
      this.timer = setInterval(() => void this.pullStats(), this.pollInterval);
    }
  }

  disconnectedCallback(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async loadBody(): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/api/articles/${this.articleId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      this.paragraphs = splitParagraphs(text);
      this.render();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "load failed";
      this.root.innerHTML = `<p style="color:#b91c1c;font-size:14px">Failed to load article: ${msg}</p>`;
    }
  }

  private async pullStats(): Promise<void> {
    try {
      const res = await fetch(
        `${this.baseUrl}/api/tip-stats/${this.articleId}?chainId=${this.chainId}`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as {
        paragraphs?: Record<string, TipStats>;
      };
      this.stats = json.paragraphs ?? {};
      // Don't wipe an open custom input mid-typing on a background poll.
      if (this.paragraphs.length && !this.customOpen) this.render();
    } catch {
      // keep last good stats
    }
  }

  private async connect(): Promise<Hex> {
    if (!this.engine) throw new Error("engine not ready");
    if (this.address) return this.address;
    const addr = await this.engine.connect();
    this.address = addr;
    this.render();
    return addr;
  }

  private submitCustom(): void {
    const raw = this.customText.trim().replace(/^\$/, "").replace(",", ".");
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0 || n > MAX_CUSTOM_CUSD) return;
    this.amount = n; // not lastPreset — custom is one-shot
    this.customOpen = false;
    this.customText = "";
    this.render();
  }

  private async onTip(index: number, text: string): Promise<void> {
    if (!this.engine) return;
    // Capture the fired amount BEFORE reverting a one-shot custom.
    const firedAmount = this.amount;
    const amountWei = parseUnits(String(firedAmount), 18);
    this.optimistic[index] = (this.optimistic[index] ?? 0) + 1;
    if (!PRESETS.includes(firedAmount)) this.amount = this.lastPreset;
    this.render();
    try {
      await this.connect();
      const paragraphKey = deriveParagraphKey(this.articleId, index, text);
      await this.engine.tip({ articleId: this.articleId, paragraphKey, amountWei });
      void this.pullStats();
    } catch {
      this.optimistic[index] = Math.max(0, (this.optimistic[index] ?? 1) - 1);
      this.render();
    }
  }

  private renderShell(message: string): void {
    this.root.innerHTML = `<p style="opacity:0.6;font-size:14px;font-family:system-ui,sans-serif">${message}</p>`;
  }

  private render(): void {
    const addrLabel = this.address
      ? `<span style="font-size:12px;color:#16a34a">&#9830; ${this.address.slice(0, 6)}&hellip;${this.address.slice(-4)}</span>`
      : `<button data-act="connect" style="padding:5px 12px;font-size:12px;font-weight:600;border-radius:999px;cursor:pointer;border:1px solid #dc2626;background:#dc2626;color:#fff">Connect wallet</button>`;

    const blocks = this.paragraphs
      .map((text, i) => {
        const base = this.stats[String(i)]?.count ?? 0;
        const count = base + (this.optimistic[i] ?? 0);
        const total = this.stats[String(i)]
          ? formatCusd(this.stats[String(i)]!.total)
          : "0";
        const label = `${count} ${count === 1 ? "tip" : "tips"}${count > 0 ? ` &middot; ${total} cUSD` : ""}`;
        return `
          <section style="margin:0 0 1.25rem 0">
            <div style="margin-bottom:0.5rem">${renderInlineMarkdown(text)}</div>
            <button data-act="tip" data-index="${i}"
              title="Tip $${this.amount} cUSD"
              style="display:inline-flex;align-items:center;gap:8px;padding:4px 10px;font-size:12px;color:#52525b;cursor:pointer;background:transparent;border:1px solid #e4e4e7;border-radius:999px">
              <span aria-hidden="true" style="color:#dc2626">&hearts;</span>
              <span>${label}</span>
            </button>
          </section>`;
      })
      .join("");

    this.root.innerHTML = `
      <article style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.65">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:1.25rem;padding-bottom:0.75rem;border-bottom:1px solid #e4e4e7">
          ${this.renderSelector()}
          ${addrLabel}
        </div>
        ${blocks}
        <p style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #e4e4e7;font-size:11px;color:#71717a;text-align:right">
          <a href="${this.baseUrl}/a/${this.articleId}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline">Powered by TipiTip &rarr;</a>
        </p>
      </article>`;

    this.root.querySelector('[data-act="connect"]')?.addEventListener(
      "click",
      () => void this.connect(),
    );
    this.root.querySelectorAll('[data-act="tip"]').forEach((el) => {
      el.addEventListener("click", () => {
        const idx = Number((el as HTMLElement).dataset.index);
        void this.onTip(idx, this.paragraphs[idx] ?? "");
      });
    });

    // Amount selector wiring.
    this.root.querySelectorAll('[data-act="preset"]').forEach((el) => {
      el.addEventListener("click", () => {
        const a = Number((el as HTMLElement).dataset.amt);
        this.amount = a;
        this.lastPreset = a;
        this.customOpen = false;
        this.render();
      });
    });
    this.root
      .querySelector('[data-act="custom-open"]')
      ?.addEventListener("click", () => {
        this.customOpen = true;
        this.render();
      });
    this.root
      .querySelector('[data-act="custom-submit"]')
      ?.addEventListener("click", () => this.submitCustom());
    const input = this.root.querySelector(
      '[data-act="custom-input"]',
    ) as HTMLInputElement | null;
    if (input) {
      input.addEventListener("input", (e) => {
        this.customText = (e.target as HTMLInputElement).value;
      });
      input.addEventListener("keydown", (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === "Enter") this.submitCustom();
        if (k === "Escape") {
          this.customOpen = false;
          this.customText = "";
          this.render();
        }
      });
      input.focus();
    }
  }

  private renderSelector(): string {
    const chip = (label: string, active: boolean, attrs: string): string =>
      `<button ${attrs} style="padding:4px 10px;font-size:12px;border-radius:999px;cursor:pointer;border:1px solid ${
        active ? "#dc2626" : "#e4e4e7"
      };background:${active ? "#fef2f2" : "transparent"};color:${
        active ? "#dc2626" : "#52525b"
      }">${label}</button>`;
    const customActive = !PRESETS.includes(this.amount);
    const presets = PRESETS.map((a) =>
      chip(`$${a}`, a === this.amount, `data-act="preset" data-amt="${a}"`),
    ).join("");
    const customPart = this.customOpen
      ? `<span style="display:inline-flex;align-items:center;gap:4px"><span style="font-size:12px;color:#52525b">$</span><input data-act="custom-input" type="text" inputmode="decimal" value="${this.customText}" placeholder="0.25" aria-label="Custom tip amount in cUSD" style="width:56px;font-size:12px;padding:4px 6px;border-radius:6px;border:1px solid #e4e4e7;outline:none" />${chip("&check;", false, 'data-act="custom-submit"')}</span>`
      : chip(
          customActive ? `$${this.amount}` : "Custom",
          customActive,
          'data-act="custom-open"',
        );
    return `<div style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap">${presets}${customPart}</div>`;
  }
}

/** Register the element once, guarding against double-definition. */
export function defineTipitipParagraphs(): void {
  if (typeof window === "undefined" || !("customElements" in window)) return;
  if (!customElements.get("tipitip-paragraphs")) {
    customElements.define("tipitip-paragraphs", TipitipParagraphs);
  }
}
