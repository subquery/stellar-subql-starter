import { Increment } from "../types";
import { SorobanEvent } from "@subql/types-stellar";

export async function handleEvent(event: SorobanEvent): Promise<void> {
  logger.info(`Transaction hash: ${event.transaction!.hash.toString()}`);
  if (event.type.toString() == "contract") {
    logger.info(`Event value: ${JSON.stringify(event.value)}`);
    const increment = Increment.create({
      id: event.transaction!.hash,
      newValue: BigInt(
        JSON.parse(JSON.stringify(event.value))["_value"].toString(),
      ),
    });
    await increment.save();
  }
}
