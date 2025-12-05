import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../config/raffleContract.json';
import contractABI from '../config/raffleAbi.json';

const ROUND_STATUS = {
  0: 'Waiting',
  1: 'Active',
  2: 'Drawing',
  3: 'Complete',
  4: 'Cancelled',
};

export function useRaffle(signer, account) {
  const [contract, setContract] = useState(null);
  const [roundInfo, setRoundInfo] = useState(null);
  const [userTickets, setUserTickets] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && contractConfig.address !== '0x0000000000000000000000000000000000000000') {
      const raffleContract = new ethers.Contract(
        contractConfig.address,
        contractABI,
        signer
      );
      setContract(raffleContract);
    } else {
      setContract(null);
    }
  }, [signer]);

  // Fetch round info
  const fetchRoundInfo = useCallback(async () => {
    if (!contract) return;

    try {
      const info = await contract.getCurrentRoundInfo();

      const roundData = {
        roundId: info.roundId.toString(),
        startTime: Number(info.startTime),
        endTime: Number(info.endTime),
        prizePool: ethers.formatEther(info.prizePool),
        totalTickets: ethers.formatEther(info.totalTickets),
        uniqueWallets: info.uniqueWallets.toString(),
        status: ROUND_STATUS[info.status],
        statusCode: Number(info.status),
        timeRemaining: Number(info.timeRemaining),
      };

      setRoundInfo(roundData);

      // Fetch user tickets if connected
      if (account && info.roundId) {
        const tickets = await contract.getUserTickets(info.roundId, account);
        setUserTickets(ethers.formatEther(tickets));
      }
    } catch (err) {
      console.error('Error fetching round info:', err);
    }
  }, [contract, account]);

  // Auto-refresh round info
  useEffect(() => {
    if (contract) {
      fetchRoundInfo();
      const interval = setInterval(fetchRoundInfo, 5000);
      return () => clearInterval(interval);
    }
  }, [contract, account, fetchRoundInfo]);

  // Buy tickets
  const buyTickets = useCallback(async (blueAmount) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const amount = ethers.parseEther(blueAmount.toString());

      // Approve BLUE token (use max approval to avoid repeated approvals)
      const blueTokenAddress = await contract.blueToken();
      const blueToken = new ethers.Contract(
        blueTokenAddress,
        [
          'function approve(address spender, uint256 amount) returns (bool)',
          'function allowance(address owner, address spender) view returns (uint256)'
        ],
        signer
      );

      const signerAddress = await signer.getAddress();
      const allowance = await blueToken.allowance(signerAddress, contractConfig.address);

      if (allowance < amount) {
        // Approve max uint256 so user only needs to approve once
        const approveTx = await blueToken.approve(contractConfig.address, ethers.MaxUint256);
        await approveTx.wait();
      }

      // Buy tickets
      const buyTx = await contract.buyTickets(amount);
      await buyTx.wait();

      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error buying tickets:', err);
      setError(err.reason || err.message || 'Failed to buy tickets');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, fetchRoundInfo]);

  // Request draw
  const requestDraw = useCallback(async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.requestDraw();
      await tx.wait();

      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error requesting draw:', err);
      setError(err.reason || err.message || 'Failed to request draw');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, fetchRoundInfo]);

  // Execute draw
  const executeDraw = useCallback(async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.executeDraw();
      await tx.wait();

      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error executing draw:', err);
      setError(err.reason || err.message || 'Failed to execute draw');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, fetchRoundInfo]);

  // Check if can request draw
  const canRequestDraw = useCallback(async () => {
    if (!contract) return { canRequest: false, reason: 'Contract not loaded' };

    try {
      const result = await contract.canRequestDraw();
      return { canRequest: result[0], reason: result[1] };
    } catch (err) {
      return { canRequest: false, reason: err.message };
    }
  }, [contract]);

  // Check if can execute draw
  const canExecuteDraw = useCallback(async () => {
    if (!contract) return { canExecute: false, reason: 'Contract not loaded' };

    try {
      const result = await contract.canExecuteDraw();
      return { canExecute: result[0], reason: result[1] };
    } catch (err) {
      return { canExecute: false, reason: err.message };
    }
  }, [contract]);

  // Get previous round winner
  const getPreviousRoundWinner = useCallback(async () => {
    if (!contract || !roundInfo) return null;

    try {
      const prevRoundId = parseInt(roundInfo.roundId) - 1;
      if (prevRoundId < 1) return null;

      const details = await contract.getRoundDetails(prevRoundId);
      return {
        winner: details.winner,
        prize: ethers.formatEther(details.winnerPrize),
        roundId: prevRoundId,
      };
    } catch (err) {
      console.error('Error fetching previous round:', err);
      return null;
    }
  }, [contract, roundInfo]);

  // Admin: Cancel round
  const cancelRound = useCallback(async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.cancelRound();
      await tx.wait();

      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error cancelling round:', err);
      setError(err.reason || err.message || 'Failed to cancel round');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, signer, fetchRoundInfo]);

  // Admin: Set bonus multiplier
  const setBonusMultiplier = useCallback(async (multiplier) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await contract.setBonusMultiplier(multiplier);
      await tx.wait();

      return true;
    } catch (err) {
      console.error('Error setting bonus multiplier:', err);
      setError(err.reason || err.message || 'Failed to set bonus multiplier');
      return false;
    } finally {
      setLoading(false);
    }
  }, [contract, signer]);

  return {
    contract,
    roundInfo,
    userTickets,
    loading,
    error,
    buyTickets,
    requestDraw,
    executeDraw,
    canRequestDraw,
    canExecuteDraw,
    getPreviousRoundWinner,
    cancelRound,
    setBonusMultiplier,
    refreshRoundInfo: fetchRoundInfo,
    clearError: () => setError(null),
  };
}
