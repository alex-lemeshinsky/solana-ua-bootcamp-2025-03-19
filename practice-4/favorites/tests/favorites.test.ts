import * as anchor from "@coral-xyz/anchor";
import { Program, web3 } from "@coral-xyz/anchor";
import { Favorites } from "../target/types/favorites";
import {
  airdropIfRequired,
  getCustomErrorMessage,
} from "@solana-developers/helpers";
import { expect, describe, test } from "@jest/globals";
import { systemProgramErrors } from "./system-program-errors";

describe("favorites", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const user = web3.Keypair.generate();
  const user2 = web3.Keypair.generate();
  const user3 = web3.Keypair.generate();
  const program = anchor.workspace.Favorites as Program<Favorites>;

  const favoriteNumber = new anchor.BN(23);
  const redColor = "red";
  const blueColor = "blue";
  const greenColor = "green";

  console.log(`User public key: ${user.publicKey}`);

  beforeAll(async () => {
    await airdropIfRequired(
      anchor.getProvider().connection,
      user.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    await airdropIfRequired(
      anchor.getProvider().connection,
      user2.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );

    await airdropIfRequired(
      anchor.getProvider().connection,
      user3.publicKey,
      0.5 * web3.LAMPORTS_PER_SOL,
      1 * web3.LAMPORTS_PER_SOL
    );
  });

  it("Writes our favorites to the blockchain", async () => {
    // Make a transaction to write to the blockchain
    let tx: string | null = null;
    try {
      tx = await program.methods
        // Call the set_favorites instruction handler
        .setFavorites(favoriteNumber, redColor)
        .accounts({
          user: user.publicKey,
          // Note that both `favorites` and `system_program` are added
          // automatically.
        })
        // Sign the transaction
        .signers([user])
        // Send the transaction to the cluster or RPC
        .rpc();
    } catch (thrownObject) {
      // Let's properly log the error, so we can see the program involved
      // and (for well known programs) the full log message.

      const rawError = thrownObject as Error;
      throw new Error(
        getCustomErrorMessage(systemProgramErrors, rawError.message)
      );
    }

    console.log(`Tx signature: ${tx}`);

    // Calculate the PDA account address that holds the user's favorites
    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    // And make sure it matches!
    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.color).toEqual(redColor);
    expect(dataFromPda.number.toNumber()).toEqual(favoriteNumber.toNumber());
  });

  it("Updates our favorites in the blockchain", async () => {
    let tx: string | null = null;
    try {
      tx = await program.methods
        .updateFavorites(favoriteNumber, blueColor)
        .accounts({ user: user.publicKey, owner: user.publicKey })
        .signers([user])
        .rpc();
    } catch (thrownObject) {
      const rawError = thrownObject as Error;
      throw new Error(
        getCustomErrorMessage(systemProgramErrors, rawError.message)
      );
    }

    console.log(`Tx signature: ${tx}`);

    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.color).toEqual(blueColor);
    expect(dataFromPda.number.toNumber()).toEqual(favoriteNumber.toNumber());
  });

  it("Updates our favorites in the blockchain and sets the number to null", async () => {
    let tx: string | null = null;
    try {
      tx = await program.methods
        .updateFavorites(null, redColor)
        .accounts({ user: user.publicKey, owner: user.publicKey })
        .signers([user])
        .rpc();
    } catch (thrownObject) {
      const rawError = thrownObject as Error;
      throw new Error(
        getCustomErrorMessage(systemProgramErrors, rawError.message)
      );
    }

    console.log(`Tx signature: ${tx}`);

    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.color).toEqual(redColor);
    expect(dataFromPda.number).toBeNull();
  });

  it("Sets the authority to user2", async () => {
    let tx: string | null = null;
    try {
      tx = await program.methods
        .setAuthority(user2.publicKey)
        .accounts({ user: user.publicKey })
        .signers([user])
        .rpc();
    } catch (thrownObject) {
      const rawError = thrownObject as Error;
      throw new Error(
        getCustomErrorMessage(systemProgramErrors, rawError.message)
      );
    }

    console.log(`Set authority tx signature: ${tx}`);

    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.authority).toEqual(user2.publicKey);
  });

  test("User2 updates the favorites of user", async () => {
    let tx: string | null = null;
    try {
      tx = await program.methods
        .updateFavorites(favoriteNumber, greenColor)
        .accounts({ user: user2.publicKey, owner: user.publicKey })
        .signers([user2])
        .rpc();
    } catch (thrownObject) {
      const rawError = thrownObject as Error;
      throw new Error(
        getCustomErrorMessage(systemProgramErrors, rawError.message)
      );
    }

    console.log(`Tx signature: ${tx}`);

    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.color).toEqual(greenColor);
    expect(dataFromPda.number.toNumber()).toEqual(favoriteNumber.toNumber());
  });

  test("User3 is unauthorized to update the favorites of user", async () => {
    const transaction = program.methods
      .updateFavorites(favoriteNumber, blueColor)
      .accounts({ user: user3.publicKey, owner: user.publicKey })
      .signers([user3])
      .rpc();

    // update transaction should fail for unauthorized user
    await expect(transaction).rejects.toThrowError(/Unauthorized/);

    const [favoritesPda, _favoritesBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), user.publicKey.toBuffer()],
        program.programId
      );

    // previous state should not be changed
    const dataFromPda = await program.account.favorites.fetch(favoritesPda);
    expect(dataFromPda.color).toEqual(greenColor);
    expect(dataFromPda.number.toNumber()).toEqual(favoriteNumber.toNumber());
  });
});
