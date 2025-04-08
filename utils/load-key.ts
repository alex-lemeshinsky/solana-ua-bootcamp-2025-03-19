import "dotenv/config";
import { Keypair } from "@solana/web3.js";

export function loadKey(key: string): Keypair {
  let privateKey = process.env[key];
  if (privateKey === undefined) {
    console.log(`Add ${key} to .env!`);
    process.exit(1);
  }
  const asArray = Uint8Array.from(JSON.parse(privateKey));
  return Keypair.fromSecretKey(asArray);
}
