import { AirdropEvent, EventType, spawn } from '@devrev/ts-adaas';

export interface DummyExtractorState {
  issues: { completed: boolean };
  users: { completed: boolean };
}

const initialState: DummyExtractorState = {
  issues: { completed: false },
  users: { completed: false },
};

function getWorkerPerExtractionPhase(event: AirdropEvent) {
  let path;
  switch (event.payload.event_type) {
    case EventType.ExtractionExternalSyncUnitsStart:
      path = __dirname + '/workers/external-sync-units-extraction';
      break;
    case EventType.ExtractionMetadataStart:
      path = __dirname + '/workers/metadata-extraction';
      break;
    case EventType.ExtractionDataStart:
    case EventType.ExtractionDataContinue:
      path = __dirname + '/workers/data-extraction';
      break;
  }
  return path;
}

const run = async (events: AirdropEvent[]) => {
  for (const event of events) {
    const file = getWorkerPerExtractionPhase(event);
    await spawn<DummyExtractorState>({
      event,
      initialState,
      workerPath: file,
      options: {
        isLocalDevelopment:true,
      },
    });

    console.log('Finished extraction for event: ', event.payload.event_type);
  }
};

export default run;
