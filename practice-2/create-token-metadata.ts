import "dotenv/config";
import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { getExplorerLink } from "@solana-developers/helpers";
import { createCreateMetadataAccountV3Instruction } from "@metaplex-foundation/mpl-token-metadata";

async function main() {
  let privateKey = process.env["PRIVATE_KEY"];
  if (privateKey === undefined) {
    console.log("Add PRIVATE_KEY to .env!");
    process.exit(1);
  }
  const asArray = Uint8Array.from(JSON.parse(privateKey));
  const user = Keypair.fromSecretKey(asArray);

  const connection = new Connection(clusterApiUrl("devnet"));

  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  const tokenMintAccount = new PublicKey(
    "CJ7iYHEvXoWZv26WiBhNkTu13bnGLBHHxyoYbLSZLiF8"
  );

  const metadataData = {
    name: "Solana Bootcamp Test Token",
    symbol: "SBTT",
    uri: "https://github.com/alex-lemeshinsky/solana-ua-bootcamp-2025-03-19",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const [metadataPDA, _metadataBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      tokenMintAccount.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const transaction = new Transaction();
  const createMetadataAccountInstruction =
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: tokenMintAccount,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          collectionDetails: null,
          data: metadataData,
          isMutable: true,
        },
      }
    );
  transaction.add(createMetadataAccountInstruction);

  await sendAndConfirmTransaction(connection, transaction, [user]);

  const tokenMintLink = getExplorerLink(
    "address",
    tokenMintAccount.toString(),
    "devnet"
  );
  console.log(`✅ Look at the token mint again: ${tokenMintLink}!`);
}

main();
