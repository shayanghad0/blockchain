import { TransactionData } from '../types';

interface Props {
  title: string;
  transactions: TransactionData[];
  successful?: boolean;
}

const TransactionList = ({ title, transactions, successful }: Props) => {
  return (
    <div className="transaction-list">
      <h2>{title}</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        transactions.map((tx, index) => (
          <div key={index} className="transaction-item">
            <div className="from-to">
              {tx.sender.slice(0, 8)}... → {tx.recipient.slice(0, 8)}...
            </div>
            <div className="amount">{tx.amount} coins</div>
            <div className="hash">Sig: {tx.signature.slice(0, 20)}...</div>
            <div className="timestamp">
              {new Date(tx.timestamp).toLocaleTimeString()}
            </div>
            {successful && <span className="badge">✔ Confirmed</span>}
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;