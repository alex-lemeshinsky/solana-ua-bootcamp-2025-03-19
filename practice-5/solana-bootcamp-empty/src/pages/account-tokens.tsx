import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TabsContent } from "@/components/ui/tabs";

import { Loader2 } from "lucide-react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { Button } from "@/components/ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { TokenEntity } from "@/types/token";

export default function AccountTokens({
  isWalletConnected,
  disconnect,
  setIsWalletConnected,
  loading,
}: {
  isWalletConnected: boolean;
  disconnect: () => void;
  setIsWalletConnected: (isWalletConnected: boolean) => void;
  loading: boolean;
}) {
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenEntity[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!publicKey) return;
      setTokensLoading(true);
      try {
        const connection = new Connection(
          clusterApiUrl(WalletAdapterNetwork.Devnet)
        );
        // Fetch all token accounts owned by the user
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        // Filter out accounts with zero balance
        const userTokens: TokenEntity[] = tokenAccounts.value
          .map((accountInfo) => {
            const info = accountInfo.account.data.parsed.info;
            return {
              mint: info.mint,
              amount: info.tokenAmount.uiAmount,
              decimals: info.tokenAmount.decimals,
            };
          })
          .filter((token) => token.amount > 0);

        setTokens(userTokens);
      } catch (e) {
        console.error("Error fetching tokens", e);
        setTokens([]);
      }
      setTokensLoading(false);
    };

    if (isWalletConnected && publicKey) {
      fetchTokens();
    } else {
      setTokens([]);
    }
  }, [isWalletConnected, publicKey]);

  return (
    <TabsContent value="accountTokens">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Your Tokens</CardTitle>
            <CardDescription>View your tokens.</CardDescription>
          </div>
          {isWalletConnected ? (
            <div>
              <Button
                onClick={() => {
                  try {
                    disconnect();
                    setIsWalletConnected(false);
                  } catch (e) {
                    console.log("Error disconnecting", e);
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isWalletConnected ? (
              <div className="text-center py-8">
                <p className="mb-4 text-muted-foreground">
                  Connect your wallet to view your tokens
                </p>
                <WalletMultiButton style={{ backgroundColor: "black" }}>
                  <Button asChild disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <div>Connect Wallet</div>
                    )}
                  </Button>
                </WalletMultiButton>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  {tokensLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading tokens...
                    </div>
                  ) : tokens.length === 0 ? (
                    <div>No tokens found in your wallet.</div>
                  ) : (
                    <ul>
                      {tokens.map((token) => (
                        <li key={token.mint} className="mb-2">
                          <div>
                            <span className="font-mono">{token.mint}</span>
                            <span className="ml-2">
                              {token.amount} (decimals: {token.decimals})
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
