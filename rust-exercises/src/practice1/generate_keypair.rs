#![allow(dead_code)]

use solana_sdk::signature::{Keypair, Signer};

pub fn generate_keypair() -> Keypair {
    let keypair = Keypair::new();

    println!("Public key: {}", keypair.pubkey());

    println!("Secret key: {:?}", keypair.to_bytes());

    return keypair;
}
