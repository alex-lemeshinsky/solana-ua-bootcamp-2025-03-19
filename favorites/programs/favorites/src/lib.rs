use anchor_lang::prelude::*;

declare_id!("23LDH1n8jGNowMB2atJ2PM9sdXcZA1GvJuNbUqFQpUzE");

#[program]
pub mod favorites {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
