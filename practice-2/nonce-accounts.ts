import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  NonceAccount,
  NONCE_ACCOUNT_LENGTH,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
} from "@solana/spl-token";
import { loadKey } from "../utils/load-key";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const fromWallet = loadKey("PRIVATE_KEY_2");
const toWallet = loadKey("PRIVATE_KEY_3");
const nonceKP = loadKey("NONCE_PRIVATE_KEY");

async function createNonceAccount(connection: Connection) {
  let tx = new Transaction().add(
    // create nonce account
    SystemProgram.createAccount({
      fromPubkey: fromWallet.publicKey,
      newAccountPubkey: nonceKP.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(
        NONCE_ACCOUNT_LENGTH
      ),
      space: NONCE_ACCOUNT_LENGTH,
      programId: SystemProgram.programId,
    }),
    // init nonce account
    SystemProgram.nonceInitialize({
      noncePubkey: nonceKP.publicKey, // nonce account pubkey
      authorizedPubkey: fromWallet.publicKey, // nonce account authority (for advance and close)
    })
  );

  const sx = await sendAndConfirmTransaction(connection, tx, [
    fromWallet,
    nonceKP,
  ]);
  console.log("Nonce account created:", sx);
}

(async () => {
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
    toWallet,
    mint,
    toWallet.publicKey
  );

  let nonceAccountInfo = await connection.getAccountInfo(nonceKP.publicKey);
  if (nonceAccountInfo.data.byteLength === 0) {
    await createNonceAccount(connection);
    nonceAccountInfo = await connection.getAccountInfo(nonceKP.publicKey);
  }

  const nonceAccount = NonceAccount.fromAccountData(nonceAccountInfo.data);

  const transaction = new Transaction();
  transaction.feePayer = toWallet.publicKey;
  transaction.recentBlockhash = nonceAccount.nonce;

  transaction.add(
    SystemProgram.nonceAdvance({
      noncePubkey: nonceKP.publicKey,
      authorizedPubkey: fromWallet.publicKey,
    })
  );

  const transferInstruction = createTransferInstruction(
    fromTokenAccount.address, // Source token account.
    toTokenAccount.address, // Destination token account.
    fromWallet.publicKey, // Owner of the source account.
    2 // Amount to transfer.
  );
  transaction.add(transferInstruction);

  transaction.partialSign(fromWallet);

  console.log("Local time:", new Date().toLocaleString());
  console.log("Wait 3 minutes...");
  await new Promise((resolve) => setTimeout(resolve, 3 * 60 * 1000));
  console.log("Local time:", new Date().toLocaleString());

  const partiallySignedTx = transaction.serialize({
    requireAllSignatures: false,
  });
  const txToSign = Transaction.from(partiallySignedTx);

  // Second partial signature
  txToSign.partialSign(toWallet);
  const fullySignedTx = txToSign.serialize();

  const signature = await connection.sendRawTransaction(fullySignedTx);
  await connection.confirmTransaction(signature, "confirmed");

  console.log("Signature:", signature);
})();
