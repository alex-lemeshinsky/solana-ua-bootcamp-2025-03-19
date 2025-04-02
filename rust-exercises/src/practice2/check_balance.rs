#![allow(dead_code)]

use crate::practice1::load_keypair::load_keypair;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{native_token::LAMPORTS_PER_SOL, signature::Signer};

pub fn check_balance() {
    let pubkey = load_keypair().pubkey();
    let url = "https://api.devnet.solana.com";
    let client = RpcClient::new(url.to_string());
    println!("⚡️ Connected to devnet");

    let balance_in_lamports = client.get_balance(&pubkey).unwrap();
    let balance_in_sol = balance_in_lamports as f64 / LAMPORTS_PER_SOL as f64;
    println!(
        "💰 The balance for the wallet at address {} is: {} SOL",
        pubkey, balance_in_sol
    );

    let sig = client
        .request_airdrop(&pubkey, 1 * LAMPORTS_PER_SOL)
        .unwrap();
    println!("✅ Airdrop transaction hash: {}", sig.to_string());

    std::thread::sleep(std::time::Duration::from_secs(10));

    let balance_in_lamports_after_airdrop = client.get_balance(&pubkey).unwrap();
    let balance_in_sol_after_airdrop =
        balance_in_lamports_after_airdrop as f64 / LAMPORTS_PER_SOL as f64;
    println!(
        "💰 The balance for the wallet at address {} after airdrop is: {} SOL",
        pubkey, balance_in_sol_after_airdrop
    );
}
