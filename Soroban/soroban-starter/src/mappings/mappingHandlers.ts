import { Contract } from "../types";
import {SorobanEvent} from "@subql/types-soroban";
import assert from "assert";

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`New event at block ${event.ledger}`);
  const _event = Contract.create({
    id: event.id,
    contract: event.contractId,
    ledger: event.ledger,
    topic0: event.topic[0],
    topic1: event.topic[1],
    topic2: event.topic[2]
  })

  await _event.save();
}
