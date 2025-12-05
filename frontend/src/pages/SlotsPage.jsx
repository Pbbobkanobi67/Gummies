import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useGameContext } from '../contexts/GameContext';

const BLUE_TOKEN = "0xf11Af396703E11D48780B5154E52Fd7b430C6C01";
const BLUE_SLOTS_ADDRESS = import.meta.env.VITE_BLUE_SLOTS_ADDRESS || "0x5d5d7c1d9546C59f023f9DA40c96Ac5a2bC5Ffbe";

// BlueSlots ABI
const BLUE_SLOTS_ABI = [
  "function spin(uint256 betAmount) external returns (uint256 spinId)",
  "function reveal(uint256 spinId) external returns (uint256 winAmount)",
  "function canReveal(uint256 spinId) external view returns (bool canRevealNow, string memory reason)",
  "function blocksUntilReveal(uint256 spinId) external view returns (uint256 blocks)",
  "function getPendingSpin(address player) external view returns (uint256)",
  "function getSpinResult(uint256 spinId) external view returns (tuple(address player, uint256 betAmount, uint256 spinBlock, uint256 winAmount, uint8[3] symbols, uint8 status, bool isFreeSpin))",
  "function getPlayerStats(address player) external view returns (tuple(uint256 totalSpins, uint256 totalWagered, uint256 totalWon, uint256 biggestWin, uint256 freeSpinsUsed))",
  "function minBet() view returns (uint256)",
  "function maxBet() view returns (uint256)",
  "function houseReserve() view returns (uint256)",
  "function getMaxBetForReserve() view returns (uint256)",
  "event SpinStarted(uint256 indexed spinId, address indexed player, uint256 betAmount, bool isFreeSpin)",
  "event SpinRevealed(uint256 indexed spinId, address indexed player, uint8[3] symbols, uint8[3] symbolTypes, uint256 winAmount)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)"
];

// Symbol definitions - order matches contract enum
const SYMBOLS = {
  0: { name: 'BLUE', emoji: '🔵', color: '#3B82F6' },
  1: { name: 'DIAMOND', emoji: '💎', color: '#A855F7' },
  2: { name: 'FIRE', emoji: '🔥', color: '#EF4444' },
  3: { name: 'STAR', emoji: '⭐', color: '#FBBF24' },
  4: { name: 'LUCKY', emoji: '🍀', color: '#22C55E' },
  5: { name: 'SEVEN', emoji: '🎰', color: '#EC4899' }
};

// Position to symbol mapping (matches contract)
const positionToSymbol = (position) => {
  if (position < 2) return 0;   // BLUE
  if (position < 5) return 1;   // DIAMOND
  if (position < 9) return 2;   // FIRE
  if (position < 14) return 3;  // STAR
  if (position < 17) return 4;  // LUCKY
  return 5;                      // SEVEN
};

// Payout multipliers (for display)
const PAYOUTS = {
  TRIPLE_BLUE: '50x',
  TRIPLE_DIAMOND: '25x',
  TRIPLE_SEVEN: '15x',
  TRIPLE_FIRE: '10x',
  TRIPLE_LUCKY: '8x',
  TRIPLE_STAR: '5x',
  TWO_MATCH: '1.5x'
};

// Bet presets
const BET_PRESETS = [5, 10, 25, 50, 100];

