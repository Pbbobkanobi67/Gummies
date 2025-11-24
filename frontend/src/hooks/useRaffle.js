import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import contractConfig from '../config/contract.json';
import contractABI from '../config/abi.json';

const ROUND_STATUS = {
  0: 'Waiting',
  1: 'Active',
  2: 'Drawing',
  3: 'Complete',
  4: 'Cancelled',
};

export function useRaffle(provider, signer, account) {
  const [contract, setContract] = useState(null);
  const [roundInfo, setRoundInfo] = useState(null);
  const [userTickets, setUserTickets] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract
  useEffect(() => {
    if (signer && contractABI.length > 0) {
      const raffleContract = new ethers.Contract(
        contractConfig.address,
        contractABI,
        signer
      );
      setContract(raffleContract);
    } else if (provider && contractABI.length > 0) {
      const raffleContract = new ethers.Contract(
        contractConfig.address,
        contractABI,
        provider
      );
      setContract(raffleContract);
    }
  }, [provider, signer]);

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
      setError(err.message);
    }
  }, [contract, account]);

  // Auto-refresh round info
  useEffect(() => {
    if (contract) {
      fetchRoundInfo();
      const interval = setInterval(fetchRoundInfo, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [contract, fetchRoundInfo]);

  // Buy tickets
  const buyTickets = async (blueAmount) => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const amount = ethers.parseEther(blueAmount.toString());

      // First, approve BLUE token
      const blueTokenAddress = await contract.blueToken();
      const blueToken = new ethers.Contract(
        blueTokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );

      console.log('Approving BLUE tokens...');
      const approveTx = await blueToken.approve(contractConfig.address, amount);
      await approveTx.wait();

      console.log('Buying tickets...');
      const buyTx = await contract.buyTickets(amount);
      await buyTx.wait();

      console.log('Tickets purchased successfully!');
      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error buying tickets:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Request draw
  const requestDraw = async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Requesting draw...');
      const tx = await contract.requestDraw();
      await tx.wait();

      console.log('Draw requested successfully!');
      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error requesting draw:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Execute draw
  const executeDraw = async () => {
    if (!contract || !signer) {
      setError('Wallet not connected');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Executing draw...');
      const tx = await contract.executeDraw();
      await tx.wait();

      console.log('Winner selected!');
      await fetchRoundInfo();
      return true;
    } catch (err) {
      console.error('Error executing draw:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if can request draw
  const canRequestDraw = useCallback(async () => {
    if (!contract) return { canRequest: false, reason: 'Contract not loaded' };

    try {
      const result = await contract.canRequestDraw();
      return {
        canRequest: result[0],
        reason: result[1],
      };
    } catch (err) {
      return { canRequest: false, reason: err.message };
    }
  }, [contract]);

  // Check if can execute draw
  const canExecuteDraw = useCallback(async () => {
    if (!contract) return { canExecute: false, reason: 'Contract not loaded' };

    try {
      const result = await contract.canExecuteDraw();
      return {
        canExecute: result[0],
        reason: result[1],
      };
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
    refreshRoundInfo: fetchRoundInfo,
  };
}
