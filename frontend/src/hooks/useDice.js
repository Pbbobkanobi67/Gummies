import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../config/contract.json';
import contractABI from '../config/abi.json';

// Bet types enum matching contract
export const BetType = {
  EXACT: 0,
  OVER: 1,
  UNDER: 2,
  ODD: 3,
  EVEN: 4
};

// Bet status enum matching contract
export const BetStatus = {
  Pending: 0,
  Won: 1,
  Lost: 2,
  Expired: 3,
  Cancelled: 4
};

export const BetTypeLabels = {
  [BetType.EXACT]: 'Exact',
  [BetType.OVER]: 'Over',
  [BetType.UNDER]: 'Under',
  [BetType.ODD]: 'Odd',
  [BetType.EVEN]: 'Even'
};

export const BetStatusLabels = {
  [BetStatus.Pending]: 'Pending',
  [BetStatus.Won]: 'Won',
  [BetStatus.Lost]: 'Lost',
  [BetStatus.Expired]: 'Expired',
  [BetStatus.Cancelled]: 'Cancelled'
};

export function useDice(signer) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract state
  const [stats, setStats] = useState(null);
  const [limits, setLimits] = useState(null);
  const [playerBets, setPlayerBets] = useState([]);
  const [pendingBet, setPendingBet] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && contractConfig.address !== '0x0000000000000000000000000000000000000000') {
      const diceContract = new ethers.Contract(
        contractConfig.address,
        contractABI,
        signer
      );
      setContract(diceContract);
    } else {
      setContract(null);
    }
  }, [signer]);

  // Fetch contract stats
  const fetchStats = useCallback(async () => {
    if (!contract) return;
    try {
      const [statsData, minBet, maxBet, maxPayout, houseEdge, paused] = await Promise.all([
        contract.getStats(),
        contract.minBet(),
        contract.maxBet(),
        contract.maxPayout(),
        contract.houseEdge(),
        contract.paused()
      ]);

      setStats({
        totalBets: Number(statsData._totalBets),
        totalWagered: ethers.formatEther(statsData._totalWagered),
        totalPaidOut: ethers.formatEther(statsData._totalPaidOut),
        houseBankroll: ethers.formatEther(statsData._houseBankroll),
        houseProfit: ethers.formatEther(statsData._houseProfit)
      });

      setLimits({
        minBet: ethers.formatEther(minBet),
        maxBet: ethers.formatEther(maxBet),
        maxPayout: ethers.formatEther(maxPayout),
        houseEdge: Number(houseEdge) / 100,
        paused
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [contract]);

  // Fetch player's recent bets
  const fetchPlayerBets = useCallback(async (playerAddress) => {
    if (!contract || !playerAddress) return;
    try {
      const recentBets = await contract.getPlayerRecentBets(playerAddress, 10);
      const formattedBets = recentBets.map((bet, index) => ({
        id: index,
        player: bet.player,
        amount: ethers.formatEther(bet.amount),
        betType: Number(bet.betType),
        chosenNumber: Number(bet.chosenNumber),
        requestBlock: Number(bet.requestBlock),
        status: Number(bet.status),
        rolledNumber: Number(bet.rolledNumber),
        payout: ethers.formatEther(bet.payout),
        timestamp: Number(bet.timestamp)
      }));
      setPlayerBets(formattedBets);
    } catch (err) {
      console.error('Error fetching player bets:', err);
    }
  }, [contract]);

  // Calculate payout for a bet
  const calculatePayout = useCallback(async (amount, betType, chosenNumber) => {
    if (!contract) return '0';
    try {
      const amountWei = ethers.parseEther(amount.toString());
      const payout = await contract.calculatePayout(amountWei, betType, chosenNumber);
      return ethers.formatEther(payout);
    } catch (err) {
      console.error('Error calculating payout:', err);
      return '0';
    }
  }, [contract]);

  // Place a bet
  const placeBet = useCallback(async (amount, betType, chosenNumber) => {
    if (!contract) {
      setError('Contract not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      const amountWei = ethers.parseEther(amount.toString());

      // Get BLUE token contract
      const blueTokenAddress = await contract.blueToken();
      const blueToken = new ethers.Contract(
        blueTokenAddress,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        await contract.runner
      );

      // Check allowance
      const signerAddress = await (await contract.runner).getAddress();
      const allowance = await blueToken.allowance(signerAddress, contractConfig.address);

      if (allowance < amountWei) {
        // Approve tokens
        const approveTx = await blueToken.approve(contractConfig.address, amountWei);
        await approveTx.wait();
      }

      // Place bet
      const tx = await contract.placeBet(amountWei, betType, chosenNumber);
      const receipt = await tx.wait();

      // Find BetPlaced event
      const betPlacedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'BetPlaced';
        } catch {
          return false;
        }
      });

      if (betPlacedEvent) {
        const parsed = contract.interface.parseLog(betPlacedEvent);
        const betId = Number(parsed.args.betId);
        setPendingBet({
          id: betId,
          amount,
          betType,
          chosenNumber
        });
        return betId;
      }

      return null;
    } catch (err) {
      console.error('Error placing bet:', err);
      setError(err.reason || err.message || 'Failed to place bet');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Roll the dice for a pending bet
  const rollDice = useCallback(async (betId) => {
    if (!contract) {
      setError('Contract not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.rollDice(betId);
      const receipt = await tx.wait();

      // Find DiceRolled event
      const diceRolledEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'DiceRolled';
        } catch {
          return false;
        }
      });

      if (diceRolledEvent) {
        const parsed = contract.interface.parseLog(diceRolledEvent);
        const result = {
          betId: Number(parsed.args.betId),
          rolledNumber: Number(parsed.args.rolledNumber),
          won: parsed.args.won,
          payout: ethers.formatEther(parsed.args.payout)
        };
        setLastResult(result);
        setPendingBet(null);
        return result;
      }

      // Check for BetExpired event
      const expiredEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'BetExpired';
        } catch {
          return false;
        }
      });

      if (expiredEvent) {
        setError('Bet expired - tokens refunded');
        setPendingBet(null);
        return null;
      }

      return null;
    } catch (err) {
      console.error('Error rolling dice:', err);
      setError(err.reason || err.message || 'Failed to roll dice');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Check if bet can be rolled
  const canRoll = useCallback(async (betId) => {
    if (!contract) return { canExecute: false, reason: 'Contract not connected' };
    try {
      const result = await contract.canRoll(betId);
      return { canExecute: result.canExecute, reason: result.reason };
    } catch (err) {
      return { canExecute: false, reason: err.message };
    }
  }, [contract]);

  // Cancel a pending bet (if not yet rollable)
  const cancelBet = useCallback(async (betId) => {
    if (!contract) {
      setError('Contract not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.cancelBet(betId);
      await tx.wait();
      setPendingBet(null);
      return true;
    } catch (err) {
      console.error('Error cancelling bet:', err);
      setError(err.reason || err.message || 'Failed to cancel bet');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Fund the house bankroll
  const fundHouse = useCallback(async (amount) => {
    if (!contract) {
      setError('Contract not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const amountWei = ethers.parseEther(amount.toString());

      // Approve tokens
      const blueTokenAddress = await contract.blueToken();
      const blueToken = new ethers.Contract(
        blueTokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        await contract.runner
      );

      const approveTx = await blueToken.approve(contractConfig.address, amountWei);
      await approveTx.wait();

      // Fund house
      const tx = await contract.fundHouse(amountWei);
      await tx.wait();

      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error funding house:', err);
      setError(err.reason || err.message || 'Failed to fund house');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, fetchStats]);

  // Auto-fetch stats
  useEffect(() => {
    if (contract) {
      fetchStats();
      const interval = setInterval(fetchStats, 10000);
      return () => clearInterval(interval);
    }
  }, [contract, fetchStats]);

  return {
    contract,
    loading,
    error,
    stats,
    limits,
    playerBets,
    pendingBet,
    lastResult,
    fetchStats,
    fetchPlayerBets,
    calculatePayout,
    placeBet,
    rollDice,
    canRoll,
    cancelBet,
    fundHouse,
    clearError: () => setError(null),
    clearResult: () => setLastResult(null)
  };
}