function SlotsPage({ wallet }) {
  // Get game status from context
  let slotsGame = null;
  let isGameEnabled = false;
  try {
    const gameContext = useGameContext();
    slotsGame = gameContext.getGame('slots');
    isGameEnabled = gameContext.isGamePlayable('slots');
  } catch (e) {
    // Context not available
  }

  // State
  const [betAmount, setBetAmount] = useState(10);
  const [customBet, setCustomBet] = useState('');
  const [balance, setBalance] = useState('0');
  const [reels, setReels] = useState([3, 3, 3]); // Default to stars
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [pendingSpinId, setPendingSpinId] = useState(null);
  const [blocksToWait, setBlocksToWait] = useState(0);
  const [lastWin, setLastWin] = useState(null);
  const [error, setError] = useState(null);
  const [txStatus, setTxStatus] = useState('');
  const [stats, setStats] = useState({
    totalSpins: 0,
    totalWagered: '0',
    totalWon: '0',
    biggestWin: '0'
  });
  const [contractInfo, setContractInfo] = useState({
    minBet: 5,
    maxBet: 100,
    houseReserve: '0',
    maxBetForReserve: 100
  });

  // Animation state
  const [animatingReels, setAnimatingReels] = useState([false, false, false]);

  // Contract ready check
  const isContractReady = !!BLUE_SLOTS_ADDRESS;

  // Fetch BLUE balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!wallet?.account || !wallet?.signer) {
        setBalance('0');
        return;
      }

      try {
        const blueToken = new ethers.Contract(BLUE_TOKEN, ERC20_ABI, wallet.signer);
        const bal = await blueToken.balanceOf(wallet.account);
        setBalance(parseFloat(ethers.formatEther(bal)).toLocaleString());
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [wallet?.account, wallet?.signer]);

  // Fetch contract info and player stats
  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!wallet?.signer || !isContractReady) return;

      try {
        const slotsContract = new ethers.Contract(BLUE_SLOTS_ADDRESS, BLUE_SLOTS_ABI, wallet.signer);

        const [minBet, maxBet, reserve, maxBetReserve] = await Promise.all([
          slotsContract.minBet(),
          slotsContract.maxBet(),
          slotsContract.houseReserve(),
          slotsContract.getMaxBetForReserve()
        ]);

        setContractInfo({
          minBet: parseFloat(ethers.formatEther(minBet)),
          maxBet: parseFloat(ethers.formatEther(maxBet)),
          houseReserve: ethers.formatEther(reserve),
          maxBetForReserve: parseFloat(ethers.formatEther(maxBetReserve))
        });

        // Fetch player stats
        if (wallet.account) {
          const playerStats = await slotsContract.getPlayerStats(wallet.account);
          setStats({
            totalSpins: Number(playerStats.totalSpins),
            totalWagered: ethers.formatEther(playerStats.totalWagered),
            totalWon: ethers.formatEther(playerStats.totalWon),
            biggestWin: ethers.formatEther(playerStats.biggestWin)
          });

          // Check for pending spin
          const pending = await slotsContract.getPendingSpin(wallet.account);
          if (pending > 0n) {
            setPendingSpinId(Number(pending));
          }
        }
      } catch (err) {
        console.error('Error fetching contract info:', err);
      }
    };

    fetchContractInfo();
  }, [wallet?.signer, wallet?.account, isContractReady]);

  // Check blocks to wait for pending spin
  useEffect(() => {
    if (!pendingSpinId || !wallet?.signer || !isContractReady) return;

    const checkBlocks = async () => {
      try {
        const slotsContract = new ethers.Contract(BLUE_SLOTS_ADDRESS, BLUE_SLOTS_ABI, wallet.signer);
        const blocks = await slotsContract.blocksUntilReveal(pendingSpinId);
        setBlocksToWait(Number(blocks));
      } catch (err) {
        console.error('Error checking blocks:', err);
      }
    };

    checkBlocks();
    const interval = setInterval(checkBlocks, 3000);
    return () => clearInterval(interval);
  }, [pendingSpinId, wallet?.signer, isContractReady]);

  // Spin animation
  const animateSpin = useCallback(() => {
    return new Promise((resolve) => {
      setAnimatingReels([true, true, true]);

      const interval = setInterval(() => {
        setReels([
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 6)
        ]);
      }, 100);

      setTimeout(() => setAnimatingReels([false, true, true]), 1000);
      setTimeout(() => setAnimatingReels([false, false, true]), 1500);
      setTimeout(() => {
        clearInterval(interval);
        setAnimatingReels([false, false, false]);
        resolve();
      }, 2000);
    });
  }, []);

  // Handle spin
  const handleSpin = async () => {
    if (!wallet?.account || !wallet?.signer) {
      setError('Please connect your wallet');
      return;
    }

    if (pendingSpinId) {
      setError('You have a pending spin. Please reveal it first.');
      return;
    }

    setError(null);
    setLastWin(null);
    setIsSpinning(true);
    setTxStatus('Approving BLUE tokens...');

    try {
      const slotsContract = new ethers.Contract(BLUE_SLOTS_ADDRESS, BLUE_SLOTS_ABI, wallet.signer);
      const blueToken = new ethers.Contract(BLUE_TOKEN, ERC20_ABI, wallet.signer);
      const betWei = ethers.parseEther(betAmount.toString());

      // Check and approve if needed
      const allowance = await blueToken.allowance(wallet.account, BLUE_SLOTS_ADDRESS);
      if (allowance < betWei) {
        setTxStatus('Approving BLUE tokens...');
        const approveTx = await blueToken.approve(BLUE_SLOTS_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Start spin
      setTxStatus('Starting spin...');
      const spinTx = await slotsContract.spin(betWei);
      const receipt = await spinTx.wait();

      // Get spin ID from event
      const spinEvent = receipt.logs.find(log => {
        try {
          const parsed = slotsContract.interface.parseLog(log);
          return parsed.name === 'SpinStarted';
        } catch { return false; }
      });

      if (spinEvent) {
        const parsed = slotsContract.interface.parseLog(spinEvent);
        const spinId = Number(parsed.args.spinId);
        setPendingSpinId(spinId);
        setTxStatus(`Spin started! Waiting for blocks... (Spin #${spinId})`);

        // Start animation
        animateSpin();
      }
    } catch (err) {
      console.error('Spin error:', err);
      setError(err.reason || err.message || 'Failed to spin');
    } finally {
      setIsSpinning(false);
      setTxStatus('');
    }
  };

  // Handle reveal
  const handleReveal = async () => {
    if (!pendingSpinId || !wallet?.signer) return;

    setError(null);
    setIsRevealing(true);
    setTxStatus('Revealing result...');

    try {
      const slotsContract = new ethers.Contract(BLUE_SLOTS_ADDRESS, BLUE_SLOTS_ABI, wallet.signer);

      // Check if we can reveal
      const [canRevealNow, reason] = await slotsContract.canReveal(pendingSpinId);
      if (!canRevealNow) {
        setError(reason);
        setIsRevealing(false);
        setTxStatus('');
        return;
      }

      // Reveal
      const revealTx = await slotsContract.reveal(pendingSpinId);
      const receipt = await revealTx.wait();

      // Get result from event
      const revealEvent = receipt.logs.find(log => {
        try {
          const parsed = slotsContract.interface.parseLog(log);
          return parsed.name === 'SpinRevealed';
        } catch { return false; }
      });

      if (revealEvent) {
        const parsed = slotsContract.interface.parseLog(revealEvent);
        const symbols = parsed.args.symbols;
        const winAmount = parsed.args.winAmount;

        // Convert positions to symbol types
        const finalReels = [
          positionToSymbol(symbols[0]),
          positionToSymbol(symbols[1]),
          positionToSymbol(symbols[2])
        ];
        setReels(finalReels);

        // Set win amount
        const winBLUE = parseFloat(ethers.formatEther(winAmount));
        if (winBLUE > 0) {
          setLastWin(winBLUE);
        }

        // Refresh stats
        const playerStats = await slotsContract.getPlayerStats(wallet.account);
        setStats({
          totalSpins: Number(playerStats.totalSpins),
          totalWagered: ethers.formatEther(playerStats.totalWagered),
          totalWon: ethers.formatEther(playerStats.totalWon),
          biggestWin: ethers.formatEther(playerStats.biggestWin)
        });
      }

      setPendingSpinId(null);
      setBlocksToWait(0);
    } catch (err) {
      console.error('Reveal error:', err);
      setError(err.reason || err.message || 'Failed to reveal');
    } finally {
      setIsRevealing(false);
      setTxStatus('');
    }
  };

  const getResultMessage = () => {
    if (isSpinning) return 'Starting spin...';
    if (pendingSpinId && blocksToWait > 0) return `Waiting for ${blocksToWait} more block(s)...`;
    if (pendingSpinId && blocksToWait === 0) return 'Ready to reveal!';
    if (isRevealing) return 'Revealing...';
    if (lastWin && lastWin > 0) {
      if (lastWin >= betAmount * 10) return 'JACKPOT!';
      if (lastWin >= betAmount * 5) return 'BIG WIN!';
      return 'Winner!';
    }
    return 'Spin to play!';
  };

  // Show coming soon if game not enabled
  if (!isGameEnabled && slotsGame) {
    return (
      <div className="slots-page">
        <div className="coming-soon-container">
          <div className="coming-soon-icon">🎰</div>
          <h2>Blue Slots</h2>
          <p>Coming Soon!</p>
          <p className="coming-soon-desc">
            3-reel slot machine with multiple winning combinations.
            Stay tuned for launch!
          </p>
        </div>
        <style>{`
          .coming-soon-container {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            max-width: 500px;
            margin: 40px auto;
          }
          .coming-soon-icon {
            font-size: 4rem;
            margin-bottom: 20px;
          }
          .coming-soon-container h2 {
            color: #f8fafc;
            margin: 0 0 10px 0;
          }
          .coming-soon-container p {
            color: #f59e0b;
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
          }
          .coming-soon-desc {
            color: #94a3b8 !important;
            font-size: 0.95rem !important;
            font-weight: 400 !important;
            margin-top: 20px !important;
          }
        `}</style>
      </div>
    );
  }

  // Check if house reserve is too low
  const isReserveLow = parseFloat(contractInfo.houseReserve) < 100;

  return (
    <div className="slots-page">
      {/* Reserve Warning */}
      {isReserveLow && (
        <div className="reserve-warning">
          House reserve is low. Max bet may be limited.
        </div>
      )}

      {/* Header */}
      <div className="slots-header">
        <div className="slots-title">
          <span className="slots-icon">🎰</span>
          <div>
            <h2>Blue Slots</h2>
            <p>Provably Fair | 3-Reel Classic</p>
          </div>
        </div>
        <div className="slots-balance">
          <span className="balance-label">Balance</span>
          <span className="balance-value">{balance} BLUE</span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="slots-game">
        {/* Slot Machine */}
        <div className="slot-machine">
          <div className="reels-container">
            {reels.map((symbol, index) => (
              <div
                key={index}
                className={`reel ${animatingReels[index] ? 'spinning' : ''}`}
              >
                <div className="reel-symbol" style={{ color: SYMBOLS[symbol].color }}>
                  {SYMBOLS[symbol].emoji}
                </div>
              </div>
            ))}
          </div>

          <div className="payline-indicator">
            <span className="payline-arrow">→</span>
            <span className="payline-text">PAYLINE</span>
            <span className="payline-arrow">←</span>
          </div>
        </div>

        {/* Result Message */}
        <div className={`result-message ${lastWin ? 'win' : ''}`}>
          {getResultMessage()}
          {lastWin > 0 && (
            <div className="win-amount">+{lastWin.toFixed(2)} BLUE</div>
          )}
        </div>

        {/* Transaction Status */}
        {txStatus && (
          <div className="tx-status">{txStatus}</div>
        )}

        {/* Bet Selection */}
        <div className="bet-section">
          <h3>Select Bet</h3>
          <div className="bet-presets">
            {BET_PRESETS.filter(p => p >= contractInfo.minBet && p <= Math.min(contractInfo.maxBet, contractInfo.maxBetForReserve)).map((preset) => (
              <button
                key={preset}
                className={`bet-btn ${betAmount === preset ? 'selected' : ''}`}
                onClick={() => {
                  setBetAmount(preset);
                  setCustomBet('');
                }}
                disabled={isSpinning || isRevealing || pendingSpinId}
              >
                {preset}
              </button>
            ))}
            <input
              type="number"
              className="custom-bet-input"
              placeholder="Custom"
              value={customBet}
              onChange={(e) => {
                setCustomBet(e.target.value);
                const val = parseInt(e.target.value);
                if (val >= contractInfo.minBet && val <= Math.min(contractInfo.maxBet, contractInfo.maxBetForReserve)) {
                  setBetAmount(val);
                }
              }}
              disabled={isSpinning || isRevealing || pendingSpinId}
            />
          </div>
          <div className="current-bet">
            Current Bet: <strong>{betAmount} BLUE</strong>
            <span className="bet-limits"> (Min: {contractInfo.minBet}, Max: {Math.min(contractInfo.maxBet, contractInfo.maxBetForReserve)})</span>
          </div>
        </div>

        {/* Action Buttons */}
        {pendingSpinId ? (
          <button
            className={`spin-btn reveal ${blocksToWait === 0 ? 'ready' : ''}`}
            onClick={handleReveal}
            disabled={isRevealing || blocksToWait > 0}
          >
            {isRevealing ? 'Revealing...' : blocksToWait > 0 ? `Wait ${blocksToWait} block(s)...` : '🎲 REVEAL RESULT'}
          </button>
        ) : (
          <button
            className={`spin-btn ${isSpinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? 'Starting...' : `🎰 SPIN - ${betAmount} BLUE`}
          </button>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Info Panels */}
      <div className="slots-info-grid">
        {/* Payouts */}
        <div className="info-panel payouts-panel">
          <h3>Payouts</h3>
          <div className="payout-list">
            <div className="payout-row jackpot">
              <span>🔵🔵🔵</span>
              <span>{PAYOUTS.TRIPLE_BLUE}</span>
            </div>
            <div className="payout-row">
              <span>💎💎💎</span>
              <span>{PAYOUTS.TRIPLE_DIAMOND}</span>
            </div>
            <div className="payout-row">
              <span>🎰🎰🎰</span>
              <span>{PAYOUTS.TRIPLE_SEVEN}</span>
            </div>
            <div className="payout-row">
              <span>🔥🔥🔥</span>
              <span>{PAYOUTS.TRIPLE_FIRE}</span>
            </div>
            <div className="payout-row">
              <span>🍀🍀🍀</span>
              <span>{PAYOUTS.TRIPLE_LUCKY}</span>
            </div>
            <div className="payout-row">
              <span>⭐⭐⭐</span>
              <span>{PAYOUTS.TRIPLE_STAR}</span>
            </div>
            <div className="payout-row">
              <span>XX_</span>
              <span>{PAYOUTS.TWO_MATCH}</span>
            </div>
          </div>
        </div>

        {/* Your Stats */}
        <div className="info-panel stats-panel">
          <h3>Your Stats</h3>
          <div className="stats-list">
            <div className="stat-row">
              <span>Total Spins</span>
              <span>{stats.totalSpins}</span>
            </div>
            <div className="stat-row">
              <span>Total Wagered</span>
              <span>{parseFloat(stats.totalWagered).toFixed(2)} BLUE</span>
            </div>
            <div className="stat-row">
              <span>Total Won</span>
              <span>{parseFloat(stats.totalWon).toFixed(2)} BLUE</span>
            </div>
            <div className="stat-row highlight">
              <span>Biggest Win</span>
              <span>{parseFloat(stats.biggestWin).toFixed(2)} BLUE</span>
            </div>
          </div>
        </div>

        {/* Potential Wins */}
        <div className="info-panel potential-panel">
          <h3>With {betAmount} BLUE Bet</h3>
          <div className="potential-list">
            <div className="potential-row jackpot">
              <span>🔵🔵🔵 Jackpot</span>
              <span>{betAmount * 50} BLUE</span>
            </div>
            <div className="potential-row">
              <span>💎💎💎 Diamond</span>
              <span>{betAmount * 25} BLUE</span>
            </div>
            <div className="potential-row">
              <span>🎰🎰🎰 Seven</span>
              <span>{betAmount * 15} BLUE</span>
            </div>
            <div className="potential-row">
              <span>2-Match</span>
              <span>{betAmount * 1.5} BLUE</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .slots-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .reserve-warning {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .slots-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          margin-bottom: 20px;
        }

        .slots-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .slots-icon {
          font-size: 2.5rem;
        }

        .slots-title h2 {
          margin: 0;
          color: #f8fafc;
          font-size: 1.5rem;
        }

        .slots-title p {
          margin: 0;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .slots-balance {
          text-align: right;
        }

        .balance-label {
          display: block;
          color: #94a3b8;
          font-size: 0.85rem;
        }

        .balance-value {
          color: #3b82f6;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .slots-game {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 16px;
          padding: 30px;
          margin-bottom: 20px;
        }

        .slot-machine {
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-radius: 16px;
          padding: 30px;
          border: 3px solid #3b82f6;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
        }

        .reels-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }

        .reel {
          width: 100px;
          height: 100px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          border-radius: 12px;
          border: 2px solid #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .reel.spinning {
          animation: reelSpin 0.1s infinite;
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        @keyframes reelSpin {
          0%, 100% { transform: translateY(-2px); }
          50% { transform: translateY(2px); }
        }

        .reel-symbol {
          font-size: 3rem;
          text-shadow: 0 0 10px currentColor;
        }

        .payline-indicator {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: #fbbf24;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .payline-arrow {
          animation: arrowPulse 1s ease-in-out infinite;
        }

        @keyframes arrowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .result-message {
          text-align: center;
          margin: 20px 0;
          font-size: 1.5rem;
          color: #94a3b8;
          min-height: 60px;
        }

        .result-message.win {
          color: #22c55e;
          animation: winPulse 0.5s ease-in-out infinite;
        }

        @keyframes winPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .win-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #fbbf24;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .tx-status {
          text-align: center;
          color: #60a5fa;
          font-size: 0.9rem;
          margin-bottom: 15px;
        }

        .bet-section {
          margin: 20px 0;
          text-align: center;
        }

        .bet-section h3 {
          color: #f8fafc;
          margin-bottom: 10px;
        }

        .bet-presets {
          display: flex;
          justify-content: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .bet-btn {
          padding: 10px 20px;
          background: #334155;
          border: 2px solid #475569;
          border-radius: 8px;
          color: #f8fafc;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .bet-btn:hover:not(:disabled) {
          background: #475569;
          border-color: #3b82f6;
        }

        .bet-btn.selected {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .bet-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .custom-bet-input {
          width: 90px;
          padding: 10px 8px 10px 12px;
          background: #334155;
          border: 2px solid #475569;
          border-radius: 8px;
          color: #f8fafc;
          text-align: left;
          font-weight: 600;
          -moz-appearance: textfield;
        }

        .custom-bet-input::-webkit-outer-spin-button,
        .custom-bet-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .custom-bet-input::placeholder {
          color: #94a3b8;
          opacity: 1;
        }

        .custom-bet-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .current-bet {
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .current-bet strong {
          color: #3b82f6;
        }

        .bet-limits {
          color: #64748b;
          font-size: 0.8rem;
        }

        .spin-btn {
          width: 100%;
          max-width: 300px;
          padding: 16px 32px;
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: block;
          margin: 20px auto 0;
        }

        .spin-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .spin-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spin-btn.spinning {
          animation: spinBtnPulse 0.5s ease-in-out infinite;
        }

        .spin-btn.reveal {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .spin-btn.reveal.ready {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
          animation: readyPulse 1s ease-in-out infinite;
        }

        @keyframes readyPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8); }
        }

        @keyframes spinBtnPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
          text-align: center;
        }

        .slots-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-panel {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 12px;
          padding: 20px;
        }

        .info-panel h3 {
          color: #f8fafc;
          margin: 0 0 15px 0;
          font-size: 1rem;
          border-bottom: 1px solid #334155;
          padding-bottom: 10px;
        }

        .payout-list, .stats-list, .potential-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .payout-row, .stat-row, .potential-row {
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 0.9rem;
        }

        .payout-row.jackpot, .potential-row.jackpot {
          color: #fbbf24;
          font-weight: 600;
        }

        .stat-row.highlight {
          color: #22c55e;
          font-weight: 600;
        }

        @media (max-width: 600px) {
          .slots-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .slots-balance {
            text-align: center;
          }

          .reel {
            width: 80px;
            height: 80px;
          }

          .reel-symbol {
            font-size: 2.5rem;
          }

          .bet-presets {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}

export default SlotsPage;
