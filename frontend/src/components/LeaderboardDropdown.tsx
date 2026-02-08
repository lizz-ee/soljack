interface Props {
  onClose: () => void;
}

interface LeaderboardEntry {
  rank: number;
  username: string | null;
  wallet: string;
  wins: number;
  losses: number;
  totalHands: number;
}

export default function LeaderboardDropdown({ onClose }: Props) {
  // Mock data
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'CryptoKing', wallet: '7KwQDkHV...', wins: 87, losses: 12, totalHands: 99 },
    { rank: 2, username: 'SolanaQueen', wallet: '9XmT5pQr...', wins: 76, losses: 20, totalHands: 96 },
    { rank: 3, username: null, wallet: '5HnB8mLc...', wins: 71, losses: 15, totalHands: 86 },
    { rank: 4, username: 'DegenerateAce', wallet: '3PqL9kNm...', wins: 65, losses: 22, totalHands: 87 },
    { rank: 5, username: 'BlackjackPro', wallet: '8TyR2wQx...', wins: 58, losses: 18, totalHands: 76 },
  ];

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.dropdown}>
        <div style={styles.header}>
          <h3 style={styles.title}>🏆 Leaderboard</h3>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div style={styles.list}>
          {leaderboard.map((entry) => (
            <div key={entry.rank} style={styles.entry}>
              <div style={styles.rankBadge}>#{entry.rank}</div>
              <div style={styles.playerInfo}>
                <div style={entry.username ? styles.username : styles.wallet}>
                  {entry.username || entry.wallet}
                </div>
                <div style={styles.record}>
                  {entry.wins}W - {entry.losses}L
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdown: {
    position: 'absolute',
    top: '60px',
    left: '10px',
    width: '320px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  rankBadge: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: '16px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '3px',
  },
  wallet: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#555',
    marginBottom: '3px',
  },
  record: {
    fontSize: '14px',
    color: '#666',
  },
};