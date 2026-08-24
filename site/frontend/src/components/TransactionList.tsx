import { TransactionData } from '../types';

interface Props {
  title: string;
  transactions: TransactionData[];
  maxItems?: number;
  confirmed?: boolean;
}

const TransactionList = ({ title, transactions, maxItems = 10, confirmed }: Props) => {
  const displayTransactions = transactions.slice(-maxItems).reverse();

  return (
    <div className="transaction-list">
      <h2>{title}</h2>
      <div className="transaction-list-content">
        {displayTransactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '10px 0' }}>No transactions yet.</p>
        ) : (
          displayTransactions.map((tx, index) => (
            <div key={`${tx.timestamp}-${index}`} className="transaction-item">
              <div className="from-to">
                {tx.sender === 'NETWORK' ? '⛏️ Mining Reward' : tx.sender.slice(0, 8)} → {tx.recipient.slice(0, 8)}
                {confirmed && <span className="badge">✔</span>}
              </div>
              <div className="amount">{tx.amount} coins</div>
              <div className="hash">Sig: {tx.signature.slice(0, 20)}...</div>
              <div className="timestamp">
                {new Date(tx.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionList;