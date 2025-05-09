import { AnchorProvider, Program, Wallet, web3, BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PublicKey } from "@solana/web3.js";

import escrowIdl from "./escrow.json";
import { Escrow } from "./idlType";
import { config } from "./config";
import { randomBytes } from "crypto";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

export class EscrowProgram {
  protected program: Program<Escrow>;
  protected connection: web3.Connection;
  protected wallet: NodeWallet;

  constructor(connection: web3.Connection, wallet: Wallet) {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    this.program = new Program<Escrow>(escrowIdl as Escrow, provider);
    this.wallet = wallet;
    this.connection = connection;
  }

  private async getTokenProgramId(mint: PublicKey): Promise<PublicKey> {
    const accountInfo = await this.connection.getAccountInfo(mint);
    if (!accountInfo) {
      throw new Error(`Mint account not found: ${mint.toBase58()}`);
    }
    return accountInfo.owner;
  }

  createOfferId = (offerId: BN) => {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("offer"),
        this.wallet.publicKey.toBuffer(),
        offerId.toArrayLike(Buffer, "le", 8),
      ],
      new PublicKey(config.contractAddress)
    )[0];
  };

  async makeOffer(
    tokenMintA: PublicKey,
    tokenMintB: PublicKey,
    tokenAmountA: number,
    tokenAmountB: number
  ) {
    const offerId = new BN(randomBytes(8));
    const offerAddress = this.createOfferId(offerId);

    const programIdA = await this.getTokenProgramId(tokenMintA);
    const programIdB = await this.getTokenProgramId(tokenMintB);
    if (!programIdA.equals(programIdB)) {
      throw new Error(
        `Token program mismatch: ${programIdA.toBase58()} vs ${programIdB.toBase58()}`
      );
    }
    const tokenProgramId = programIdA;

    const vault = getAssociatedTokenAddressSync(
      tokenMintA,
      offerAddress,
      true,
      tokenProgramId
    );

    const makerTokenAccountA = getAssociatedTokenAddressSync(
      tokenMintA,
      this.wallet.publicKey,
      true,
      tokenProgramId
    );

    const makerTokenAccountB = getAssociatedTokenAddressSync(
      tokenMintB,
      this.wallet.publicKey,
      true,
      tokenProgramId
    );

    const accounts = {
      maker: this.wallet.publicKey,
      offer: offerAddress,
      tokenMintA: tokenMintA,
      tokenMintB: tokenMintB,
      makerTokenAccountA: makerTokenAccountA,
      makerTokenAccountB: makerTokenAccountB,
      vault: vault,
      tokenProgram: tokenProgramId,
    };

    const txInstruction = await this.program.methods
      .makeOffer(offerId, new BN(tokenAmountA), new BN(tokenAmountB))
      .accounts(accounts)
      .instruction();

    const messageV0 = new web3.TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions: [txInstruction],
    }).compileToV0Message();

    const versionedTransaction = new web3.VersionedTransaction(messageV0);

    if (!this.program.provider.sendAndConfirm) return;

    try {
      const response = await this.program.provider.sendAndConfirm(
        versionedTransaction
      );

      if (!this.program.provider.publicKey) return;

      return response;
    } catch (e) {
      console.log(e);
    }
  }

  async takeOffer(
    maker: PublicKey,
    offer: PublicKey,
    tokenMintA: PublicKey,
    tokenMintB: PublicKey
  ) {
    const programIdA = await this.getTokenProgramId(tokenMintA);
    const programIdB = await this.getTokenProgramId(tokenMintB);
    if (!programIdA.equals(programIdB)) {
      throw new Error(
        `Token program mismatch: ${programIdA.toBase58()} vs ${programIdB.toBase58()}`
      );
    }
    const tokenProgramId = programIdA;

    const takerTokenAccountA = getAssociatedTokenAddressSync(
      tokenMintA,
      this.wallet.publicKey,
      true,
      tokenProgramId
    );

    const takerTokenAccountB = getAssociatedTokenAddressSync(
      tokenMintB,
      this.wallet.publicKey,
      true,
      tokenProgramId
    );

    const makerTokenAccountB = getAssociatedTokenAddressSync(
      tokenMintB,
      maker,
      true,
      tokenProgramId
    );

    const valult = getAssociatedTokenAddressSync(
      tokenMintA,
      offer,
      true,
      tokenProgramId
    );

    const accounts = {
      taker: this.wallet.publicKey,
      maker: maker,
      offer: offer,
      tokenMintA: tokenMintA,
      tokenMintB: tokenMintB,
      takerTokenAccountA: takerTokenAccountA,
      takerTokenAccountB: takerTokenAccountB,
      makerTokenAccountB: makerTokenAccountB,
      vault: valult,
      tokenProgram: tokenProgramId,
    };

    const txInstruction = await this.program.methods
      .takeOffer()
      .accounts(accounts)
      .instruction();

    const messageV0 = new web3.TransactionMessage({
      payerKey: this.wallet.publicKey,
      recentBlockhash: (await this.connection.getLatestBlockhash()).blockhash,
      instructions: [txInstruction],
    }).compileToV0Message();

    const versionedTransaction = new web3.VersionedTransaction(messageV0);

    if (!this.program.provider.sendAndConfirm) return;

    try {
      const response = await this.program.provider.sendAndConfirm(
        versionedTransaction
      );

      if (!this.program.provider.publicKey) return;

      return response;
    } catch (e) {
      console.log(e);
    }
  }
}
