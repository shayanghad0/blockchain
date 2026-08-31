# Simple Blockchain Simulation in Python

A lightweight, educational blockchain simulation written in pure Python. It demonstrates core blockchain concepts such as wallets, transactions, proof-of-work mining, and chain validation, and it can save/load the chain to/from a JSON file.

## Features

- **Wallets** – Simulated private/public key pairs (using SHA-256 hashing).
- **Transactions** – Transfer of coins between addresses, with simulated signatures.
- **Blocks** – Contain a list of transactions and a link to the previous block.
- **Proof-of-Work** – Adjustable difficulty (number of leading zeros required in block hash).
- **Mining Reward** – Coinbase transaction paid to the miner.
- **Chain Validation** – Checks block hashes, previous block links, and proof-of-work.
- **JSON Persistence** – Save the entire blockchain to a file and load it back.

## Requirements

- Python 3.6 or higher
- No external libraries (uses only standard library modules: `hashlib`, `json`, `time`, `secrets`)

## Usage

1. Clone or download the repository.
2. Run the script:

   ```bash
   python blockchain_sim.py
   ```

3. The script will:
   - Create two wallets (Alice and Bob).
   - Simulate two transactions:
     - Alice sends 30 coins to Bob.
     - Bob sends 10 coins back to Alice.
   - Mine two blocks (one per transaction set).
   - Validate the blockchain.
   - Save the chain to `blockchain.json`.
   - Load the chain from the file and validate it again.

## Code Overview

- `Wallet` – Generates a random private key and a public address (hash of the key). Provides a `sign` method.
- `Transaction` – Stores sender, recipient, amount, timestamp, and signature. Can compute its own hash.
- `Block` – Contains an index, timestamp, list of transactions, previous block hash, nonce, and its own hash. Implements proof-of-work mining.
- `Blockchain` – Manages the chain, pending transactions, mining, validation, and JSON serialization/deserialization.

## Example Output

```
Alice's address: 3f2a9c...
Bob's address:   8b7d1e...

Mining block 1...
Block #1 mined: 00a1b2c3...
Block added with 2 transaction(s). Reward paid to 3f2a9c...

Mining block 2...
Block #2 mined: 00d4e5f6...
Block added with 2 transaction(s). Reward paid to 8b7d1e...

Is chain valid? True
Blockchain saved to blockchain.json

Loading blockchain from file...
Loaded chain valid? True
Number of blocks: 3
```

## JSON File Structure

The saved `blockchain.json` contains:

- `difficulty` – Proof-of-work difficulty.
- `mining_reward` – Reward per mined block.
- `chain` – List of blocks, each with:
  - `index`, `timestamp`, `transactions` (list of transaction objects), `previous_hash`, `nonce`, `hash`
- `pending_transactions` – Transactions not yet included in a block.

## Customization

- **Difficulty**: Modify the `difficulty` parameter when creating a `Blockchain` instance (e.g., `Blockchain(difficulty=3)`).
- **Mining Reward**: Change `mining_reward` in the constructor.
- **Transaction Simulation**: Add more wallets and transactions to see how the chain grows.

## Limitations

- This is a **simulation** for educational purposes only. It does **not** implement real cryptographic signatures (ECDSA), network communication, or consensus mechanisms.
- Security is intentionally simplified; do not use this code for any real cryptocurrency or production environment.

## License

This project is open-source and available under the [MIT License](LICENSE).
