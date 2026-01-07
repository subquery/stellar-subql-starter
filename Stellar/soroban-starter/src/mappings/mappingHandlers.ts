import assert from "node:assert";
import { Account, Credit, Debit, Payment, Transfer } from "../types";
import {
  StellarEvent,
  StellarOperation,
  getTransactionSourceAccount,
} from "@subql/types-stellar";
import { type Operation } from "@stellar/stellar-sdk";
import {
  encodeMuxedAccountToAddress,
  scValToNative,
  // xdr,
} from "@stellar/stellar-base";

export async function handleOperation({
  index,
  operation,
  transaction,
}: StellarOperation<Operation.Payment>): Promise<void> {
  const body = operation.body();
  logger.info(`Indexing operation, type: ${body.switch().name}`);

  assert(
    body.switch().name === "payment", // === xdr.OperationType.payment(),
    `Expected operation to be a payment, received ${body.switch().name}`,
  );
  const { ledger } = transaction.tx;

  const sourceAccount = operation.sourceAccount()
    ? encodeMuxedAccountToAddress(operation.sourceAccount()!, true)
    : getTransactionSourceAccount(transaction.tx);
  const dest = body.paymentOp().destination();
  assert(sourceAccount, "Expected payment operation to have a source account");
  assert(dest, "Expected payment operation to have a destination");

  const fromAccount = await checkAndGetAccount(sourceAccount, ledger);
  const toAccount = await checkAndGetAccount(
    encodeMuxedAccountToAddress(dest, true),
    ledger,
  );

  const payment = Payment.create({
    id: `${transaction.tx.txHash}-${index}`,
    fromId: fromAccount.id,
    toId: toAccount.id,
    txHash: transaction.tx.txHash,
    amount: body.paymentOp().amount().toString(),
  });

  fromAccount.lastSeenLedger = ledger;
  toAccount.lastSeenLedger = ledger;
  await Promise.all([fromAccount.save(), toAccount.save(), payment.save()]);
}

// export async function handleCredit(
//   effect: StellarEffect<AccountCredited>,
// ): Promise<void> {
//   logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

//   const account = await checkAndGetAccount(
//     effect.account,
//     effect.ledger!.sequence,
//   );

//   const credit = Credit.create({
//     id: effect.id,
//     accountId: account.id,
//     amount: effect.amount,
//   });

//   account.lastSeenLedger = effect.ledger!.sequence;
//   await Promise.all([account.save(), credit.save()]);
// }

// export async function handleDebit(
//   effect: StellarEffect<AccountDebited>,
// ): Promise<void> {
//   logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

//   const account = await checkAndGetAccount(
//     effect.account,
//     effect.ledger!.sequence,
//   );

//   const debit = Debit.create({
//     id: effect.id,
//     accountId: account.id,
//     amount: effect.amount,
//   });

//   account.lastSeenLedger = effect.ledger!.sequence;
//   await Promise.all([account.save(), debit.save()]);
// }

export async function handleEvent(event: StellarEvent): Promise<void> {
  logger.info(`New transfer event found in transaction ${event.event.txHash}`);

  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  // logger.info(JSON.stringify(event));
  const {
    topic: [symbol, from, to],
  } = event.event;

  try {
    scValToNative(from);
  } catch (e) {
    logger.info(
      `decode from failed ${from.switch().name}, ${JSON.stringify(from, null, 2)}, error: ${e}`,
    );
  }

  try {
    scValToNative(to);
  } catch (e) {
    logger.info(
      `decode to failed ${event.event.topic.length}, ${JSON.stringify(event.event.topic, null, 2)}, error: ${e}`,
    );
  }

  const fromAccount = await checkAndGetAccount(
    scValToNative(from),
    event.event.ledger,
  );
  const toAccount = await checkAndGetAccount(
    scValToNative(to),
    event.event.ledger,
  );

  logger.info(`VALUE TPE ${event.event.value.switch().name} `);

  // Create the new transfer entity
  const transfer = Transfer.create({
    id: event.event.id,
    ledger: event.event.ledger,
    date: new Date(event.event.ledgerClosedAt),
    contract: event.event.contractId?.contractId().toString()!,
    fromId: fromAccount.id,
    toId: toAccount.id,
    value: scValToNative(event.event.value),
  });

  fromAccount.lastSeenLedger = event.event.ledger;
  toAccount.lastSeenLedger = event.event.ledger;
  await Promise.all([fromAccount.save(), toAccount.save(), transfer.save()]);
}

async function checkAndGetAccount(
  id: string,
  ledgerSequence: number,
): Promise<Account> {
  let account = await Account.get(id.toLowerCase());
  if (!account) {
    // We couldn't find the account
    account = Account.create({
      id: id.toLowerCase(),
      firstSeenLedger: ledgerSequence,
    });
  }
  return account;
}
