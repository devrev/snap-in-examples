import { automation } from "@devrev-internal/snap-in-effect";
import {
  createTestDevRev,
  testEvent,
} from "@devrev-internal/snap-in-effect/testing";
import { describe, expect, it } from "bun:test";
import manifest from "../manifest.config";
import {
  program,
  programWithClock,
  ticketTimestamp,
} from "../src/functions/ticket_creator";

const tick = {
  metadata: { event_key: "ten_minute_event" },
  scheduled_time: 1_706_519_400_000,
};

const createEvent = () => testEvent(tick, {
  eventType: "timer.tick",
  functionName: "ticket_creator",
});

const expectedRequest = (timestamp: string) => ({
  path: "/works.create",
  method: "post",
  body: {
    title: `Ticket created at ${timestamp}`,
    body: `This ticket was created by a snap-in at ${timestamp}`,
    applies_to_part: "PROD-1",
    owned_by: ["DEVU-1"],
    type: "ticket",
  },
});

describe("ticket_creator", () => {
  const fixedDate = new Date("2026-09-22T13:00:00.000Z");
  const fixedProgram = programWithClock(() => fixedDate);

  it("creates one ticket with a shared timestamp for a timer tick", async () => {
    using devrev = createTestDevRev();
    devrev.respondWith({ data: {} });

    await automation({ sdk: devrev.sdk }, fixedProgram)([createEvent()]);

    expect(devrev.requests).toMatchObject([expectedRequest(ticketTimestamp(fixedDate))]);
  });

  it("creates one ticket for every event in a batch", async () => {
    using devrev = createTestDevRev();
    devrev.respondWith({ data: {} }, { data: {} });

    await automation({ sdk: devrev.sdk }, fixedProgram)([createEvent(), createEvent()]);

    expect(devrev.requests).toMatchObject([
      expectedRequest(ticketTimestamp(fixedDate)),
      expectedRequest(ticketTimestamp(fixedDate)),
    ]);
  });

  it("rejects malformed timer payloads before creating tickets", async () => {
    using devrev = createTestDevRev();

    await expect(automation({ sdk: devrev.sdk }, program)([
      testEvent({ scheduled_time: tick.scheduled_time }),
    ])).rejects.toMatchObject({ retry: false });
    expect(devrev.requests).toHaveLength(0);
  });

  it("does not retry permanent ticket creation failures", async () => {
    using devrev = createTestDevRev();
    devrev.respondWith({ status: 400, data: {} });

    await expect(automation({ sdk: devrev.sdk }, fixedProgram)([createEvent()]))
      .rejects.toMatchObject({ retry: false });
    expect(devrev.requests).toHaveLength(1);
  });

  it("creates another ticket when the full handler is replayed", async () => {
    using devrev = createTestDevRev();
    devrev.respondWith({ data: {} }, { data: {} });
    const run = automation({ sdk: devrev.sdk }, fixedProgram);

    await run([createEvent()]);
    await run([createEvent()]);

    expect(devrev.requests).toMatchObject([
      expectedRequest(ticketTimestamp(fixedDate)),
      expectedRequest(ticketTimestamp(fixedDate)),
    ]);
  });
});

describe("timer-ticket-creator manifest", () => {
  it("preserves the public timer, function, automation, and service account contract", () => {
    expect(manifest).toMatchObject({
      name: "Timely Ticketer",
      service_account: {
        display_name: "Automatic Ticket Creator Bot",
        scopes: { self: [] },
      },
      event_sources: {
        organization: [{
          name: "timer-event-source",
          type: "timer-events",
          config: {
            cron: "*/10 * * * *",
            metadata: { event_key: "ten_minute_event" },
          },
        }],
      },
      functions: [{ name: "ticket_creator" }],
      automations: [{
        name: "periodic_ticket_creator",
        source: "timer-event-source",
        event_types: ["timer.tick"],
        function: "ticket_creator",
      }],
    });
  });
});
