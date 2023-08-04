import { Horizon } from "stellar-sdk";
import { Payment, Credit, Debit } from "../types";
import { AccountCredited, AccountDebited } from "stellar-sdk/lib/types/effects";
import { SorobanOperation, SorobanEffect} from "@subql/types-soroban";

export async function handleOperation(op: SorobanOperation<Horizon.PaymentOperationResponse>): Promise<void> {
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

export async function handleCredit(effect: SorobanEffect<AccountCredited>): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Credit.create({
    id: effect.id,
    account: effect.account,
    amount: effect.amount
  })

  await _effect.save();
}

export async function handleDebit(effect: SorobanEffect<AccountDebited>): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Debit.create({
    id: effect.id,
    account: effect.account,
    amount: effect.amount
  })

  await _effect.save();
}
