import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer } from './runner';

(async () => {
  const argv = await yargs(hideBin(process.argv)).options({
    port: {
      require: false,
      type: 'number',
    },
  }).argv;

  const port = argv.port || 8000;
  startServer(port);
})();

