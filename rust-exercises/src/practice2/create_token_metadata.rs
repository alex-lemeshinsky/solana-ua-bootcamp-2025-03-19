use mpl_token_metadata::{
    instructions::CreateV1Builder,
    types::{PrintSupply, TokenStandard},
};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig, pubkey::Pubkey, signature::Signer,
    transaction::Transaction,
};

use crate::practice1::load_keypair::load_keypair;

pub fn create_token_metadata() {
    // Retrieve and parse PRIVATE_KEY from the environment
    let payer = load_keypair();
    let payer_pubkey = payer.pubkey();

    // Connect to devnet
    let rpc_url = "https://api.devnet.solana.com";
    let client = RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed());

    // Define the Token Metadata Program ID and the token mint account
    let token_metadata_program_id =
        Pubkey::from_str_const("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
    let token_mint_account = Pubkey::from_str_const("2zuAc6PoeWagxX6M5C8w4jYm8EP3YCrQTQCK4KB8VMyd");

    // Compute the PDA (Program Derived Address) for the metadata account
    let (metadata_pda, _metadata_bump) = Pubkey::find_program_address(
        &[
            b"metadata",
            token_metadata_program_id.as_ref(),
            token_mint_account.as_ref(),
        ],
        &token_metadata_program_id,
    );

    let create_ix = CreateV1Builder::new()
        .metadata(metadata_pda) // Use metadata_pda instead of undefined "metadata"
        .master_edition(Some(metadata_pda)) // Use computed master_edition
        .mint(token_mint_account, false)
        .authority(payer_pubkey)
        .payer(payer_pubkey)
        .update_authority(payer_pubkey, true)
        .is_mutable(true)
        .primary_sale_happened(false)
        .name(String::from("Solana Bootcamp Test Token 2"))
        .symbol(String::from("SBTT-2"))
        .uri(String::from("http://my.pnft"))
        .seller_fee_basis_points(1)
        .token_standard(TokenStandard::Fungible)
        .print_supply(PrintSupply::Zero)
        .instruction();

    // Create a transaction using the instruction
    let mut transaction = Transaction::new_with_payer(&[create_ix], Some(&payer_pubkey));
    let latest_blockhash = client
        .get_latest_blockhash()
        .expect("Failed to fetch blockhash");
    transaction.sign(&[&payer], latest_blockhash);

    // Send and confirm the transaction
    let signature = client.send_and_confirm_transaction(&transaction).unwrap();
    println!("Transaction confirmed with signature: {}", signature);

    // Print an explorer link to view the token mint account on devnet
    println!(
        "✅ Look at the token mint again: https://explorer.solana.com/address/{}?cluster=devnet!",
        token_mint_account
    );
}
