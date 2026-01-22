import { Account, Credit, Debit, Payment, Transfer } from "../types";
import {
  StellarOperation,
  StellarEffect,
  SorobanEvent,
} from "@subql/types-stellar";
import {
  AccountCredited,
  AccountDebited,
} from "@stellar/stellar-sdk/lib/horizon/types/effects";
import type { Horizon } from "@stellar/stellar-sdk";
import { xdr } from "@stellar/stellar-sdk";
import { Address, scValToBigInt } from "@stellar/stellar-base";

export async function handleOperation(
  op: StellarOperation<Horizon.HorizonApi.PaymentOperationResponse>,
): Promise<void> {
  logger.info(`Indexing operation ${op.id}, type: ${op.type}`);

  const fromAccount = await checkAndGetAccount(op.from, op.ledger!.sequence);
  const toAccount = await checkAndGetAccount(op.to, op.ledger!.sequence);

  const payment = Payment.create({
    id: op.id,
    fromId: fromAccount.id,
    toId: toAccount.id,
    txHash: op.transaction_hash,
    amount: op.amount,
  });

  fromAccount.lastSeenLedger = op.ledger!.sequence;
  toAccount.lastSeenLedger = op.ledger!.sequence;
  await Promise.all([fromAccount.save(), toAccount.save(), payment.save()]);
}

export async function handleCredit(
  effect: StellarEffect<AccountCredited>,
): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

  const account = await checkAndGetAccount(
    effect.account,
    effect.ledger!.sequence,
  );

  const credit = Credit.create({
    id: effect.id,
    accountId: account.id,
    amount: effect.amount,
  });

  account.lastSeenLedger = effect.ledger!.sequence;
  await Promise.all([account.save(), credit.save()]);
}

export async function handleDebit(
  effect: StellarEffect<AccountDebited>,
): Promise<void> {
  logger.info(`Indexing effect ${effect.id}, type: ${effect.type}`);

  const account = await checkAndGetAccount(
    effect.account,
    effect.ledger!.sequence,
  );

  const debit = Debit.create({
    id: effect.id,
    accountId: account.id,
    amount: effect.amount,
  });

  account.lastSeenLedger = effect.ledger!.sequence;
  await Promise.all([account.save(), debit.save()]);
}

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(
    `New transfer event found at block ${event.ledger!.sequence.toString()}`,
  );

  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  const {
    topic: [env, from, to],
  } = event;

  // Check if the topic values are actually addresses before decoding
  // ScVal.switch() tells us the type - we need 'scvAddress' type
  const fromType = from.switch().name;
  const toType = to.switch().name;
  if (fromType !== 'scvAddress' || toType !== 'scvAddress') {
    logger.info(`Event topic is not an address type, skipping. from: ${fromType}, to: ${toType}`);
    return;
  }

  // Check if address types are supported (0 = accountId, 1 = contractId)
  // Skip if unsupported type (e.g., type 4 or others)
  const fromAddressType = from.address().switch().value;
  const toAddressType = to.address().switch().value;
  if (fromAddressType !== 0 && fromAddressType !== 1) {
    logger.info(`Unsupported from address type: ${fromAddressType}, skipping event`);
    return;
  }
  if (toAddressType !== 0 && toAddressType !== 1) {
    logger.info(`Unsupported to address type: ${toAddressType}, skipping event`);
    return;
  }

  const fromAccount = await checkAndGetAccount(
    decodeAddress(from),
    event.ledger!.sequence,
  );
  const toAccount = await checkAndGetAccount(
    decodeAddress(to),
    event.ledger!.sequence,
  );

  // Check if event.value is an integer type before converting
  const valueType = event.value.switch().name;
  const integerTypes = ['scvU32', 'scvI32', 'scvU64', 'scvI64', 'scvU128', 'scvI128', 'scvU256', 'scvI256'];
  if (!integerTypes.includes(valueType)) {
    logger.info(`Event value is not an integer type: ${valueType}, skipping event`);
    return;
  }

  // Create the new transfer entity
  const contractAddress = event.contractId ? Buffer.from(event.contractId.contractId()).toString('hex') : '';
  const transfer = Transfer.create({
    id: event.id,
    ledger: event.ledger!.sequence,
    date: new Date(event.ledgerClosedAt),
    contract: contractAddress,
    fromId: fromAccount.id,
    toId: toAccount.id,
    value: scValToBigInt(event.value),
  });

  fromAccount.lastSeenLedger = event.ledger!.sequence;
  toAccount.lastSeenLedger = event.ledger!.sequence;
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

// scValToNative not works, temp solution
function decodeAddress(scVal: xdr.ScVal): string {
  const address = scVal.address();

  // Must check which arm of the union is set FIRST using switch()
  // Calling .accountId() or .contractId() directly throws if that arm isn't set
  // ScAddressType enum: 0 = accountId, 1 = contractId
  const addressType = address.switch().value;
  if (addressType === 0) {
    return Address.account(address.accountId().ed25519()).toString();
  } else if (addressType === 1) {
    return Address.contract(address.contractId() as unknown as Buffer).toString();
  }

  throw new Error(`Unknown address type: ${addressType}`);
}
