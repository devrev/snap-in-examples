

export const run = async (events: any[]) => {
  
  for (const event of events) {
    console.info(`The work ${event.payload.work_created.work.id} has been created.`);
  }

};

export default run;
