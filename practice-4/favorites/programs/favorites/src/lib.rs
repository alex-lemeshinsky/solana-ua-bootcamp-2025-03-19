use anchor_lang::prelude::*;

#[error_code]
pub enum FavoritesError {
    #[msg("Unauthorized.")]
    Unauthorized,
}

declare_id!("23LDH1n8jGNowMB2atJ2PM9sdXcZA1GvJuNbUqFQpUzE");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: Option<u64>,

    #[max_len(50)]
    pub color: String,

    pub authority: Option<Pubkey>,
}

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: original owner of the favorites account
    pub owner: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"favorites", owner.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"favorites", user.key().as_ref()],
        bump,
    )]
    pub favorites: Account<'info, Favorites>,
}

#[program]
pub mod favorites {
    use super::*;

    pub fn set_favorites(
        context: Context<SetFavorites>,
        number: Option<u64>,
        color: String,
    ) -> Result<()> {
        let user_public_key = context.accounts.user.key();
        msg!("Greetings from {}", context.program_id);

        msg!(
            "User {}'s favorite number is {} and favorite color is: {}",
            user_public_key,
            number.map_or("null".to_string(), |n| n.to_string()),
            color
        );

        context.accounts.favorites.set_inner(Favorites {
            number,
            color,
            authority: None,
        });
        Ok(())
    }

    pub fn update_favorites(
        ctx: Context<UpdateFavorites>,
        number: Option<u64>,
        color: String,
    ) -> Result<()> {
        let signer_key = ctx.accounts.user.key();
        let owner_key = ctx.accounts.owner.key();
        let favorites = &mut ctx.accounts.favorites;
        require!(
            signer_key == owner_key || Some(signer_key) == favorites.authority,
            FavoritesError::Unauthorized
        );
        msg!("Greetings from {}", ctx.program_id);
        msg!(
            "User {}'s favorite number is {} and favorite color is: {}",
            signer_key,
            number.map_or("null".to_string(), |n| n.to_string()),
            color
        );
        favorites.number = number;
        favorites.color = color;
        Ok(())
    }

    pub fn set_authority(ctx: Context<SetAuthority>, authority: Option<Pubkey>) -> Result<()> {
        let user_key = ctx.accounts.user.key();
        msg!("Greetings from {}", ctx.program_id);
        msg!("Setting authority for {} to {:?}", user_key, authority);
        ctx.accounts.favorites.authority = authority;
        Ok(())
    }
}
