import { BlockData } from '../types';

interface Props {
  blocks: BlockData[];
}

const BlockList = ({ blocks }: Props) => {
  const recentBlocks = blocks.slice(-10).reverse();

  return (
    <div className="block-list" style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
      <h2>Recent Blocks</h2>
      <div className="block-list-content">
        {recentBlocks.map(block => (
          <div key={block.index} className="block-item">
            <div className="block-header">
              <span>Block #{block.index}</span>
              <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="hash">Hash: {block.hash}</div>
            <div className="hash">Previous: {block.previousHash.slice(0, 20)}...</div>
            <div className="block-details">
              Transactions: {block.transactions.length} | Nonce: {block.nonce}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockList;