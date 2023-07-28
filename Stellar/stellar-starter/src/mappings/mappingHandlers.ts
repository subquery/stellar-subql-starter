import { Ledger, Transaction, Operation, Effect } from "../types";
import {SorobanBlock, SorobanTransaction, SorobanOperation, SorobanEffect} from "@subql/types-soroban";

export async function handleBlock(block: SorobanBlock): Promise<void> {
  logger.info(`Indexing ledger ${block.sequence}`);

  const _block = Ledger.create({
    id: block.id,
    sequence: BigInt(block.sequence),
    hash: block.hash
  })

  await _block.save();
}

export async function handleTransaction(tx: SorobanTransaction): Promise<void> {
  logger.info(`Indexing transaction ${tx.hash}`)

  const _tx = Transaction.create({
    id: tx.id,
    source_account: tx.source_account,
    operation_count: tx.operation_count
  })

  await _tx.save();
}

export async function handleOperation(op: SorobanOperation): Promise<void> {
  logger.info(`Indexing operation ${op.id}, type: ${op.type}`)

  const _op = Operation.create({
    id: op.id,
    account: op.source_account,
    type: op.type,
    txHash: op.transaction_hash
  })

  await _op.save();
}

export async function handleEffect(effect: SorobanEffect): Promise<void> {
  logger.info(`Indexing operation ${effect.id}, type: ${effect.type}`)

  const _effect = Effect.create({
    id: effect.id,
    account: effect.account,
    type: effect.type
  })

  await _effect.save();
}
