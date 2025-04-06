use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig, pubkey::Pubkey, signer::Signer, transaction::Transaction,
};
use spl_token::instruction::mint_to;

use crate::practice1::load_keypair::load_keypair;

pub fn mint_tokens() {
    let sender = load_keypair();

    let rpc_url = "https://api.devnet.solana.com";
    let client = RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed());

    let minor_units_per_major = 10u64.pow(2);

    let token_mint_account = Pubkey::from_str_const("2zuAc6PoeWagxX6M5C8w4jYm8EP3YCrQTQCK4KB8VMyd");
    let recipient_associated_token_account =
        Pubkey::from_str_const("7RXyC6gNQvQvwK6gSbkrnbiS7zBujEarhxRwCGnvExST");

    let amount: u64 = 10 * minor_units_per_major;

    let token_program_id = spl_token::id();
    let ix = mint_to(
        &token_program_id,
        &token_mint_account,
        &recipient_associated_token_account,
        &sender.pubkey(),
        &[],
        amount,
    )
    .unwrap();

    let recent_blockhash = client.get_latest_blockhash().unwrap();
    let mut tx = Transaction::new_with_payer(&[ix], Some(&sender.pubkey()));
    tx.sign(&[&sender], recent_blockhash);

    let signature = client.send_and_confirm_transaction(&tx).unwrap();

    let explorer_link = format!(
        "https://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );

    println!("✅ Success!");
    println!("Mint Token Transaction: {}", explorer_link);
}
