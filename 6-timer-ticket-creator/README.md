## Timer Ticket Creator Snap-in

Snap-in that creates a new ticket after every 10 minutes.

### Testing locally

You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add keyring values to the event payload to test API calls as well.

Once you have added the event, you can test your code by running:

```
npm install
npm run start -- --functionName=on_work_creation --fixturePath=on_work_created_event.json
```

### Adding external dependencies

You can also add dependencies on external packages in package.json under the “dependencies” key. These dependencies will be made available to your function at runtime and testing.

### Packaging the code

Once you are done with the testing,
Run

```
npm install
npm run build
npm run package
```

and ensure it succeeds.

You will see a `build.tar.gz` file is created and you can provide it while creating the snap_in_version.

### Linting

To check for lint errors, run the following command:

```bash
npm run lint
```

To automatically fix fixable lint errors, run:

```bash
npm run lint:fix
```
