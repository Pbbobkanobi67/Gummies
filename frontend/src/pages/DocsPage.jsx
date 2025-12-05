import React from 'react';

function DocsPage() {
  return (
    <div className="docs-page">
      {/* Hero */}
      <section className="docs-hero">
        <h1>Blue Casino Documentation</h1>
        <p>Learn how our provably fair games work and how they benefit the BLUE ecosystem</p>
      </section>

      {/* Ecosystem Benefits */}
      <section className="docs-section ecosystem-benefits">
        <h2>Why Blue Casino Benefits BLUE Protocol</h2>
        <p className="section-intro">
          Blue Casino isn't just about gaming - it's designed to create sustainable value for the entire BLUE ecosystem.
          Every bet, roll, and ticket purchase contributes to the health of the protocol.
        </p>

        <div className="benefits-list">
          <div className="benefit-item burn">
            <div className="benefit-icon">🔥</div>
            <div className="benefit-content">
              <h3>Token Burns</h3>
              <p>1-3% of all wagers are permanently burned, reducing supply and increasing scarcity.</p>
            </div>
            <div className="benefit-value">1% per bet</div>
          </div>

          <div className="benefit-item treasury">
            <div className="benefit-icon">🏛️</div>
            <div className="benefit-content">
              <h3>Treasury Growth</h3>
              <p>2-3% flows to the BLUE treasury for development and ecosystem growth.</p>
            </div>
            <div className="benefit-value">2% to treasury</div>
          </div>

          <div className="benefit-item liquidity">
            <div className="benefit-icon">🌊</div>
            <div className="benefit-content">
              <h3>Locked Liquidity</h3>
              <p>Bankrolls and prize pools lock BLUE in smart contracts, reducing circulating supply.</p>
            </div>
            <div className="benefit-value">TVL Growing</div>
          </div>

          <div className="benefit-item utility">
            <div className="benefit-icon">⚡</div>
            <div className="benefit-content">
              <h3>Real Utility</h3>
              <p>Genuine use case for BLUE tokens - players need them to participate.</p>
            </div>
            <div className="benefit-value">Gaming</div>
          </div>
        </div>
      </section>

      {/* Classic Dice */}
      <section className="docs-section game-docs">
        <div className="game-docs-header dice">
          <span className="game-icon">🎲</span>
          <h2>Classic Dice</h2>
        </div>

        <div className="game-docs-content">
          <div className="docs-overview">
            <h3>Overview</h3>
            <p>
              Classic Dice is a simple yet exciting dice game where you predict the outcome of a single die roll (1-6).
              Choose from 5 different bet types, each with different odds and payouts.
            </p>
          </div>

          <div className="docs-how-it-works">
            <h3>How to Play</h3>
            <ol>
              <li><strong>Connect your wallet</strong> - Make sure you're on BSC and have BLUE tokens</li>
              <li><strong>Choose a bet type</strong> - Select from Exact, Over, Under, Odd, or Even</li>
              <li><strong>Set your bet amount</strong> - Enter how much BLUE you want to wager</li>
              <li><strong>Place your bet</strong> - Approve the transaction and wait for the result</li>
              <li><strong>Collect winnings</strong> - If you win, payouts are instant and automatic</li>
            </ol>
          </div>

          <div className="docs-bet-types">
            <h3>Bet Types & Payouts</h3>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Bet Type</th>
                  <th>Description</th>
                  <th>Win Chance</th>
                  <th>Payout</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="bet-badge exact">Exact</span></td>
                  <td>Predict the exact number (1-6)</td>
                  <td>16.67%</td>
                  <td>5.82x</td>
                </tr>
                <tr>
                  <td><span className="bet-badge over">Over</span></td>
                  <td>Roll higher than your chosen number</td>
                  <td>Varies</td>
                  <td>1.94x - 5.82x</td>
                </tr>
                <tr>
                  <td><span className="bet-badge under">Under</span></td>
                  <td>Roll lower than your chosen number</td>
                  <td>Varies</td>
                  <td>1.94x - 5.82x</td>
                </tr>
                <tr>
                  <td><span className="bet-badge odd">Odd</span></td>
                  <td>Roll lands on 1, 3, or 5</td>
                  <td>50%</td>
                  <td>1.94x</td>
                </tr>
                <tr>
                  <td><span className="bet-badge even">Even</span></td>
                  <td>Roll lands on 2, 4, or 6</td>
                  <td>50%</td>
                  <td>1.94x</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="docs-house-edge">
            <h3>House Edge Distribution</h3>
            <p>Classic Dice has a 3% house edge, distributed as follows:</p>
            <div className="edge-distribution">
              <div className="edge-item">
                <span className="edge-percent">1%</span>
                <span className="edge-label">Burned (deflationary)</span>
              </div>
              <div className="edge-item">
                <span className="edge-percent">2%</span>
                <span className="edge-label">Treasury (ecosystem growth)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progressive Jackpot */}
      <section className="docs-section game-docs">
        <div className="game-docs-header progressive">
          <span className="game-icon">🎰</span>
          <h2>Progressive Jackpot</h2>
        </div>

        <div className="game-docs-content">
          <div className="docs-overview">
            <h3>Overview</h3>
            <p>
              Progressive Jackpot is an exciting 4-dice matching game where you try to match the target dice combination.
              The jackpot grows with every roll until someone hits all 4 matches and wins big!
            </p>
          </div>

          <div className="docs-how-it-works">
            <h3>How to Play</h3>
            <ol>
              <li><strong>View the target</strong> - See the 4 target dice you need to match</li>
              <li><strong>Buy a roll</strong> - Pay the ticket price (1 BLUE) to purchase a roll</li>
              <li><strong>Wait for confirmation</strong> - The blockchain needs a few blocks for randomness</li>
              <li><strong>Reveal your roll</strong> - Click reveal to see your 4 dice</li>
              <li><strong>Win based on matches</strong> - More matches = bigger prizes!</li>
            </ol>
          </div>

          <div className="docs-payouts">
            <h3>Payout Structure</h3>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Matches</th>
                  <th>Prize</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="jackpot-row">
                  <td><strong>4/4 Matches</strong></td>
                  <td>80% of Jackpot Pool</td>
                  <td>Hit the jackpot! Target dice reset after a win</td>
                </tr>
                <tr>
                  <td><strong>3/4 Matches</strong></td>
                  <td>1% of Jackpot Pool</td>
                  <td>Great match! Solid consolation prize</td>
                </tr>
                <tr>
                  <td><strong>2/4 Matches</strong></td>
                  <td>Ticket Refund</td>
                  <td>Get your entry fee back</td>
                </tr>
                <tr>
                  <td><strong>0-1 Matches</strong></td>
                  <td>No Prize</td>
                  <td>Better luck next time!</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="docs-jackpot-mechanics">
            <h3>How the Jackpot Works</h3>
            <ul>
              <li><strong>Growth:</strong> Every ticket purchase adds to the jackpot pool</li>
              <li><strong>Persistence:</strong> The jackpot keeps growing until someone wins</li>
              <li><strong>Reset:</strong> After a jackpot win, 20% remains to seed the next round</li>
              <li><strong>New Target:</strong> When jackpot is won, new random target dice are set</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Blue Raffle */}
      <section className="docs-section game-docs">
        <div className="game-docs-header raffle">
          <span className="game-icon">🎟️</span>
          <h2>Blue Raffle</h2>
        </div>

        <div className="game-docs-content">
          <div className="docs-overview">
            <h3>Overview</h3>
            <p>
              Blue Raffle is a fair lottery system where players buy tickets for a chance to win the prize pool.
              One lucky winner takes home 94% of the total pool, with 6% supporting the ecosystem.
            </p>
          </div>

          <div className="docs-how-it-works">
            <h3>How to Play</h3>
            <ol>
              <li><strong>Check the round</strong> - See the current prize pool and participant count</li>
              <li><strong>Buy tickets</strong> - Enter your desired BLUE amount (min 5 BLUE)</li>
              <li><strong>Get tickets</strong> - Receive 1 ticket per BLUE token spent</li>
              <li><strong>Wait for draw</strong> - Admin triggers the draw when ready</li>
              <li><strong>Check results</strong> - Winner is selected randomly and paid automatically</li>
            </ol>
          </div>

          <div className="docs-raffle-mechanics">
            <h3>Raffle Mechanics</h3>
            <div className="mechanics-grid">
              <div className="mechanic-item">
                <h4>Fair Selection</h4>
                <p>Winner is selected using blockhash randomness - completely on-chain and verifiable</p>
              </div>
              <div className="mechanic-item">
                <h4>Weighted Odds</h4>
                <p>More tickets = higher chance. Buy 100 tickets in a 1000 ticket pool = 10% chance to win</p>
              </div>
              <div className="mechanic-item">
                <h4>Prize Split</h4>
                <p>94% to winner, 6% to ecosystem (3% burn, 3% treasury)</p>
              </div>
              <div className="mechanic-item">
                <h4>Bonus Events</h4>
                <p>Admins can activate bonus multipliers (2x-10x tickets per BLUE) during special events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provably Fair */}
      <section className="docs-section provably-fair-docs">
        <h2>Provably Fair Gaming</h2>
        <p className="section-intro">
          All Blue Casino games use blockchain-based randomness that cannot be manipulated by anyone -
          not the house, not the players, not even the developers.
        </p>

        <div className="fair-explanation">
          <h3>How It Works</h3>
          <div className="fair-steps">
            <div className="fair-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Commit</h4>
                <p>Your bet/roll is recorded on the blockchain at a specific block number</p>
              </div>
            </div>
            <div className="fair-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Wait</h4>
                <p>The system waits for future blocks to be mined (typically 1-2 blocks)</p>
              </div>
            </div>
            <div className="fair-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Reveal</h4>
                <p>The result is determined using the blockhash of a future block - impossible to predict or manipulate</p>
              </div>
            </div>
          </div>

          <div className="verify-box">
            <h4>Verify Any Result</h4>
            <p>
              Every game result can be independently verified on the blockchain.
              Check the transaction on BSCScan to see the exact blockhash used and verify the outcome calculation.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="docs-section getting-started">
        <h2>Getting Started</h2>

        <div className="steps-list">
          <div className="start-step">
            <div className="step-icon">1</div>
            <div className="step-details">
              <h4>Get a Wallet</h4>
              <p>Install MetaMask or any BSC-compatible wallet</p>
            </div>
          </div>
          <div className="start-step">
            <div className="step-icon">2</div>
            <div className="step-details">
              <h4>Connect to BSC Testnet</h4>
              <p>Blue Casino currently runs on BSC Testnet for testing</p>
            </div>
          </div>
          <div className="start-step">
            <div className="step-icon">3</div>
            <div className="step-details">
              <h4>Get BLUE Tokens</h4>
              <p>Use the faucet or buy BLUE to start playing</p>
            </div>
          </div>
          <div className="start-step">
            <div className="step-icon">4</div>
            <div className="step-details">
              <h4>Start Playing</h4>
              <p>Choose a game and have fun!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DocsPage;
