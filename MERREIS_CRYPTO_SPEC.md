# MerreisCoin Testnet Spec

MerreisCoin is a sandbox ERC-20 prototype for Tazzo Strike. It is not enabled for real-money gameplay, has no promised market value, and should stay on testnet until legal, tokenomics, security, and store-policy reviews are complete.

## Current Decision

- Network target: Base Sepolia by default.
- Chain ID: `84532`.
- RPC default: `https://sepolia.base.org`.
- Token name: `MerreisCoin`.
- Symbol: `MER`.
- Decimals: `0` by default, so `1 MER` maps cleanly to `1 Merreis` in game UI experiments.
- Supply model: capped mint controlled by the owner account.
- Transferability: normal ERC-20 behavior on testnet.
- Game economy: Merreis in the game remains off-chain for now.

## What This First Implementation Does

- Adds `contracts/MerreisCoin.sol`.
- Adds compile/deploy/mint scripts under `tools/crypto/`.
- Adds `/api/crypto/config`, which only exposes public sandbox metadata.
- Adds a read-only shop panel that shows whether MerreisCoin testnet is configured.

## What It Does Not Do Yet

- No real crypto checkout.
- No automatic conversion from MER to in-game Merreis.
- No wallet custody by the server.
- No public mainnet deployment.
- No NFT/token marketplace behavior.

## Setup

Create `.env.crypto.local` and set:

```env
MERREISCOIN_NETWORK=base-sepolia
MERREISCOIN_CHAIN_ID=84532
MERREISCOIN_RPC_URL=https://sepolia.base.org
MERREISCOIN_EXPLORER_URL=https://sepolia.basescan.org
MERREISCOIN_DECIMALS=0
MERREISCOIN_MAX_SUPPLY=1000000000
MERREISCOIN_DEPLOYER_PRIVATE_KEY=never_commit_this
```

Check the RPC, wallet, and testnet ETH balance:

```powershell
npm.cmd run crypto:check
```

Then deploy:

```powershell
npm.cmd run crypto:compile
npm.cmd run crypto:deploy
```

After deploy, activate the public contract config locally:

```powershell
npm.cmd run crypto:activate
npm.cmd run crypto:check
```

The activation script updates `.env.crypto.local`, which is ignored by git. Restart the server after activation.

## Minting Test Tokens

```env
MERREISCOIN_CONTRACT_ADDRESS=0x...
MERREISCOIN_MINT_TO=0xRecipient
MERREISCOIN_MINT_AMOUNT=1000
MERREISCOIN_MINT_REASON=qa test grant
```

```powershell
npm.cmd run crypto:mint
```

## Production Gate

Before any public or mainnet release:

- Legal review for Brazilian cryptoasset, consumer, payments, and gambling/lootbox risk.
- Contract audit or at least independent security review.
- Multisig owner instead of a single private key.
- Clear terms saying the token is not an investment product.
- App-store policy review if mobile distribution is planned.
