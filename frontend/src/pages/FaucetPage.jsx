import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import faucetContract from '../config/faucetContract.json';
import faucetAbi from '../config/faucetAbi.json';

function FaucetPage({ wallet }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [faucetInfo, setFaucetInfo] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilClaim, setTimeUntilClaim] = useState(0);
  const [userBalance, setUserBalance] = useState('0');

  const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";

  // Fetch faucet info
  useEffect(() => {
    const fetchFaucetInfo = async () => {
      if (!wallet.signer) return;

      try {
        const faucet = new ethers.Contract(
          faucetContract.address,
          faucetAbi,
          wallet.signer
        );

        const [balance, claimAmount, cooldown] = await Promise.all([
          faucet.faucetBalance(),
          faucet.claimAmount(),
          faucet.cooldownTime()
        ]);

        setFaucetInfo({
          balance: ethers.formatEther(balance),
          claimAmount: ethers.formatEther(claimAmount),
          cooldown: Number(cooldown) / 3600 // Convert to hours
        });

        // Check if user can claim
        if (wallet.account) {
          const canClaimNow = await faucet.canClaim(wallet.account);
          setCanClaim(canClaimNow);

          if (!canClaimNow) {
            const timeLeft = await faucet.timeUntilNextClaim(wallet.account);
            setTimeUntilClaim(Number(timeLeft));
          }

          // Get user BLUE balance
          const blueToken = new ethers.Contract(
            BLUE_TOKEN,
            ["function balanceOf(address account) view returns (uint256)"],
            wallet.signer
          );
          const userBal = await blueToken.balanceOf(wallet.account);
          setUserBalance(ethers.formatEther(userBal));
        }
      } catch (err) {
        console.error("Error fetching faucet info:", err);
      }
    };

    fetchFaucetInfo();
    const interval = setInterval(fetchFaucetInfo, 10000);
    return () => clearInterval(interval);
  }, [wallet.signer, wallet.account]);

  // Countdown timer
  useEffect(() => {
    if (timeUntilClaim > 0) {
      const timer = setInterval(() => {
        setTimeUntilClaim(prev => {
          if (prev <= 1) {
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeUntilClaim]);

  const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const handleClaim = async () => {
    if (!wallet.account || !wallet.signer) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setTxHash(null);

    try {
      const faucet = new ethers.Contract(
        faucetContract.address,
        faucetAbi,
        wallet.signer
      );

      const tx = await faucet.claim();
      setTxHash(tx.hash);

      await tx.wait();

      setSuccess(`Successfully claimed ${faucetInfo?.claimAmount || '1,000'} BLUE tokens!`);
      setCanClaim(false);
      setTimeUntilClaim(24 * 3600); // Reset to 24 hours

      // Refresh user balance
      const blueToken = new ethers.Contract(
        BLUE_TOKEN,
        ["function balanceOf(address account) view returns (uint256)"],
        wallet.signer
      );
      const newBalance = await blueToken.balanceOf(wallet.account);
      setUserBalance(ethers.formatEther(newBalance));

    } catch (err) {
      console.error("Faucet error:", err);
      if (err.message?.includes("Faucet empty")) {
        setError("Faucet is empty. Please try again later.");
      } else if (err.message?.includes("cooldown")) {
        setError("Please wait for the cooldown period to end.");
      } else {
        setError(err.reason || err.message || "Failed to claim tokens");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="faucet-page">
      <div className="card faucet-card">
        <div className="faucet-icon">🚰</div>
        <h2>Blue Casino Test Faucet</h2>
        <p className="faucet-desc">
          Get free BLUE tokens to test the casino games on BSC Testnet
        </p>

        <div className="faucet-amount">
          <span className="amount-label">Claim Amount:</span>
          <span className="amount-value">{faucetInfo?.claimAmount || '1,000'} BLUE</span>
        </div>

        {!wallet.account ? (
          <div className="faucet-connect">
            <p>Connect your wallet to claim tokens</p>
            <button className="btn btn-primary" onClick={wallet.connect}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="faucet-claim">
            <div className="wallet-display">
              <span className="wallet-label">Your Wallet:</span>
              <code className="wallet-address">
                {wallet.account.slice(0, 10)}...{wallet.account.slice(-8)}
              </code>
            </div>

            <div className="balance-display">
              <span className="balance-label">Your BLUE Balance:</span>
              <span className="balance-value">{parseFloat(userBalance).toLocaleString()} BLUE</span>
            </div>

            {error && (
              <div className="faucet-error">
                {error}
              </div>
            )}

            {success && (
              <div className="faucet-success">
                {success}
                {txHash && (
                  <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View Transaction
                  </a>
                )}
              </div>
            )}

            {canClaim ? (
              <button
                className="btn btn-primary btn-large"
                onClick={handleClaim}
                disabled={loading}
              >
                {loading ? 'Claiming...' : `Claim ${faucetInfo?.claimAmount || '1,000'} BLUE`}
              </button>
            ) : (
              <div className="cooldown-notice">
                <p>Next claim available in:</p>
                <span className="cooldown-timer">{formatTimeRemaining(timeUntilClaim)}</span>
              </div>
            )}
          </div>
        )}

        <div className="faucet-info">
          <h3>Faucet Info</h3>
          <div className="info-grid">
            <div className="info-row">
              <span>Faucet Balance:</span>
              <span>{parseFloat(faucetInfo?.balance || 0).toLocaleString()} BLUE</span>
            </div>
            <div className="info-row">
              <span>Claim Amount:</span>
              <span>{faucetInfo?.claimAmount || '1,000'} BLUE</span>
            </div>
            <div className="info-row">
              <span>Cooldown:</span>
              <span>{faucetInfo?.cooldown || 24} hours</span>
            </div>
            <div className="info-row">
              <span>Network:</span>
              <span>BSC Testnet</span>
            </div>
          </div>
        </div>

        <div className="faucet-actions">
          <a
            href="https://testnet.bnbchain.org/faucet-smart"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Get Test BNB for Gas
          </a>
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                await window.ethereum.request({
                  method: 'wallet_watchAsset',
                  params: {
                    type: 'ERC20',
                    options: {
                      address: BLUE_TOKEN,
                      symbol: 'BLUE',
                      decimals: 18,
                    },
                  },
                });
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Add BLUE to Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default FaucetPage;
