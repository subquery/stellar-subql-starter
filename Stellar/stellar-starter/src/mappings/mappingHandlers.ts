import { Horizon } from "stellar-sdk";
import { Payment, Credit, Debit } from "../types";
import { SorobanOperation, SorobanEffect} from "@subql/types-soroban";
import { AccountCredited, AccountDebited } from "stellar-sdk/lib/types/effects";

export async function handleOperation(op: SorobanOperation): Promise<void> {
  logger.info(`Indexing operation ${op.id}, type: ${op.type}`)

  const _op = Payment.create({
    id: op.id,
    from: (op as unknown as Horizon.PaymentOperationResponse).from,
    to: (op as unknown as Horizon.PaymentOperationResponse).to,
    txHash: op.transaction_hash,
    amount: (op as unknown as Horizon.PaymentOperationResponse).amount
  })

  await _op.save();
}

export async function handleCredit(effect: SorobanEffect): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Credit.create({
    id: effect.id,
    account: effect.account,
    amount: (effect as AccountCredited).amount
  })

  await _effect.save();
}

export async function handleDebit(effect: SorobanEffect): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`)

  const _effect = Debit.create({
    id: effect.id,
    account: effect.account,
    amount: (effect as AccountDebited).amount
  })

  await _effect.save();
}
