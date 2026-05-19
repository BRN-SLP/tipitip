# Long-context models broke citations. Here is what is replacing them.

The thing that broke first was the link. You used to drop a URL at the end of a sentence and the link did the verification work. The reader could click. Now the reader is just as likely to ask a model what the link says, and the model is just as likely to make something up that sounds right.

The thing that broke second was the quote. With long-context models, every claim can be sourced and every source can be hallucinated. The honest writers add citations and the dishonest writers add citations and a reader can no longer tell which is which without doing the verification themselves.

What replaces them, as far as I can see, is content addressing. A paragraph gets a cryptographic hash. The hash is on-chain, dated and signed by an author. When a reader sees a claim that references hash 0xabc..., they can verify two things: that the paragraph existed at the time it claims to have existed, and that nobody has edited it since.

This is not a new idea. Merkle trees, IPFS, Arweave, every content-addressed system in the stack has been making the same argument for a decade. The new ingredient is that the unit is now small enough to matter. You used to commit an entire document. Now you commit a paragraph. The verification surface dropped by two orders of magnitude.

If you are reading this on a platform that hashes each paragraph and signs the article hash to chain, you are already using the replacement. If you are not, you are reading a writer's reputation for honesty, which is worth more than it used to be.
