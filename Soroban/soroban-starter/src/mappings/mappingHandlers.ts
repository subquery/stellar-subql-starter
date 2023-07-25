import { TransferEvent } from "../types";
import {SorobanEvent} from "@subql/types-soroban";

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`New event at block ${event.ledger}`);
  const _event = TransferEvent.create({
    id: event.id,
    contract: event.contractId,
    ledger: event.ledger,
    from: event.topic[1],
    to: event.topic[2],
    value: event.value.decoded
  })

  await _event.save();
}
