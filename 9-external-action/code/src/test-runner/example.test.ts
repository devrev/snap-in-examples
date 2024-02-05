import { run } from '../functions/command_handler';

describe('Test some function', () => {
  it('Something', () => {
    run([
      {
        payload: {
          work_created: {
            work: {
              id: 'some-id',
            },
          },
        },
      },
    ]);
  });
});
