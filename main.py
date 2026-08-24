import hashlib
import json
import time
import secrets

# ---------- Wallet ----------
class Wallet:
    """Simulates a user wallet with a private key and public address."""
    def __init__(self):
        # Simulate a private key (random hex string)
        self.private_key = secrets.token_hex(32)
        # Public address is derived from the private key (hash)
        self.address = hashlib.sha256(self.private_key.encode()).hexdigest()[:40]

    def sign(self, data):
        """Simulate signing by hashing data + private key."""
        return hashlib.sha256((data + self.private_key).encode()).hexdigest()

    def __repr__(self):
        return f"Wallet(address={self.address[:8]}...)"

# ---------- Transaction ----------
class Transaction:
    """Represents a transfer of coins between two addresses."""
    def __init__(self, sender, recipient, amount, timestamp=None, signature=None):
        self.sender = sender          # sender's address (string)
        self.recipient = recipient    # recipient's address (string)
        self.amount = amount          # amount (int, smallest unit)
        self.timestamp = timestamp or time.time()
        self.signature = signature    # simulated signature

    def calculate_hash(self):
        """Hash of the transaction data (used for signing)."""
        data = f"{self.sender}{self.recipient}{self.amount}{self.timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()

    def to_dict(self):
        return {
            "sender": self.sender,
            "recipient": self.recipient,
            "amount": self.amount,
            "timestamp": self.timestamp,
            "signature": self.signature
        }

    @staticmethod
    def from_dict(data):
        return Transaction(
            sender=data["sender"],
            recipient=data["recipient"],
            amount=data["amount"],
            timestamp=data["timestamp"],
            signature=data["signature"]
        )

# ---------- Block ----------
class Block:
    """A block contains a list of transactions and a link to the previous block."""
    def __init__(self, index, timestamp, transactions, previous_hash, nonce=0, hash=None):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions  # list of Transaction objects
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.hash = hash or self.calculate_hash()

    def calculate_hash(self):
        """Hash of the block header (index, timestamp, transactions, previous hash, nonce)."""
        # We'll use a simple string representation of transactions (sorted by sender/recipient/amount/timestamp)
        tx_string = "".join(tx.calculate_hash() for tx in self.transactions)
        data = f"{self.index}{self.timestamp}{tx_string}{self.previous_hash}{self.nonce}"
        return hashlib.sha256(data.encode()).hexdigest()

    def mine_block(self, difficulty):
        """Proof-of-work: find a nonce that makes the block hash start with `difficulty` zeros."""
        target = "0" * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()
        print(f"Block #{self.index} mined: {self.hash}")

    def to_dict(self):
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions": [tx.to_dict() for tx in self.transactions],
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }

    @staticmethod
    def from_dict(data):
        transactions = [Transaction.from_dict(tx) for tx in data["transactions"]]
        return Block(
            index=data["index"],
            timestamp=data["timestamp"],
            transactions=transactions,
            previous_hash=data["previous_hash"],
            nonce=data["nonce"],
            hash=data["hash"]
        )

# ---------- Blockchain ----------
class Blockchain:
    """The blockchain itself: a chain of blocks with transaction handling."""
    def __init__(self, difficulty=2, mining_reward=100):
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.mining_reward = mining_reward
        self.pending_transactions = []

    def create_genesis_block(self):
        """The first block in the chain, with no transactions."""
        return Block(0, time.time(), [], "0" * 64)

    def get_latest_block(self):
        return self.chain[-1]

    def add_transaction(self, transaction):
        """Add a transaction to the pending list (no validation for simplicity)."""
        self.pending_transactions.append(transaction)

    def mine_pending_transactions(self, miner_address):
        """Collect pending transactions, add a mining reward, and mine a new block."""
        # Create a reward transaction for the miner
        reward_tx = Transaction(
            sender="NETWORK",          # special sender for coinbase
            recipient=miner_address,
            amount=self.mining_reward,
            signature="COINBASE"
        )
        # Combine reward and pending transactions
        block_transactions = [reward_tx] + self.pending_transactions

        # Create a new block with these transactions
        new_block = Block(
            index=len(self.chain),
            timestamp=time.time(),
            transactions=block_transactions,
            previous_hash=self.get_latest_block().hash
        )

        # Mine the block (proof-of-work)
        new_block.mine_block(self.difficulty)

        # Append to chain and clear pending
        self.chain.append(new_block)
        self.pending_transactions = []
        print(f"Block added with {len(block_transactions)} transaction(s). Reward paid to {miner_address[:8]}...")

    def is_chain_valid(self):
        """Check integrity: hashes, previous links, and proof-of-work."""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]

            # Check current block's hash
            if current.hash != current.calculate_hash():
                print(f"Invalid hash at block {i}")
                return False

            # Check link to previous block
            if current.previous_hash != previous.hash:
                print(f"Broken chain at block {i}")
                return False

            # Check proof-of-work
            if current.hash[:self.difficulty] != "0" * self.difficulty:
                print(f"Block {i} does not satisfy proof-of-work")
                return False

        return True

    def save_to_file(self, filename):
        """Serialize the blockchain to a JSON file."""
        data = {
            "difficulty": self.difficulty,
            "mining_reward": self.mining_reward,
            "chain": [block.to_dict() for block in self.chain],
            "pending_transactions": [tx.to_dict() for tx in self.pending_transactions]
        }
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)
        print(f"Blockchain saved to {filename}")

    @classmethod
    def load_from_file(cls, filename):
        """Load a blockchain from a JSON file."""
        with open(filename, "r") as f:
            data = json.load(f)
        blockchain = cls(difficulty=data["difficulty"], mining_reward=data["mining_reward"])
        blockchain.chain = [Block.from_dict(block_data) for block_data in data["chain"]]
        blockchain.pending_transactions = [Transaction.from_dict(tx) for tx in data["pending_transactions"]]
        return blockchain

# ---------- Demo ----------
if __name__ == "__main__":
    # Create a blockchain with difficulty 2 (fast for demo)
    my_blockchain = Blockchain(difficulty=2, mining_reward=50)

    # Create two wallets
    alice = Wallet()
    bob = Wallet()

    print(f"Alice's address: {alice.address}")
    print(f"Bob's address:   {bob.address}")

    # Alice sends 30 coins to Bob
    tx1 = Transaction(
        sender=alice.address,
        recipient=bob.address,
        amount=30
    )
    # Simulate signing: Alice signs the transaction hash
    tx1.signature = alice.sign(tx1.calculate_hash())

    # Add to pending
    my_blockchain.add_transaction(tx1)

    # Mine pending transactions (miner is Alice for this demo)
    print("\nMining block 1...")
    my_blockchain.mine_pending_transactions(alice.address)

    # Bob sends 10 coins back to Alice
    tx2 = Transaction(
        sender=bob.address,
        recipient=alice.address,
        amount=10
    )
    tx2.signature = bob.sign(tx2.calculate_hash())
    my_blockchain.add_transaction(tx2)

    print("\nMining block 2...")
    my_blockchain.mine_pending_transactions(bob.address)

    # Validate the chain
    print("\nIs chain valid?", my_blockchain.is_chain_valid())

    # Save to JSON file
    my_blockchain.save_to_file("blockchain.json")

    # Load from JSON file and verify
    print("\nLoading blockchain from file...")
    loaded_chain = Blockchain.load_from_file("blockchain.json")
    print("Loaded chain valid?", loaded_chain.is_chain_valid())
    print(f"Number of blocks: {len(loaded_chain.chain)}")