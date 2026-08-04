import { client } from "@devrev/typescript-sdk";
import { TimelineEntriesCreateRequestType } from '@devrev/typescript-sdk/dist/auto-generated/beta/beta-devrev-sdk';

async function greetTicket(event: any) {
  const use_motivating_message = event.input_data.global_values.use_motivating_message;
  const happy_message = event.input_data.global_values.happy_message;
  const motivating_message = event.input_data.global_values.motivating_message;
  const event_type = event.payload.type;

  let work: any;
  let oldSeverity: string | undefined;
  let newSeverity: string = "low";

  if (event_type === "work_created") {
    work = event.payload.work_created.work;
    oldSeverity = undefined;
    newSeverity = work.severity || "low";
  } else if (event_type === "work_updated") {
    work = event.payload.work_updated.work;
    const oldWork = event.payload.work_updated.old_work;
    oldSeverity = oldWork?.severity || "low";
    newSeverity = work.severity || "low";

    if (oldSeverity === newSeverity) {
      return;
    }
  } else {
    return;
  }

  if (work.type !== "ticket") {
    return;
  }
 
  const severityGreetingHappyMessage: Record<string, string> = {
    "blocker": "(Happy Message P0) BLOCKER: We're immediately prioritizing your critical ticket!",
    "high": "(Happy Message P1) HIGH: We've got this! Our team is already working on your high-priority issue.",
    "medium": "(Happy Message P2) MEDIUM: Your ticket is in! We'll start working on it soon.",
    "low": happy_message,
  };

  const severityGreetingMotivatingMessage: Record<string, string> = {
    "blocker": "(Motivating Message P0) BLOCKER: This is critical! We're handling it with maximum urgency!",
    "high": "(Motivating Message P1) HIGH: Ticket logged. Our team will handle it with care and speed.",
    "medium": "(Motivating Message P2) MEDIUM: All set! The team will make steady progress to get this sorted.",
    "low": motivating_message,
  };

  let message = severityGreetingHappyMessage[newSeverity] || happy_message;
  if (use_motivating_message) {
    message = severityGreetingMotivatingMessage[newSeverity] || motivating_message;
  }

  const devrevSDK = client.setup({
    endpoint: event.execution_metadata.devrev_endpoint,
    token: event.context.secrets.service_account_token,
  });

  try {
    const response = await devrevSDK.timelineEntriesCreate({
      object: work.id,
      type: TimelineEntriesCreateRequestType.TimelineComment,
      body: message,
    });
    return response;
  } catch (error: any) {
    if (event.context.secrets.service_account_token === "TEST-TOKEN-PLACEHOLDER") {
      return { success: false, message: "Test mode - skipped API call" };
    }
    throw error;
  }
}

export const run = async (events: any[]) => {
  for (let i = 0; i < events.length; i++) {
    await greetTicket(events[i]);
  }
};

export default run;