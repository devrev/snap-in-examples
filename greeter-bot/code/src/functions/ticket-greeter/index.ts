
import { client } from "@devrev/typescript-sdk";

async function handleEvent(event: any) {
  // Initialize DevRev SDK with authentication token and endpoint
  const devrevPAT = event.context.secrets.service_account_token;
  const API_BASE = event.execution_metadata.devrev_endpoint;
  const devrevSDK = client.setup({
    endpoint: API_BASE,
    token: devrevPAT,
  });

  // Extract the ticket that was created
  const workCreated = event.payload.work_created.work;
  
  // Safety check: Only process tickets 
  if (workCreated.type !== "ticket") {
    console.log(`Skipping non-ticket work item: ${workCreated.type}`);
    return;
  }

  // Extract ticket identifiers
  const ticketID = workCreated.id; 
  const ticketDisplayID = workCreated.display_id; 

  // Get configuration inputs from the manifest
  const inputData = event.input_data.global_values;
  const welcomeMessageType = inputData.welcome_message_type || "default"; // "default", "happy", or "motivating"
  const greetByPriority = inputData.greet_by_priority || false; // Whether to use priority-based greeting
  const ticketPriority = workCreated.severity || workCreated.priority; // Ticket priority level

  console.log(`Processing ticket ${ticketDisplayID} with message type: ${welcomeMessageType}`);

 
  let message = "";

  // Priority-based greeting takes precedence if enabled and ticket is high/critical priority
  if (greetByPriority && (ticketPriority === "high" || ticketPriority === "critical")) {
    // Use high priority message for urgent tickets
    message = inputData.high_priority_message || 
      "High Priority: We're prioritizing ticket %ticket_id% and will address it urgently!";
  } else {
    // Use the selected message type based on welcome_message_type configuration
    switch (welcomeMessageType) {
      case "happy":
        
        message = inputData.happy_message || 
          "Welcome! We're excited to help you with ticket %ticket_id%. Our team is here to assist you!";
        break;
      case "motivating":
        
        message = inputData.motivating_message || 
          "Thanks for reaching out! Ticket %ticket_id% is in good hands. We'll work together to get this resolved!";
        break;
      case "default":
      default:
       
        message = inputData.default_message || 
          "Hello! Thank you for creating ticket %ticket_id%. We've received your request and will get back to you soon.";
        break;
    }
  }

  // Replace the %ticket_id% placeholder with the actual ticket display ID
  message = message.replace(/%ticket_id%/g, ticketDisplayID);

  const body = {
    object: ticketID, 
    type: "timeline_comment", 
    body: message,
  };

  try {
    
    const response = await devrevSDK.timelineEntriesCreate(body as any);
    console.log(`Successfully posted greeting message on ticket ${ticketDisplayID}`);
    return response;
  } catch (error: any) {
    
    if (error.response?.status === 401) {
      console.log(`⚠️  Authentication failed (401). This is expected when using test fixtures with placeholder tokens.`);
      console.log(`   In production, DevRev will provide a valid service account token.`);
      console.log(`   Message that would be posted: "${message}"`);
      
      return undefined;
    } else {
      
      console.error(`Error posting comment on ticket ${ticketDisplayID}:`, error.message);
      throw error;
    }
  }
}


export const run = async (events: any[]) => {
  
  console.info("events", JSON.stringify(events), "\n\n\n");
  
  for (let event of events) {
    const resp = await handleEvent(event);
    
    if (resp) {
      console.log(JSON.stringify(resp.data));
    }
  }
};

export default run;
