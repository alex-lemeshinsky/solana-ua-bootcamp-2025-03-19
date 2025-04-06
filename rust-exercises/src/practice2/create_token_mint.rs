#![allow(dead_code)]

use crate::practice1::load_keypair::load_keypair;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    program_pack::Pack, signature::Keypair, signer::Signer, system_instruction,
    transaction::Transaction,
};
use spl_token::{instruction as token_instruction, state::Mint};

pub fn create_token_mint() {
    let sender = load_keypair();

    let url = "https://api.devnet.solana.com";
    let client = RpcClient::new(url.to_string());
    println!("⚡️ Connected to devnet");

    // Create a new keypair for the token mint
    let mint = Keypair::new();

    // Get the minimum balance required for rent exemption of a Mint account
    let rent_exemption = client
        .get_minimum_balance_for_rent_exemption(Mint::LEN)
        .unwrap();

    // 1. Create account for the mint
    let create_account_ix = system_instruction::create_account(
        &sender.pubkey(),
        &mint.pubkey(),
        rent_exemption,
        Mint::LEN as u64,
        &spl_token::id(),
    );

    // 2. Initialize the mint: decimals=2, mint_authority = sender, freeze_authority = None
    let decimals = 2;
    let init_mint_ix = token_instruction::initialize_mint(
        &spl_token::id(),
        &mint.pubkey(),
        &sender.pubkey(),
        None,
        decimals,
    )
    .unwrap();

    // Build and sign the transaction
    let recent_blockhash = client.get_latest_blockhash().unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[create_account_ix, init_mint_ix],
        Some(&sender.pubkey()),
        &[&sender, &mint],
        recent_blockhash,
    );

    let signature = client.send_and_confirm_transaction(&tx).unwrap();
    println!("Token mint created with signature: {}", signature);

    let token_mint = mint.pubkey();

    // Construct an explorer link (similar to getExplorerLink in TS)
    let explorer_link = format!(
        "https://explorer.solana.com/address/{}?cluster=devnet",
        token_mint
    );
    println!("✅ Token Mint: {}", explorer_link);
}
