import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { loadKey } from "../utils/load-key";

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const fromWallet = loadKey("PRIVATE_KEY_2");
  const toWallet = loadKey("PRIVATE_KEY_3");

  console.log("From wallet public key:", fromWallet.publicKey.toBase58());
  console.log("To wallet public key:", toWallet.publicKey.toBase58());

  const mint = new PublicKey("CJ7iYHEvXoWZv26WiBhNkTu13bnGLBHHxyoYbLSZLiF8");

  const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    fromWallet.publicKey
  );

  const toTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    mint,
    toWallet.publicKey
  );

  const signature = await transfer(
    connection,
    toWallet, // payer
    fromTokenAccount.address, // source
    toTokenAccount.address, // destination
    fromWallet.publicKey, // owner
    2, // amount
    [fromWallet, toWallet] // multiSigners
  );

  console.log("Signature:", signature);
})();
