#![allow(dead_code)]

use dotenv::dotenv;
use solana_sdk::signature::{Keypair, Signer};
use std::{env, process};

pub fn load_keypair() -> Keypair {
    dotenv().ok();

    let private_key = match env::var("PRIVATE_KEY") {
        Ok(val) => val,
        Err(_) => {
            eprintln!("Add PRIVATE_KEY to .env!");
            process::exit(1);
        }
    };

    let key_bytes: Vec<u8> =
        serde_json::from_str(&private_key).expect("Failed to parse PRIVATE_KEY as a JSON array");

    let keypair =
        Keypair::from_bytes(&key_bytes).expect("Failed to create Keypair from the secret key");

    println!("Public key: {}", keypair.pubkey());

    return keypair;
}
