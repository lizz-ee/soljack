import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface GameContextType {
  username: string | null;
  balance: number;
  stats: {
    wins: number;
    losses: number;
    totalHands: number;
    rank: number | null;
  };
  currentTableId: string | null;
  isAtTable: boolean;
  setCurrentTableId: (id: string | null) => void;
  refreshBalance: () => void;
  refreshStats: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState({
    wins: 0,
    losses: 0,
    totalHands: 0,
    rank: null as number | null,
  });
  const [currentTableId, setCurrentTableId] = useState<string | null>(null);

  const refreshBalance = async () => {
    if (!publicKey) return;
    try {
      const bal = await connection.getBalance(publicKey);
      setBalance(bal / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const refreshStats = async () => {
    if (!publicKey) return;
    try {
      // TODO: Fetch stats from backend API
      // const response = await fetch(`/api/player/${publicKey.toString()}/stats`);
      // const data = await response.json();
      // setStats(data);
      // setUsername(data.username);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    refreshBalance();
    refreshStats();
  }, [publicKey]);

  return (
    <GameContext.Provider
      value={{
        username,
        balance,
        stats,
        currentTableId,
        isAtTable: currentTableId !== null,
        setCurrentTableId,
        refreshBalance,
        refreshStats,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}