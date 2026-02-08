import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Props {
  onClose: () => void;
}

export default function UsernameModal({ onClose }: Props) {
  const { publicKey } = useWallet();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!publicKey) return;

    // Validation
    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3-20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError('Only letters and numbers allowed');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call claim_username instruction
      // const tx = await program.methods.claimUsername(username).accounts({...}).rpc();
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to claim username');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Claim Username</h2>
        <p style={styles.description}>
          Cost: $1 USD in SOL (one-time payment)
          <br />
          Permanent and unique. Letters and numbers only.
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError('');
          }}
          placeholder="Enter username"
          style={styles.input}
          maxLength={20}
        />

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.benefits}>
          <div style={styles.benefit}>✨ Display name in gold</div>
          <div style={styles.benefit}>🏆 Eligible for 100-win race</div>
          <div style={styles.benefit}>🎯 Permanent identity</div>
        </div>

        <div style={styles.actions}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            style={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || !username}
          >
            {isSubmitting ? 'Claiming...' : 'Claim for $1'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#333',
  },
  description: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  input: {
    width: '100%',
    padding: '15px',
    fontSize: '18px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '10px',
    outline: 'none',
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    marginBottom: '20px',
  },
  benefits: {
    background: 'rgba(144, 202, 249, 0.1)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
  },
  benefit: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#555',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  cancelButton: {
    flex: 1,
    padding: '15px',
    background: 'rgba(0, 0, 0, 0.1)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '15px',
    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};