import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../config/progressiveContract.json';
import contractABI from '../config/progressiveAbi.json';

// Roll status enum
export const RollStatus = {
  Pending: 0,
  Completed: 1,
  Expired: 2,
  Cancelled: 3
};

export const RollStatusLabels = {
  [RollStatus.Pending]: 'Pending',
  [RollStatus.Completed]: 'Completed',
  [RollStatus.Expired]: 'Expired',
  [RollStatus.Cancelled]: 'Cancelled'
};

export function useProgressive(signer) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract state
  const [stats, setStats] = useState(null);
  const [targetDice, setTargetDice] = useState(null);
  const [payouts, setPayouts] = useState(null);
  const [playerRolls, setPlayerRolls] = useState([]);
  const [pendingRoll, setPendingRoll] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && contractConfig.address !== '0x0000000000000000000000000000000000000000') {
      const progressiveContract = new ethers.Contract(
        contractConfig.address,
        contractABI,
        signer
      );
      setContract(progressiveContract);
    } else {
      setContract(null);
    }
  }, [signer]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!contract) return;
    try {
      const [statsData, target, potentialPayouts, paused] = await Promise.all([
        contract.getStats(),
        contract.getTargetDice(),
        contract.getPotentialPayouts(),
        contract.paused()
      ]);

      setStats({
        jackpotPool: ethers.formatEther(statsData._jackpotPool),
        currentRoundId: Number(statsData._currentRoundId),
        totalRolls: Number(statsData._totalRolls),
        totalJackpotsWon: Number(statsData._totalJackpotsWon),
        totalPaidOut: ethers.formatEther(statsData._totalPaidOut),
        ticketPrice: ethers.formatEther(statsData._ticketPrice),
        paused
      });

      setTargetDice({
        die1: Number(target.die1),
        die2: Number(target.die2),
        die3: Number(target.die3),
        die4: Number(target.die4),
        roundId: Number(target.roundId),
        isRevealed: target.isRevealed
      });

      setPayouts({
        jackpot: ethers.formatEther(potentialPayouts.jackpotPayout),
        match3: ethers.formatEther(potentialPayouts.match3Payout),
        match2: ethers.formatEther(potentialPayouts.match2Payout)
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [contract]);

  // Fetch player rolls
  const fetchPlayerRolls = useCallback(async (playerAddress) => {
    if (!contract || !playerAddress) return;
    try {
      const recentRolls = await contract.getPlayerRecentRolls(playerAddress, 10);
      const formatted = recentRolls.map((roll, index) => ({
        id: index,
        player: roll.player,
        requestBlock: Number(roll.requestBlock),
        status: Number(roll.status),
        rolledDice: roll.rolledDice.map(d => Number(d)),
        matches: Number(roll.matches),
        payout: ethers.formatEther(roll.payout),
        timestamp: Number(roll.timestamp)
      }));
      setPlayerRolls(formatted);
    } catch (err) {
      console.error('Error fetching player rolls:', err);
    }
  }, [contract]);

  // Set target dice (step 1)
  const setTargetDiceAction = useCallback(async () => {
    if (!contract) {
      setError('Contract not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.setTargetDice();
      await tx.wait();
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error setting target dice:', err);
      setError(err.reason || err.message || 'Failed to set target dice');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, fetchStats]);

  // Reveal target dice (step 2)
  const revealTargetDice = useCallback(async () => {
    if (!contract) {
      setError('Contract not connected');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.revealTargetDice();
      await tx.wait();
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error revealing target dice:', err);
      setError(err.reason || err.message || 'Failed to reveal target dice');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, fetchStats]);

  // Buy a roll
  const buyRoll = useCallback(async () => {
    if (!contract) {
      setError('Contract not connected');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastResult(null);

    try {
      // Get ticket price
      const ticketPrice = await contract.ticketPrice();

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

      if (allowance < ticketPrice) {
        const approveTx = await blueToken.approve(contractConfig.address, ticketPrice);
        await approveTx.wait();
      }

      // Buy roll
      const tx = await contract.buyRoll();
      const receipt = await tx.wait();

      // Find RollRequested event
      const rollEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RollRequested';
        } catch {
          return false;
        }
      });

      if (rollEvent) {
        const parsed = contract.interface.parseLog(rollEvent);
        const rollId = Number(parsed.args.rollId);
        setPendingRoll({ id: rollId });
        return rollId;
      }

      return null;
    } catch (err) {
      console.error('Error buying roll:', err);
      setError(err.reason || err.message || 'Failed to buy roll');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Reveal roll
  const revealRoll = useCallback(async (rollId) => {
    if (!contract) {
      setError('Contract not connected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = await contract.revealRoll(rollId);
      const receipt = await tx.wait();

      // Find RollCompleted event
      const completedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RollCompleted';
        } catch {
          return false;
        }
      });

      if (completedEvent) {
        const parsed = contract.interface.parseLog(completedEvent);
        const result = {
          rollId: Number(parsed.args.rollId),
          rolledDice: parsed.args.rolledDice.map(d => Number(d)),
          matches: Number(parsed.args.matches),
          payout: ethers.formatEther(parsed.args.payout),
          isJackpot: parsed.args.isJackpot
        };
        setLastResult(result);
        setPendingRoll(null);
        await fetchStats();
        return result;
      }

      // Check for expired
      const expiredEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'RollExpired';
        } catch {
          return false;
        }
      });

      if (expiredEvent) {
        setError('Roll expired - ticket refunded');
        setPendingRoll(null);
        return null;
      }

      return null;
    } catch (err) {
      console.error('Error revealing roll:', err);
      setError(err.reason || err.message || 'Failed to reveal roll');
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract, fetchStats]);

  // Check if roll can be revealed
  const canRevealRoll = useCallback(async (rollId) => {
    if (!contract) return { canReveal: false, reason: 'Contract not connected' };
    try {
      const result = await contract.canRevealRoll(rollId);
      return { canReveal: result.canReveal, reason: result.reason };
    } catch (err) {
      return { canReveal: false, reason: err.message };
    }
  }, [contract]);

  // Fund jackpot
  const fundJackpot = useCallback(async (amount) => {
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

      // Fund jackpot
      const tx = await contract.fundJackpot(amountWei);
      await tx.wait();

      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error funding jackpot:', err);
      setError(err.reason || err.message || 'Failed to fund jackpot');
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
    targetDice,
    payouts,
    playerRolls,
    pendingRoll,
    lastResult,
    fetchStats,
    fetchPlayerRolls,
    setTargetDice: setTargetDiceAction,
    revealTargetDice,
    buyRoll,
    revealRoll,
    canRevealRoll,
    fundJackpot,
    clearError: () => setError(null),
    clearResult: () => setLastResult(null)
  };
}
