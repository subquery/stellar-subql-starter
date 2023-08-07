import { Account, Transfer } from "../types";
import { SorobanEvent } from "@subql/types-soroban";

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`New transfer event found at block ${event.ledger}`);

  // Get data from the event
  // The transfer event has the following payload \[env, from, to\]
  // logger.info(JSON.stringify(event));
  const {
    topic: [env, from, to],
  } = event;

  const ledgerNumber: number = parseInt(event.ledger);

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
  blockNumber: number
): Promise<Account> {
  let account = await Account.get(id.toLowerCase());
  if (!account) {
    // We couldn't find the account
    account = Account.create({
      id: id.toLowerCase(),
      firstTransferLedger: blockNumber,
    });
  }
  return account;
}
