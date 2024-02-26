## Vacation Responder

This snap-in showcases user level settings in a snap-in. When a user is assigned an issue while they are on vacation, a custom message shows up on the issue's timeline. 

### Testing locally
You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add keyring values to the event payload to test API call   s as well.

Once you have added the event, you can test your code by running:
```
npm install
npm run start -- --functionName=vacation_responder --fixturePath=on_work_created_event.json
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