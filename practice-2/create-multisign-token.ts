import {
  createMint,
  createMultisig,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair } from "@solana/web3.js";
import { loadKey } from "../utils/load-key";

async function main() {
  const signer1 = loadKey("PRIVATE_KEY");
  const signer2 = loadKey("PRIVATE_KEY_2");
  const signer3 = loadKey("PRIVATE_KEY_3");

  console.log(
    `Signers:\n${signer1.publicKey.toBase58()},\n${signer2.publicKey.toBase58()},\n${signer3.publicKey.toBase58()}`
  );

  const connection = new Connection(clusterApiUrl("devnet"));

  const multisignKey = await createMultisig(
    connection,
    signer1,
    [signer1.publicKey, signer2.publicKey, signer3.publicKey],
    2
  );

  console.log(`Multisign public key: ${multisignKey.toBase58()}`);

  const mint = await createMint(
    connection,
    signer1,
    multisignKey,
    multisignKey,
    2
  );

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    signer1,
    mint,
    signer1.publicKey
  );

  try {
    // this transaction will fail
    await mintTo(
      connection,
      signer1,
      mint,
      tokenAccount.address,
      multisignKey,
      10
    );
  } catch (error) {
    console.log(error);
  }

  // this transaction will succeed
  await mintTo(
    connection,
    signer1,
    mint,
    tokenAccount.address,
    multisignKey,
    10,
    [signer1, signer2]
  );

  const mintInfo = await getMint(connection, mint);

  console.log(`Minted ${mintInfo.supply} token`);
}

main();
