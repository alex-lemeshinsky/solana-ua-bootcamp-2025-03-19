#![allow(dead_code)]
#![allow(deprecated)]

use crate::practice1::load_keypair::load_keypair;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    transaction::Transaction,
};
use spl_associated_token_account::{create_associated_token_account, get_associated_token_address};
use std::error::Error;

fn get_or_create_associated_token_account(
    client: &RpcClient,
    payer: &Keypair,
    owner: &Pubkey,
    mint: &Pubkey,
) -> Result<Pubkey, Box<dyn Error>> {
    // Compute the associated token account (ATA) address.
    let ata = get_associated_token_address(owner, mint);

    // Try to fetch the account info. If it exists, return the ATA.
    match client.get_account(&ata) {
        Ok(_) => {
            println!("Associated token account already exists: {}", ata);
            Ok(ata)
        }
        Err(_) => {
            // If the account doesn't exist, create the associated token account.
            let ix = create_associated_token_account(&payer.pubkey(), owner, mint);
            let recent_blockhash = client.get_latest_blockhash()?;
            let tx = Transaction::new_signed_with_payer(
                &[ix],
                Some(&payer.pubkey()),
                &[payer],
                recent_blockhash,
            );
            let sig = client.send_and_confirm_transaction(&tx)?;
            println!(
                "Created associated token account: {}. Transaction: {}",
                ata, sig
            );
            Ok(ata)
        }
    }
}

pub fn create_token_account() {
    let sender = load_keypair();

    let url = "https://api.devnet.solana.com";
    let client = RpcClient::new(url.to_string());
    println!("⚡️ Connected to devnet");

    let recepient = Pubkey::from_str_const("HoVqWi3pGECUosPPQ5uYCqdt2Kr27FTZFN6FQnRnBVgp");
    let token_mint = Pubkey::from_str_const("2zuAc6PoeWagxX6M5C8w4jYm8EP3YCrQTQCK4KB8VMyd");

    let token_account =
        get_or_create_associated_token_account(&client, &sender, &recepient, &token_mint).unwrap();
    println!("Token Account: {}", token_account.to_string());

    let explorer_link = format!(
        "https://explorer.solana.com/address/{}?cluster=devnet",
        token_account
    );
    println!("✅ Created token account: {}", explorer_link);
}
