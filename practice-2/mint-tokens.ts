import "dotenv/config";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { mintTo } from "@solana/spl-token";
import { getExplorerLink } from "@solana-developers/helpers";

async function main() {
  let privateKey = process.env["PRIVATE_KEY"];
  if (privateKey === undefined) {
    console.log("Add PRIVATE_KEY to .env!");
    process.exit(1);
  }
  const asArray = Uint8Array.from(JSON.parse(privateKey));
  const sender = Keypair.fromSecretKey(asArray);

  const connection = new Connection(clusterApiUrl("devnet"));

  // Our token has two decimal places
  const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

  const tokenMintAccount = new PublicKey(
    "CJ7iYHEvXoWZv26WiBhNkTu13bnGLBHHxyoYbLSZLiF8"
  );

  const recipientAssociatedTokenAccount = new PublicKey(
    "CXk1bX66nVE2nPD6xUFnX5V2qTNajxyxae24uyKGWLbS"
  );

  const transactionSignature = await mintTo(
    connection,
    sender,
    tokenMintAccount,
    recipientAssociatedTokenAccount,
    sender,
    10 * MINOR_UNITS_PER_MAJOR_UNITS
  );

  const link = getExplorerLink("transaction", transactionSignature, "devnet");

  console.log("✅ Success!");
  console.log(`Mint Token Transaction: ${link}`);
}

main();
