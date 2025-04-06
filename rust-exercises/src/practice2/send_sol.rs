#![allow(dead_code)]

use crate::practice1::load_keypair::load_keypair;
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    instruction::{AccountMeta, Instruction},
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::Signer,
    system_instruction,
    transaction::Transaction,
};

pub fn send_sol() {
    let sender = load_keypair();
    println!("Public key: {}", sender.pubkey());

    let url = "https://api.devnet.solana.com";
    let client = RpcClient::new(url.to_string());
    println!("⚡️ Connected to devnet");

    let recipient = Pubkey::from_str_const("HoVqWi3pGECUosPPQ5uYCqdt2Kr27FTZFN6FQnRnBVgp");
    println!("Attempting to send 0.01 SOL to {}", recipient.to_string());

    let lamports = (0.01 * LAMPORTS_PER_SOL as f64) as u64;
    let transfer_ix = system_instruction::transfer(&sender.pubkey(), &recipient, lamports);

    let memo_program = Pubkey::from_str_const("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
    let memo_text = "Hey from Solana using Rust!";
    let memo_ix = Instruction {
        program_id: memo_program,
        accounts: vec![AccountMeta::new(sender.pubkey(), true)],
        data: memo_text.as_bytes().to_vec(),
    };

    let mut transaction =
        Transaction::new_with_payer(&[transfer_ix, memo_ix], Some(&sender.pubkey()));

    let recent_blockhash = client.get_latest_blockhash().unwrap();
    transaction.sign(&[&sender], recent_blockhash);

    println!("📝 memo is: {}", memo_text);

    let signature = client.send_and_confirm_transaction(&transaction).unwrap();
    println!(
        "Transaction confirmed, signature: {}!",
        signature.to_string()
    );
}
