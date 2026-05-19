# What sub-cent gas actually unlocks

Most chains brag about throughput. Solana is fast. Base is cheap-ish. Arbitrum has its niche. The number every benchmark optimises for is transactions per second, which is the wrong number if what you actually want is to send a tiny amount of money.

Here is what changes when gas drops below one cent and you can pay it in the same stablecoin you are sending. You stop pre-approving large allowances because you no longer have to amortise the cost of a single transfer. You stop batching because batching only mattered when each tx cost more than the thing you were paying for. You stop telling users about gas at all because the fee is small enough to be invisible.

This is the unlock that Celo's fee abstraction quietly shipped. cUSD as gas means a person who has only ever held cUSD can send cUSD, full stop. They do not need a separate native token to pay for the privilege of moving their stablecoin. On most other chains this is still a multi-step ceremony. Here it is one tx.

The applications that benefit from this are the small ones. Per-paragraph tipping. Pay-as-you-read articles. Tipping in chat. Splitting a bill in stablecoins between four people without making three of them swap into gas first. None of these are exciting in the abstract. All of them stop being annoying when the friction drops to zero.

The boring infrastructure work matters because eventually the application layer can stop apologising for the chain.
