# Timer ticket creator snap-in

This example creates one ticket for every ten-minute timer tick. It was ported from the legacy TypeScript snap-in template to the local Effect runtime and typed-manifest packages in `vendor/snap-in-effect`.

## Preserved behavior

- The `timer-event-source` event source still runs on `*/10 * * * *` with `ten_minute_event` metadata.
- The `ticket_creator` function remains bound to `periodic_ticket_creator` for `timer.tick`.
- Each accepted event creates one ticket with a timestamped title and body.
- The ticket still uses `PROD-1` and `DEVU-1`.
- The service account remains `Automatic Ticket Creator Bot` with `self` scope only.

A completed handler can be delivered again, which creates another ticket. This is intentionally unchanged from the original example: ticket creation has no idempotency key and the runtime does not retry the write inline.

## Verify locally

The locally built runtime packages are checked in under `code/vendor/packages`:

```bash
cd 6-timer-ticket-creator/code
npm ci
npm run typecheck
npm test
npm run manifest
npm run build
```

`npm run demo` invokes the handler with an offline SDK transport and never sends a DevRev request. The generated `manifest.yaml` is the reviewed deployment manifest. This migration does not deploy, install, or activate the snap-in.
