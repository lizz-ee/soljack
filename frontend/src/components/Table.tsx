import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function Table() {
  const { currentTableId, setCurrentTableId } = useGame();
  const [gameState, setGameState] = useState<'WAITING' | 'SHUFFLING' | 'ACTIVE' | 'SETTLED'>('WAITING');
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [dealerHand, setDealerHand] = useState<number[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<'DEALER' | 'PLAYER' | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(60);

  useEffect(() => {
    // TODO: WebSocket connection to listen for game events
  }, [currentTableId]);

  const handleHit = () => {
    // TODO: Call hit instruction
  };

  const handleStand = () => {
    // TODO: Call stand instruction
  };

  const handleLeave = () => {
    setCurrentTableId(null);
  };

  const handlePlayAgain = () => {
    // TODO: Call rematch instruction
  };

  if (gameState === 'WAITING') {
    return (
      <div style={styles.container}>
        <div style={styles.table}>
          <div style={styles.waitingOverlay}>
            <h2 style={styles.waitingText}>Waiting for opponent...</h2>
            <div style={styles.timer}>Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</div>
            <button
              style={styles.leaveButton}
              onClick={handleLeave}
              disabled={timeRemaining > 120}
            >
              {timeRemaining > 120 ? Can leave in ${Math.floor((timeRemaining - 120) / 60)}:${((timeRemaining - 120) % 60).toString().padStart(2, '0')} : 'Leave Table'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'SHUFFLING') {
    return (
      <div style={styles.container}>
        <div style={styles.table}>
          <div style={styles.shuffleOverlay}>
            <h2 style={styles.shuffleText}>Generating Fair Deck...</h2>
            <div style={styles.shuffleAnimation}>🃏 🂠 🂡 🂢</div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'SETTLED') {
    return (
      <div style={styles.container}>
        <div style={styles.table}>
          <div style={styles.resultsOverlay}>
            <h2 style={styles.resultText}>You Won!</h2>
            <div style={styles.finalHands}>
              <div>
                <div style={styles.handLabel}>Your Hand: {playerTotal}</div>
                <div style={styles.cards}>
                  {playerHand.map((card, i) => (
                    <div key={i} style={styles.card}>{card}</div>
                  ))}
                </div>
              </div>
              <div>
                <div style={styles.handLabel}>Dealer Hand: {dealerTotal}</div>
                <div style={styles.cards}>
                  {dealerHand.map((card, i) => (
                    <div key={i} style={styles.card}>{card}</div>
                  ))}
                </div>
              </div>
            </div>
            <div style={styles.resultActions}>
              <button style={styles.playAgainButton} onClick={handlePlayAgain}>
                Play Again
              </button>
              <button style={styles.leaveButton} onClick={handleLeave}>
                Leave Table
              </button>
              <button style={styles.shareButton}>
                Share on 𝕏
              </button>
            </div>
            <div style={styles.rematchTimer}>
              Both players must agree within {timeRemaining}s
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE state
  return (
    <div style={styles.container}>
      <div style={styles.betDisplay}>0.1 SOL</div>
      
      <div style={styles.table}>
        {/* Dealer section */}
        <div style={styles.dealerSection}>
          <div style={styles.playerInfo}>
            <span>Dealer</span>
            {currentTurn === 'DEALER' && (
              <div style={styles.turnIndicator}>
                <div style={styles.timerRing}>{timeRemaining}</div>
              </div>
            )}
          </div>
          <div style={styles.cards}>
            {dealerHand.map((card, i) => (
              <div key={i} style={styles.card}>
                {i === 1 && currentTurn === 'PLAYER' ? '🂠' : card}
              </div>
            ))}
          </div>
          <div style={styles.total}>{currentTurn === 'DEALER' ? dealerTotal : dealerHand[0]}</div>
          
          {currentTurn === 'DEALER' && (
            <div style={styles.actionButtons}>
              <button style={styles.actionButton} onClick={handleStand}>
                Stand
              </button>
              <button style={styles.actionButton} onClick={handleHit}>
                Hit
              </button>
            </div>
          )}
        </div>

        {/* Player section */}
        <div style={styles.playerSection}>
          <div style={styles.playerInfo}>
            <span>Player</span>
            {currentTurn === 'PLAYER' && (
              <div style={styles.turnIndicator}>
                <div style={styles.timerRing}>{timeRemaining}</div>
              </div>
            )}
          </div>
          <div style={styles.cards}>
            {playerHand.map((card, i) => (
              <div key={i} style={styles.card}>{card}</div>
            ))}
          </div>
          <div style={styles.total}>{playerTotal}</div>

          {currentTurn === 'PLAYER' && (
            <div style={styles.actionButtons}>
              <button style={styles.actionButton} onClick={handleStand}>
                Stand
              </button>
              <button style={styles.actionButton} onClick={handleHit}>
                Hit
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        🏆 First username to 100 wins receives creator rewards from Pump.Fun token launch
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  betDisplay: {
    position: 'fixed',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(255, 255, 255, 0.5)',
    padding: '15px 20px',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  table: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#1a1a1a',
    margin: '20px',
    borderRadius: '200px 200px 0 0',
    padding: '40px',
    position: 'relative',
  },
  dealerSection: {
    marginBottom: '60px',
    textAlign: 'center',
  },
  playerSection: {
    marginTop: '60px',
    textAlign: 'center',
  },
  playerInfo: {
    color: 'white',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  turnIndicator: {
    position: 'relative',
  },
  timerRing: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    animation: 'pulse 1s infinite',
  },
  cards: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '15px',
  },
  card: {
    width: '80px',
    height: '120px',
    background: 'white',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  total: {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  actionButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  actionButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    transition: 'all 0.3s ease',
  },
  waitingOverlay: {
    textAlign: 'center',
    color: 'white',
  },
  waitingText: {
    fontSize: '32px',
    marginBottom: '20px',
  },
  timer: {
    fontSize: '24px',
    marginBottom: '30px',
  },
  leaveButton: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.3)',
  },
  shuffleOverlay: {
    textAlign: 'center',
    color: 'white',
  },
  shuffleText: {
    fontSize: '32px',
    marginBottom: '20px',
  },
  shuffleAnimation: {
    fontSize: '48px',
    animation: 'shuffle 1s infinite',
  },
  resultsOverlay: {
    textAlign: 'center',
    color: 'white',
  },
  resultText: {
    fontSize: '48px',
    marginBottom: '30px',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  finalHands: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  handLabel: {
    fontSize: '18px',
    marginBottom: '10px',
  },
  resultActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  playAgainButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
    color: 'white',
  },
  shareButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
  },
  rematchTimer: {
    fontSize: '16px',
    opacity: 0.7,
  },
  footer: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    background: 'rgba(255, 255, 255, 0.3)',
  },
};