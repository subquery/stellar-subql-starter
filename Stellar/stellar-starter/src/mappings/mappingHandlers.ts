import { Horizon } from "stellar-sdk";
import { Payment, Credit, Debit, TransferEvent } from "../types";
import { AccountCredited, AccountDebited } from "stellar-sdk/lib/types/effects";
import { StellarOperation, StellarEffect, SorobanEvent } from "@subql/types-stellar";

export async function handleOperation(op: StellarOperation<Horizon.PaymentOperationResponse>): Promise<void> {
  logger.info(`Indexing operation ${op.id}, type: ${op.type}`)

  const _op = Payment.create({
    id: op.id,
    from: op.from,
    to: op.to,
    txHash: op.transaction_hash,
    amount: op.amount
  })

  await _op.save();
}

export async function handleCredit(effect: StellarEffect<AccountCredited>): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Credit.create({
    id: effect.id,
    account: effect.account,
    amount: effect.amount
  })

  await _effect.save();
}

export async function handleDebit(effect: StellarEffect<AccountDebited>): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Debit.create({
    id: effect.id,
    account: effect.account,
    amount: effect.amount
  })

  await _effect.save();
}

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`New event at block ${event.ledger.sequence}`);
  const _event = TransferEvent.create({
    id: event.id,
    contract: event.contractId,
    ledger: event.ledger.sequence.toString(),
    from: event.topic[1],
    to: event.topic[2],
    value: event.value.decoded
  })

  await _event.save();
}