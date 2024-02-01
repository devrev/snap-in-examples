## User scoped Snap-in

This snap-in showcases user level settings in a snap-in. The snap-in does the following:
- When a work-item is created, the linked part becomes whatever the user chose in their user scoped settings. If they haven't set the user settings yet, the part remains the same.
- Whenever a work-item is closed, mention the owner with a custom message set by the owner. The owner of the work item can turn on this behavior.
- If the user scoped keyring for the issue owner is set, set the title of the created work item to the keyring secret. 

### Testing locally
You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add keyring values to the event payload to test API calls as well.

Once you have added the event, you can test your code by running:
```
npm install
npm run start -- --functionName=on_work_creation --fixturePath=on_work_created_event.json
```

### Adding external dependencies
You can also add dependencies on external packages in package.json under the “dependencies” key. These dependencies will be made available to your function at runtime and testing.

### Linting

To check for lint errors, run the following command:

```bash
npm run lint
```

To automatically fix fixable lint errors, run:

```bash
npm run lint:fix
```