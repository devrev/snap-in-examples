export const run = async (events: any[]) => {
    /*
    Put your code here and remove the log below
    */
    console.info(`The work ${events[0].payload.work_updated.work.id} has been updated.`);
  };
  
  export default run;
  