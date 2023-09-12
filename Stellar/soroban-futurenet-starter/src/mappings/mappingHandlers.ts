import { Account, Credit, Debit, Payment, Transfer } from "../types";
import {
  StellarOperation,
  StellarEffect,
  SorobanEvent,
} from "@subql/types-stellar";
import { AccountCredited, AccountDebited } from "stellar-sdk/lib/types/effects";
import { Horizon } from "stellar-sdk";

export async function handleOperation(
  op: StellarOperation<Horizon.PaymentOperationResponse>
): Promise<void> {
  logger.info(`Indexing operation ${op.id}, type: ${op.type}`);

  const fromAccount = await checkAndGetAccount(op.from, op.ledger.sequence);
  const toAccount = await checkAndGetAccount(op.to, op.ledger.sequence);

  const _op = Payment.create({
    id: op.id,
    fromId: fromAccount.id,
    toId: toAccount.id,
    txHash: op.transaction_hash,
    amount: op.amount,
  });

  await _op.save();
}

export async function handleCredit(
  effect: StellarEffect<AccountCredited>
): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

  const account = await checkAndGetAccount(
    effect.account,
    effect.ledger.sequence
  );

  const _effect = Credit.create({
    id: effect.id,
    accountId: account.id,
    amount: effect.amount,
  });

  await _effect.save();
}

export async function handleDebit(
  effect: StellarEffect<AccountDebited>
): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

  const account = await checkAndGetAccount(
    effect.account,
    effect.ledger.sequence
  );

  const _effect = Debit.create({
    id: effect.id,
    accountId: account.id,
    amount: effect.amount,
  });

  await _effect.save();
}

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`New transfer event found at block ${event.ledger}`);

  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  // logger.info(JSON.stringify(event));
  const {
    topic: [env, from, to],
  } = event;

  const ledgerNumber: number = event.ledger.sequence;

  const fromAccount = await checkAndGetAccount(from, ledgerNumber);
  const toAccount = await checkAndGetAccount(to, ledgerNumber);

  // Create the new transfer entity
  const transfer = Transfer.create({
    id: event.id,
    ledger: ledgerNumber,
    date: new Date(event.ledgerClosedAt),
    contract: event.contractId,
    fromId: fromAccount.id,
    toId: toAccount.id,
    value: BigInt(event.value.decoded!),
  });

  fromAccount.lastTransferLedger = ledgerNumber;
  toAccount.lastTransferLedger = ledgerNumber;

  await Promise.all([fromAccount.save(), toAccount.save(), transfer.save()]);
}

async function checkAndGetAccount(
  id: string,
  ledgerSequence: number
): Promise<Account> {
  let account = await Account.get(id.toLowerCase());
  if (!account) {
    // We couldn't find the account
    account = Account.create({
      id: id.toLowerCase(),
      firstTransferLedger: ledgerSequence,
    });
  }
  return account;
}
