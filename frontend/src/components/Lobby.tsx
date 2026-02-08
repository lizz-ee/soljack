import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGame } from '../context/GameContext';
import { useGameProgram, findTablePda, FEE_DESTINATION, SystemProgram, BN } from '../lib/anchor';

interface OpenTable {
  tableId: string;
  betAmount: number;
  creator: string;
  creatorUsername: string | null;
  creatorRole: 'DEALER' | 'PLAYER';
  openRole: 'DEALER' | 'PLAYER';
  creatorStats: {
    wins: number;
    losses: number;
    totalHands: number;
  };
  timeRemaining: number;
  createdAt: number;
}

interface Props {
  betTier: number;
}

export default function Lobby({ betTier }: Props) {
  const { publicKey } = useWallet();
  const program = useGameProgram();
  const [openTables, setOpenTables] = useState<OpenTable[]>([]);
  const [showCreateTable, setShowCreateTable] = useState(false);
  const [joiningTable, setJoiningTable] = useState<string | null>(null);
  const { setCurrentTableId } = useGame();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/tables/open?betAmount=${Math.floor(betTier * 1e9)}`);
        if (!response.ok) {
          console.warn('Failed to fetch tables from backend');
          return;
        }
        const data = await response.json();
        setOpenTables(data.tables || []);
      } catch (error) {
        console.error('Error fetching tables:', error);
        setOpenTables([]);
      }
    };

    fetchTables();

    // Refresh every 5 seconds
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [betTier]);

  const handleCreateTable = () => {
    setShowCreateTable(true);
  };

  const handleJoinTable = async (tableId: string) => {
    if (!publicKey || !program) {
      alert('Please connect your wallet');
      return;
    }

    setJoiningTable(tableId);

    try {
      // The tableId IS the table PDA address
      const tablePda = new PublicKey(tableId);

      // Fetch table account to get creator address
      const tableAccount = await program.account.tableAccount.fetch(tablePda);
      const creatorPubkey = tableAccount.creator;

      console.log('Joining table:', tableId);
      console.log('Creator:', creatorPubkey.toString());

      // Call join_table instruction
      const tx = await program.methods
        .joinTable()
        .accounts({
          opponent: publicKey,
          creator: creatorPubkey,
          tableAccount: tablePda,
          feeDestination: FEE_DESTINATION,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Joined table! Transaction:', tx);

      // Navigate to table view
      setCurrentTableId(tableId);
    } catch (err: any) {
      console.error('Failed to join table:', err);

      let errorMsg = 'Failed to join table';
      if (err.message?.includes('insufficient')) {
        errorMsg = 'Insufficient SOL balance';
      } else if (err.message?.includes('full')) {
        errorMsg = 'Table is full';
      } else if (err.message) {
        errorMsg = err.message;
      }

      alert(errorMsg);
    } finally {
      setJoiningTable(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Tables - {betTier} SOL</h2>
        <button style={styles.createButton} onClick={handleCreateTable}>
          Create Table
        </button>
      </div>

      {showCreateTable && (
        <CreateTableModal
          betTier={betTier}
          onClose={() => setShowCreateTable(false)}
          onCreated={(tableId) => setCurrentTableId(tableId)}
        />
      )}

      <div style={styles.tableGrid}>
        {openTables.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No open tables at this bet tier.</p>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          openTables.map((table) => (
            <TableCard
              key={table.tableId}
              table={table}
              onJoin={handleJoinTable}
              isJoining={joiningTable === table.tableId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TableCard({ table, onJoin, isJoining }: { table: OpenTable; onJoin: (id: string) => void; isJoining?: boolean }) {
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60)
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div
      style={{...styles.tableCard, opacity: isJoining ? 0.6 : 1}}
      onClick={() => !isJoining && onJoin(table.tableId)}
    >
      <div style={styles.cardHeader}>
        <span style={styles.username}>
          {table.creatorUsername || table.creator.slice(0, 5) + '...'}
        </span>
        <span style={styles.timer}>{formatTime(table.timeRemaining)}</span>
      </div>

      <div style={styles.seatsContainer}>
        <div style={table.creatorRole === 'DEALER' ? styles.seatTaken : styles.seatOpen}>
          <div style={styles.seatLabel}>DEALER</div>
          {table.creatorRole === 'DEALER' && (
            <div style={styles.playerInfo}>
              {table.creatorUsername || table.creator.slice(0, 5) + '...'}
            </div>
          )}
        </div>

        <div style={styles.divider} />

        <div style={table.creatorRole === 'PLAYER' ? styles.seatTaken : styles.seatOpen}>
          <div style={styles.seatLabel}>PLAYER</div>
          {table.creatorRole === 'PLAYER' && (
            <div style={styles.playerInfo}>
              {table.creatorUsername || table.creator.slice(0, 5) + '...'}
            </div>
          )}
        </div>
      </div>

      <div style={styles.stats}>
        {table.creatorStats.wins}W - {table.creatorStats.losses}L
        <span style={styles.handsPlayed}>
          ({table.creatorStats.totalHands} hands)
        </span>
      </div>
    </div>
  );
}

function CreateTableModal({
  betTier,
  onClose,
  onCreated,
}: {
  betTier: number;
  onClose: () => void;
  onCreated: (tableId: string) => void;
}) {
  const { publicKey } = useWallet();
  const program = useGameProgram();
  const [selectedRole, setSelectedRole] = useState<'DEALER' | 'PLAYER' | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!selectedRole || !publicKey || !program) return;

    setIsCreating(true);
    setError('');

    try {
      // Generate a unique table seed based on timestamp
      const tableSeed = new BN(Date.now());

      // Convert bet tier (in SOL) to lamports
      const betAmountLamports = new BN(betTier * 1e9);

      // Find table PDA
      const [tablePda] = findTablePda(program.programId, tableSeed);

      console.log('Creating table...');
      console.log('Table PDA:', tablePda.toString());
      console.log('Bet amount:', betAmountLamports.toString(), 'lamports');
      console.log('Role:', selectedRole);

      // Create role enum object
      const role = selectedRole === 'DEALER' ? { dealer: {} } : { player: {} };

      // Call create_table instruction
      const tx = await program.methods
        .createTable(betAmountLamports, role, tableSeed)
        .accounts({
          creator: publicKey,
          tableAccount: tablePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Table created! Transaction:', tx);

      // Use the table PDA as the table ID
      onCreated(tablePda.toString());
      onClose();
    } catch (err: any) {
      console.error('Failed to create table:', err);

      let errorMsg = 'Failed to create table';
      if (err.message?.includes('insufficient')) {
        errorMsg = 'Insufficient SOL balance';
      } else if (err.message) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.modalTitle}>Create Table - {betTier} SOL</h3>
        <p style={styles.modalSubtitle}>Choose your role:</p>

        <div style={styles.roleSelector}>
          <button
            style={{
              ...styles.roleButton,
              background: selectedRole === 'DEALER' ? '#90caf9' : 'rgba(255, 255, 255, 0.5)',
            }}
            onClick={() => setSelectedRole('DEALER')}
          >
            DEALER
          </button>
          <button
            style={{
              ...styles.roleButton,
              background: selectedRole === 'PLAYER' ? '#90caf9' : 'rgba(255, 255, 255, 0.5)',
            }}
            onClick={() => setSelectedRole('PLAYER')}
          >
            PLAYER
          </button>
        </div>

        {error && <div style={{ color: '#f44336', marginBottom: '10px', fontSize: '14px' }}>{error}</div>}

        <div style={styles.modalActions}>
          <button style={styles.cancelButton} onClick={onClose} disabled={isCreating}>
            Back
          </button>
          <button
            style={styles.confirmButton}
            onClick={handleCreate}
            disabled={!selectedRole || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Table'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#666',
  },
  tableCard: {
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  username: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
  },
  timer: {
    fontSize: '14px',
    color: '#666',
    background: 'rgba(0, 0, 0, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  seatsContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  seatTaken: {
    flex: 1,
    padding: '15px',
    borderRadius: '8px',
    background: 'rgba(144, 202, 249, 0.3)',
    border: '2px solid #90caf9',
  },
  seatOpen: {
    flex: 1,
    padding: '15px',
    borderRadius: '8px',
    background: 'rgba(129, 212, 250, 0.2)',
    border: '2px dashed #81d4fa',
  },
  seatLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666',
    marginBottom: '5px',
  },
  playerInfo: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  divider: {
    width: '2px',
    background: 'rgba(0, 0, 0, 0.1)',
  },
  stats: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
  },
  handsPlayed: {
    fontSize: '12px',
    marginLeft: '5px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '20px',
  },
  roleSelector: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
  },
  roleButton: {
    flex: 1,
    padding: '20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    background: 'rgba(0, 0, 0, 0.1)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  confirmButton: {
    flex: 1,
    padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    color: 'white',
    cursor: 'pointer',
  },
};