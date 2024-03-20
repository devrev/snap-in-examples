## Example of Hook
In this snap-in, we create an example use-case of log to validate inputs. In this particular case, we check if the account ID provided is correct or not and the stages are different. 

### Testing locally
You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add keyring values to the event payload to test API calls as well.

Once you have added the event, you can test your code by running:
```
npm install
npm run start -- --functionName=validate_input --fixturePath=event.json
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