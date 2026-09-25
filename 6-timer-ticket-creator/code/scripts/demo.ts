import { automation } from "@devrev-internal/snap-in-effect";
import {
  createTestSdk,
  testEvent,
} from "@devrev-internal/snap-in-effect/testing";
import { program } from "../src/functions/ticket_creator";

const main = async () => {
  const sdk = createTestSdk((request) => {
    console.log("Intended offline SDK write:", request.path, request.body);
    return { data: {} };
  });

  await automation({ sdk }, program)([
    testEvent({
      metadata: { event_key: "ten_minute_event" },
      scheduled_time: 1_706_519_400_000,
    }, { eventType: "timer.tick", functionName: "ticket_creator" }),
  ]);

  console.log("This transport is offline; no DevRev request was sent.");
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
