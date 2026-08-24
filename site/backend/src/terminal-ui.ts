import { BlockchainState } from './types';

export class TerminalUI {
  private lastState: BlockchainState | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  start(intervalMs = 1000): void {
    this.updateInterval = setInterval(() => {
      if (this.lastState) {
        this.draw(this.lastState);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  updateState(state: BlockchainState): void {
    this.lastState = state;
  }

  private clearScreen(): void {
    // ANSI escape to clear screen and move cursor to top-left
    process.stdout.write('\x1b[2J\x1b[0;0H');
  }

  private draw(state: BlockchainState): void {
    this.clearScreen();
    console.log('========================================');
    console.log('         BLOCKCHAIN DASHBOARD          ');
    console.log('========================================');
    console.log(` Blocks: ${state.chain.length}`);
    console.log(` Pending Transactions: ${state.pendingTransactions.length}`);
    console.log(` Mining Difficulty: ${state.difficulty}`);
    console.log(` Mining Reward: ${state.miningReward} coins`);
    console.log('----------------------------------------');

    // Wallet balances
    console.log(' WALLET BALANCES:');
    if (state.walletBalances && state.walletBalances.length > 0) {
      state.walletBalances.forEach((wb, idx) => {
        console.log(`   Wallet ${idx + 1} (${wb.address.slice(0, 8)}...): ${wb.balance} coins`);
      });
    } else {
      console.log('   No wallets yet.');
    }

    console.log('----------------------------------------');
    console.log(' LAST 5 CONFIRMED TRANSACTIONS:');
    const confirmed = state.chain
      .slice(-5)
      .flatMap(block => block.transactions)
      .slice(-5);
    if (confirmed.length > 0) {
      confirmed.forEach(tx => {
        console.log(`   ${tx.sender.slice(0, 8)}... -> ${tx.recipient.slice(0, 8)}... : ${tx.amount} coins`);
      });
    } else {
      console.log('   No confirmed transactions yet.');
    }

    console.log('----------------------------------------');
    console.log(' PENDING TRANSACTIONS:');
    if (state.pendingTransactions.length > 0) {
      state.pendingTransactions.slice(-5).forEach(tx => {
        console.log(`   ${tx.sender.slice(0, 8)}... -> ${tx.recipient.slice(0, 8)}... : ${tx.amount} coins`);
      });
    } else {
      console.log('   No pending transactions.');
    }

    console.log('----------------------------------------');
    console.log(' LAST BLOCK:');
    const lastBlock = state.chain[state.chain.length - 1];
    if (lastBlock) {
      console.log(`   Index: ${lastBlock.index}`);
      console.log(`   Hash: ${lastBlock.hash}`);
      console.log(`   Previous: ${lastBlock.previousHash.slice(0, 20)}...`);
      console.log(`   Transactions: ${lastBlock.transactions.length}`);
      console.log(`   Timestamp: ${new Date(lastBlock.timestamp).toLocaleTimeString()}`);
    }

    console.log('========================================');
    console.log(' Press Ctrl+C to stop and save.');
  }
}