import {
  automation,
  decodePayload,
  DevRev,
  type SnapInEvent,
} from "@devrev-internal/snap-in-effect";
import { publicSDK } from "@devrev/typescript-sdk";
import { Effect, Schema } from "effect";

const TimerTick = Schema.Struct({
  metadata: Schema.Struct({ event_key: Schema.Literal("ten_minute_event") }),
  scheduled_time: Schema.Number,
});

export const ticketTimestamp = (date: Date) => date.toLocaleString();

export const programWithClock = (now: () => Date = () => new Date()) =>
  (event: SnapInEvent) => Effect.gen(function* () {
    yield* decodePayload(TimerTick, event);

    const timestamp = ticketTimestamp(now());
    const devrev = yield* DevRev;
    yield* devrev.call(
      "worksCreate",
      (sdk, requestParams) =>
        sdk.worksCreate(
          {
            title: `Ticket created at ${timestamp}`,
            body: `This ticket was created by a snap-in at ${timestamp}`,
            applies_to_part: "PROD-1",
            owned_by: ["DEVU-1"],
            type: publicSDK.WorkType.Ticket,
          },
          requestParams,
        ),
    );
  });

export const program = programWithClock();

export const run = automation(program);

export default run;
