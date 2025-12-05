import React from 'react';
import { Link } from 'react-router-dom';
import { useGameContext } from '../contexts/GameContext';

function CasinoPage({ wallet, dice, progressive, raffle }) {
  // Get games from context (with fallback handling)
  let contextGames = [];
  let useContractData = false;
  try {
    const gameContext = useGameContext();
    contextGames = gameContext.visibleGames || [];
    useContractData = gameContext.useContractData;
  } catch (e) {
    // Context not available, use default games
  }
  // Calculate aggregated stats
  const diceStats = dice?.stats || {};
  const progressiveStats = progressive?.stats || {};
  const raffleInfo = raffle?.roundInfo || {};

  const totalWagered = (parseFloat(diceStats.totalWagered) || 0) +
                       (parseFloat(progressiveStats.totalPaidOut) || 0);
  const totalPaidOut = (parseFloat(diceStats.totalPaidOut) || 0) +
                       (parseFloat(progressiveStats.totalPaidOut) || 0);
  const totalBets = (diceStats.totalBets || 0) + (progressiveStats.totalRolls || 0);

  // Estimate BLUE token benefits based on house edge distribution
  // Classic Dice: 3% house edge (2% treasury, 1% burn)
  // Progressive: On jackpot - 3% treasury, 3% burn, 2% dev
  const estimatedBurned = (parseFloat(diceStats.totalWagered) || 0) * 0.01;
  const estimatedTreasury = (parseFloat(diceStats.totalWagered) || 0) * 0.02;
  const jackpotsBurned = (progressiveStats.totalJackpotsWon || 0) *
                         (parseFloat(progressiveStats.jackpotPool) || 0) * 0.03;
  const jackpotsTreasury = (progressiveStats.totalJackpotsWon || 0) *
                           (parseFloat(progressiveStats.jackpotPool) || 0) * 0.03;

  const totalBurned = estimatedBurned + jackpotsBurned;
  const totalTreasury = estimatedTreasury + jackpotsTreasury;

  // Check if slots is visible from GameManager
  const slotsGame = contextGames.find(g => g.id === 'slots');
  const showSlots = slotsGame?.visible || false;

  const games = [
    {
      id: 'dice',
      name: 'Classic Dice',
      description: 'Roll the dice with 5 bet types. Exact number, over/under, odd/even.',
      icon: '🎲',
      path: '/dice',
      stats: {
        'House Edge': '3%',
        'Max Payout': '5.82x',
        'Bets Placed': diceStats.totalBets?.toLocaleString() || '0'
      },
      highlight: diceStats.houseBankroll ?
        `${parseFloat(diceStats.houseBankroll).toLocaleString()} BLUE Bankroll` : null,
      color: 'blue'
    },
    {
      id: 'progressive',
      name: 'Progressive Jackpot',
      description: 'Match 4 dice to win the growing jackpot. Tiered payouts for partial matches.',
      icon: '🎰',
      path: '/progressive',
      stats: {
        'Ticket Price': `${progressiveStats.ticketPrice || '1'} BLUE`,
        'Jackpot Win': '80%',
        'Total Rolls': progressiveStats.totalRolls?.toLocaleString() || '0'
      },
      highlight: progressiveStats.jackpotPool ?
        `${parseFloat(progressiveStats.jackpotPool).toLocaleString()} BLUE Jackpot` : null,
      color: 'gold'
    },
    {
      id: 'raffle',
      name: 'Blue Raffle',
      description: 'Buy tickets for a chance to win the prize pool. Fair and transparent draws.',
      icon: '🎟️',
      path: '/raffle',
      stats: {
        'Min Entry': '5 BLUE',
        'Prize Pool': '94%',
        'Round': `#${raffleInfo.roundId || 1}`
      },
      highlight: raffleInfo.prizePool ?
        `${parseFloat(raffleInfo.prizePool).toLocaleString()} BLUE Prize Pool` :
        (raffle?.contract ? 'Active' : 'Deploy Contract'),
      color: 'purple'
    },
    // Slots - only shown when visible in GameManager
    ...(showSlots ? [{
      id: 'slots',
      name: 'Blue Slots',
      description: '3-reel slot machine with multiple winning combinations and bonuses.',
      icon: '🎰',
      path: '/slots',
      stats: {
        'Min Bet': '1 BLUE',
        'Max Win': '50x',
        'RTP': '96%'
      },
      highlight: slotsGame?.enabled ? 'Now Live!' : 'Coming Soon',
      color: 'green',
      comingSoon: !slotsGame?.enabled
    }] : [])
  ];

  return (
    <div className="casino-page">
      {/* Combined Hero Section */}
      <section className="casino-hero-combined">
        <div className="hero-main">
          <h2>Welcome to Blue Casino</h2>
          <p className="hero-subtitle">Provably fair gaming powered by BLUE token on BSC</p>

          <div className="hero-highlights">
            <div className="hero-highlight">
              <span className="highlight-icon">🏆</span>
              <div className="highlight-content">
                <span className="highlight-value gold">{parseFloat(progressiveStats.jackpotPool || 0).toLocaleString()}</span>
                <span className="highlight-label">BLUE Jackpot</span>
              </div>
            </div>
            <div className="hero-highlight">
              <span className="highlight-icon">💎</span>
              <div className="highlight-content">
                <span className="highlight-value">5.82x</span>
                <span className="highlight-label">Max Payout</span>
              </div>
            </div>
            <div className="hero-highlight">
              <span className="highlight-icon">⚡</span>
              <div className="highlight-content">
                <span className="highlight-value">Instant</span>
                <span className="highlight-label">Payouts</span>
              </div>
            </div>
            <div className="hero-highlight">
              <span className="highlight-icon">🔒</span>
              <div className="highlight-content">
                <span className="highlight-value">100%</span>
                <span className="highlight-label">On-Chain</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-ecosystem">
          <h4>Supporting the BLUE Ecosystem</h4>
          <div className="ecosystem-benefits">
            <div className="eco-benefit">
              <span className="eco-icon">🔥</span>
              <span className="eco-text">1-3% of bets <strong>burned</strong></span>
            </div>
            <div className="eco-benefit">
              <span className="eco-icon">🏛️</span>
              <span className="eco-text">2-3% to <strong>treasury</strong></span>
            </div>
            <div className="eco-benefit">
              <span className="eco-icon">🌊</span>
              <span className="eco-text">{((parseFloat(diceStats.houseBankroll) || 0) + (parseFloat(progressiveStats.jackpotPool) || 0)).toLocaleString()} BLUE <strong>liquidity</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="games-section">
        <h3>Blue Casino Game Room</h3>
        <div className="games-grid">
          {games.map(game => (
            <div key={game.id} className={`game-card ${game.color}`}>
              <div className="game-icon">{game.icon}</div>
              <h4>{game.name}</h4>
              <p className="game-desc">{game.description}</p>

              {game.highlight && (
                <div className="game-highlight">{game.highlight}</div>
              )}

              <div className="game-stats">
                {Object.entries(game.stats).map(([label, value]) => (
                  <div key={label} className="game-stat-row">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>

              {game.comingSoon ? (
                <button className="btn btn-secondary game-btn" disabled>
                  Coming Soon
                </button>
              ) : game.externalUrl ? (
                <a
                  href={game.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary game-btn"
                >
                  Play {game.name}
                </a>
              ) : (
                <Link
                  to={game.path}
                  className="btn btn-primary game-btn"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Play {game.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h3>How Blue Casino Works</h3>
        <div className="steps-grid">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Connect Wallet</h4>
            <p>Connect your MetaMask or compatible wallet to BSC Testnet</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Get BLUE Tokens</h4>
            <p>Acquire BLUE tokens to use across all casino games</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Choose a Game</h4>
            <p>Pick from Classic Dice, Progressive Jackpot, or Raffle</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Play & Win</h4>
            <p>All games use provably fair blockhash randomness</p>
          </div>
        </div>
      </section>

      {/* Provably Fair */}
      <section className="provably-fair">
        <h3>Provably Fair Gaming</h3>
        <p>
          All Blue Casino games use Binance Smart Chain blockhash for randomness.
          Results are determined by on-chain data that cannot be manipulated.
          Every bet, roll, and draw can be independently verified on the blockchain.
        </p>
      </section>
    </div>
  );
}

export default CasinoPage;
