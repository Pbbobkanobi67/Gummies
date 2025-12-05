import React from 'react';

export function DocsPage() {
  return (
    <div className="docs-page">
      <div className="page-header">
        <h1>📚 Blue Raffle Documentation</h1>
        <p>Learn how to play and understand the mechanics of Blue Raffle</p>
      </div>

      <div className="docs-card">
        <h2>🎰 How to Play</h2>
        <p>
          Blue Raffle is a simple and fair lottery game built on the Binance Smart Chain.
          Players buy tickets using BLUE tokens, and one lucky winner takes home the prize pool!
        </p>

        <h3>Step-by-Step Guide</h3>
        <ul>
          <li>Connect your MetaMask or compatible Web3 wallet</li>
          <li>Make sure you're on BSC Testnet (Chain ID: 97)</li>
          <li>Purchase BLUE tokens from <a href="https://bluebnb.xyz" target="_blank" rel="noopener noreferrer">bluebnb.xyz</a></li>
          <li>Enter the amount of BLUE tokens you want to spend</li>
          <li>Click "Buy Tickets" and approve the transaction</li>
          <li>Wait for the round to complete and the winner to be drawn</li>
          <li>Check your history and stats in the Analytics page</li>
        </ul>
      </div>

      <div className="docs-card">
        <h2>🎲 How the Draw Works</h2>
        <p>
          Blue Raffle uses a provably fair two-step drawing process powered by blockchain randomness:
        </p>

        <h3>Step 1: Request Draw</h3>
        <p>
          When the round timer expires, anyone can trigger "Request Draw". This captures the future blockhash
          as a random seed. The blockhash from a future block ensures true randomness that cannot be predicted
          or manipulated.
        </p>

        <h3>Step 2: Execute Draw</h3>
        <p>
          After the seed block is mined, "Execute Draw" selects the winner using the captured blockhash.
          The winner is chosen proportionally based on ticket ownership - more tickets = higher chance to win!
        </p>

        <h3>Provably Fair</h3>
        <p>
          All draws are recorded on-chain with the blockhash seed. You can verify any draw's fairness by
          checking the transaction on BSCScan and seeing the exact blockhash used for randomness.
        </p>
      </div>

      <div className="docs-card">
        <h2>💰 Prize Distribution</h2>
        <ul>
          <li><strong>90%</strong> goes to the winner</li>
          <li><strong>5%</strong> goes to the house fee</li>
          <li><strong>5%</strong> goes to the burn address (deflationary)</li>
        </ul>
      </div>

      <div className="docs-card">
        <h2>❓ FAQ</h2>

        <h3>What are my odds of winning?</h3>
        <p>
          Your odds are proportional to how many tickets you own versus the total tickets in the round.
          For example, if you own 10 tickets out of 100 total, you have a 10% chance to win.
        </p>

        <h3>What happens if I'm the only player?</h3>
        <p>
          Rounds require a minimum of 2 unique participants to start. If only one person has bought
          tickets, the round will remain in "Waiting" status until another player joins.
        </p>

        <h3>Can I play from mobile?</h3>
        <p>
          Yes! Use a mobile Web3 browser like MetaMask Mobile or Trust Wallet to connect and play.
        </p>

        <h3>Is this contract audited?</h3>
        <p>
          The smart contract is open source and can be verified on BSCScan. Always do your own research
          and only play with amounts you can afford to lose.
        </p>
      </div>

      <div className="docs-card" style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6' }}>
        <h2>📖 Blue Protocol Documentation</h2>
        <p style={{ marginBottom: '20px' }}>
          Learn more about the Blue Protocol ecosystem, tokenomics, and platform features.
        </p>
        <a href="https://www.bluebnb.xyz/docs" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          📖 View Blue Protocol Docs →
        </a>
      </div>

      <div className="docs-card">
        <h2>⚠️ Disclaimer</h2>
        <p>
          Blue Raffle is currently running on <strong>BSC Testnet</strong> for testing purposes.
          No real money is at risk. This is experimental software - use at your own risk.
        </p>
      </div>
    </div>
  );
}
