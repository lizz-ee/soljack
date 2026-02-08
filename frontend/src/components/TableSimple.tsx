import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '../context/GameContext';
import { useGameProgram } from '../lib/anchor';
import * as crypto from 'crypto-browserify';

// Helper to convert card value to display
function cardToString(card: number): string {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const suit = suits[Math.floor(card / 13)];
  const rank = ranks[card % 13];
  return `${rank}${suit}`;
}

function ActiveGame({ tableData, tablePda, onLeave }: { tableData: any; tablePda: PublicKey; onLeave: () => void }) {
  const { publicKey } = useWallet();
  const program = useGameProgram();
  const [actionInProgress, setActionInProgress] = useState(false);

  const isCreator = tableData.creator.equals(publicKey);
  const myRole = isCreator ? tableData.creatorRole : (tableData.creatorRole.dealer ? { player: {} } : { dealer: {} });
  const myHand = isCreator ? tableData.creatorHand : tableData.opponentHand;
  const myTotal = isCreator ? tableData.creatorTotal : tableData.opponentTotal;
  const opponentHand = isCreator ? tableData.opponentHand : tableData.creatorHand;
  const opponentTotal = isCreator ? tableData.opponentTotal : tableData.creatorTotal;

  const isMyTurn = tableData.currentTurn &&
    ((tableData.currentTurn.dealer && myRole.dealer) || (tableData.currentTurn.player && myRole.player));

  const handleHit = async () => {
    if (!publicKey || !program || actionInProgress) return;

    setActionInProgress(true);
    try {
      const tx = await program.methods
        .hit()
        .accounts({
          player: publicKey,
          tableAccount: tablePda,
        })
        .rpc();

      console.log('Hit transaction:', tx);
    } catch (err: any) {
      console.error('Failed to hit:', err);
      alert(err.message || 'Failed to hit');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStand = async () => {
    if (!publicKey || !program || actionInProgress) return;

    setActionInProgress(true);
    try {
      const tx = await program.methods
        .stand()
        .accounts({
          player: publicKey,
          tableAccount: tablePda,
        })
        .rpc();

      console.log('Stand transaction:', tx);
    } catch (err: any) {
      console.error('Failed to stand:', err);
      alert(err.message || 'Failed to stand');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div style={styles.gameContainer}>
      <h2 style={styles.gameTitle}>Blackjack - {myRole.dealer ? 'Dealer' : 'Player'}</h2>

      <div style={styles.table}>
        {/* Opponent Section */}
        <div style={styles.handSection}>
          <div style={styles.handLabel}>
            Opponent ({myRole.dealer ? 'Player' : 'Dealer'})
            {!isMyTurn && <span style={styles.turnIndicator}> - Their Turn</span>}
          </div>
          <div style={styles.cards}>
            {opponentHand.map((card: number, i: number) => (
              <div key={i} style={styles.card}>
                {cardToString(card)}
              </div>
            ))}
          </div>
          <div style={styles.total}>Total: {opponentTotal}</div>
        </div>

        {/* My Hand Section */}
        <div style={{...styles.handSection, ...styles.myHandSection}}>
          <div style={styles.handLabel}>
            You ({myRole.dealer ? 'Dealer' : 'Player'})
            {isMyTurn && <span style={styles.turnIndicator}> - Your Turn</span>}
          </div>
          <div style={styles.cards}>
            {myHand.map((card: number, i: number) => (
              <div key={i} style={styles.card}>
                {cardToString(card)}
              </div>
            ))}
          </div>
          <div style={styles.total}>Total: {myTotal}</div>
        </div>
      </div>

      {/* Action Buttons */}
      {isMyTurn && (
        <div style={styles.actions}>
          <button
            style={styles.hitButton}
            onClick={handleHit}
            disabled={actionInProgress}
          >
            {actionInProgress ? 'Processing...' : 'HIT'}
          </button>
          <button
            style={styles.standButton}
            onClick={handleStand}
            disabled={actionInProgress}
          >
            {actionInProgress ? 'Processing...' : 'STAND'}
          </button>
        </div>
      )}

      {!isMyTurn && (
        <div style={styles.waitingMessage}>
          Waiting for opponent...
        </div>
      )}

      <button style={styles.leaveButton} onClick={onLeave}>
        Leave Table
      </button>
    </div>
  );
}

export default function TableSimple() {
  const { currentTableId, setCurrentTableId } = useGame();
  const { publicKey } = useWallet();
  const program = useGameProgram();

  const [tableData, setTableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Poll table state
  useEffect(() => {
    if (!currentTableId || !program) return;

    const fetchTable = async () => {
      try {
        const tablePda = new PublicKey(currentTableId);
        const data = await program.account.tableAccount.fetch(tablePda);
        setTableData(data);
        setLoading(false);

        // Auto-handle commit/reveal phases
        await autoHandlePhases(data, tablePda);
      } catch (err) {
        console.error('Error fetching table:', err);
        setError('Failed to load table');
        setLoading(false);
      }
    };

    fetchTable();
    const interval = setInterval(fetchTable, 2000);
    return () => clearInterval(interval);
  }, [currentTableId, program, publicKey]);

  const autoHandlePhases = async (data: any, tablePda: PublicKey) => {
    if (!publicKey || !program) return;

    // Check if we need to submit commitment
    const isCreator = data.creator.equals(publicKey);
    const isOpponent = data.opponent?.equals(publicKey);

    if (!isCreator && !isOpponent) return;

    // Phase: Committing - submit our commitment
    if (data.state.committing) {
      const needsCommitment =
        (isCreator && !data.creatorCommitment) ||
        (isOpponent && !data.opponentCommitment);

      if (needsCommitment) {
        try {
          // Generate random seed
          const seed = crypto.randomBytes(32);

          // Hash it for commitment
          const hash = crypto.createHash('sha256');
          hash.update(seed);
          const commitment = hash.digest();

          // Store seed locally for reveal
          localStorage.setItem(`table_${currentTableId}_seed`, seed.toString('hex'));

          // Submit commitment
          await program.methods
            .submitCommitment(Array.from(commitment))
            .accounts({
              player: publicKey,
              tableAccount: tablePda,
            })
            .rpc();

          console.log('Commitment submitted');
        } catch (err) {
          console.error('Failed to submit commitment:', err);
        }
      }
    }

    // Phase: Both committed, need to reveal
    if (data.creatorCommitment && data.opponentCommitment) {
      const needsReveal =
        (isCreator && !data.creatorSeedRevealed) ||
        (isOpponent && !data.opponentSeedRevealed);

      if (needsReveal) {
        try {
          const seedHex = localStorage.getItem(`table_${currentTableId}_seed`);
          if (!seedHex) {
            console.error('Seed not found in localStorage');
            return;
          }

          const seed = Buffer.from(seedHex, 'hex');

          // Reveal seed
          await program.methods
            .revealSeed(Array.from(seed))
            .accounts({
              player: publicKey,
              tableAccount: tablePda,
            })
            .rpc();

          console.log('Seed revealed');
        } catch (err) {
          console.error('Failed to reveal seed:', err);
        }
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading table...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={() => setCurrentTableId(null)}>Back to Lobby</button>
      </div>
    );
  }

  if (!tableData) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Table not found</div>
        <button onClick={() => setCurrentTableId(null)}>Back to Lobby</button>
      </div>
    );
  }

  // Determine game phase
  const isWaiting = !tableData.opponent;
  const isCommitting = tableData.state.committing;
  const isActive = tableData.state.active;
  const isSettled = tableData.state.settled;

  // Simplified rendering based on state
  if (isWaiting) {
    return (
      <div style={styles.container}>
        <h2>Waiting for opponent to join...</h2>
        <p>Table ID: {currentTableId?.slice(0, 8)}...</p>
        <p>Bet: {(tableData.betAmount / 1e9).toFixed(2)} SOL</p>
        <button onClick={() => setCurrentTableId(null)}>Leave Table</button>
      </div>
    );
  }

  if (isCommitting) {
    return (
      <div style={styles.container}>
        <h2>Shuffling deck...</h2>
        <p>Using provably fair commit-reveal protocol</p>
        <div>
          Creator committed: {tableData.creatorCommitment ? '✓' : '...'}
        </div>
        <div>
          Opponent committed: {tableData.opponentCommitment ? '✓' : '...'}
        </div>
        <div>
          Creator revealed: {tableData.creatorSeedRevealed ? '✓' : '...'}
        </div>
        <div>
          Opponent revealed: {tableData.opponentSeedRevealed ? '✓' : '...'}
        </div>
      </div>
    );
  }

  if (isActive) {
    return <ActiveGame tableData={tableData} tablePda={new PublicKey(currentTableId!)} onLeave={() => setCurrentTableId(null)} />;
  }

  if (isSettled) {
    return (
      <div style={styles.container}>
        <h2>Game Complete!</h2>
        <p>Final scores would show here</p>
        <button onClick={() => setCurrentTableId(null)}>Back to Lobby</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Unknown State</h2>
      <pre>{JSON.stringify(tableData, null, 2)}</pre>
      <button onClick={() => setCurrentTableId(null)}>Back to Lobby</button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  loading: {
    fontSize: '24px',
    textAlign: 'center',
  },
  error: {
    color: '#f44336',
    fontSize: '18px',
    marginBottom: '20px',
  },
  gameContainer: {
    padding: '40px',
    maxWidth: '900px',
    margin: '0 auto',
    minHeight: '100vh',
  },
  gameTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '40px',
    color: '#333',
  },
  table: {
    background: 'rgba(16, 124, 16, 0.8)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  handSection: {
    marginBottom: '40px',
  },
  myHandSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '0',
  },
  handLabel: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'white',
    marginBottom: '15px',
  },
  turnIndicator: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  cards: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  card: {
    background: 'white',
    border: '2px solid #333',
    borderRadius: '8px',
    padding: '15px 10px',
    fontSize: '24px',
    fontWeight: 'bold',
    minWidth: '60px',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  total: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: 'white',
  },
  actions: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  hitButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '20px 60px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  standButton: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '20px 60px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  waitingMessage: {
    textAlign: 'center',
    fontSize: '20px',
    color: '#666',
    marginBottom: '30px',
    fontStyle: 'italic',
  },
  leaveButton: {
    display: 'block',
    margin: '0 auto',
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};
