# Celo for content creators: cUSD as gas, micro-tips as income

On Ethereum, sending one cent costs fifty cents. That sentence ended the micropayment dream on mainnet a decade ago, and rollups have only partially walked it back — even the cheapest L2 tip is still a measurable fraction of the tip itself.

Celo solves the problem differently. Gas on Celo is sub-cent, and gas can be paid in cUSD — the same stablecoin you are tipping with. There is no second token to fund, no bridge, no "first buy CELO, then buy cUSD, then…". The wallet just transacts in the currency the user thinks in.

For writers, the implication is that 100% of a 1-cent tip is income. After Celo's tiny gas overhead, a one-cent tip leaves the reader and lands in the writer's wallet at roughly 99% efficiency. Compare to Patreon: 5% platform fee, plus Stripe's 2.9% plus 30¢. On a one-dollar tip, Patreon keeps eight cents. On a one-cent tip, Patreon refuses the transaction.

The code is a single line:

```ts
await tipJar.write.tipParagraph([articleId, paragraphKey, amount]);
```

`articleId` and `paragraphKey` are deterministic hashes — the same inputs always produce the same key — so the contract does not store article content. It only records that 1¢ moved from this reader to this writer for this specific paragraph. The markdown lives off-chain; the receipt lives on-chain.

The distribution angle is MiniPay. Opera Mini ships with a cUSD wallet preinstalled for users across Kenya, Nigeria, Ghana, South Africa, and a dozen other markets. That is roughly eight million wallets that already hold cUSD, already pay gas in cUSD, and already trust the brand. A writer in Nairobi tipped a cent by a reader in Lagos is not an exotic case on this stack. It is the default case.

If you write, you can publish here in 60 seconds and start earning per-paragraph. If you read, you can support a writer for the price of approximately nothing. The unit was always the paragraph. The currency was always going to be a stablecoin. Celo just finished the sentence.
