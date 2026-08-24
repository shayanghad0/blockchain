import { BlockData } from '../types';

interface Props {
  blocks: BlockData[];
}

const BlockList = ({ blocks }: Props) => {
  return (
    <div className="block-list">
      <h2>Blocks</h2>
      {blocks.map(block => (
        <div key={block.index} className="block-item">
          <div>Block #{block.index}</div>
          <div className="hash">Hash: {block.hash}</div>
          <div className="hash">Previous: {block.previousHash.slice(0, 20)}...</div>
          <div>Transactions: {block.transactions.length}</div>
          <div>Timestamp: {new Date(block.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
};

export default BlockList;