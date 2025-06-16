## Snap-in to perform an external action

Snap-in that mirrors an issue from
DevRev to GitHub. This introduces a command which can be used to replicate the issue in the specific repository.

To run the command : 
```
/gh_issue OrgName RepoName
```

### Testing locally

You can test your code by adding test events under `src/fixtures` similar to the example event provided. You can add [keyring](https://docs.devrev.ai/snap-ins/references/keyrings) values to the event payload to test API calls as well.

Once you have added the event, you can test your code by running:

```
npm install
npm run start -- --functionName=command_handler --fixturePath=on_command.json
```

### Adding external dependencies

You can also add dependencies on external packages in `package.json` under the “dependencies” key. These dependencies will be made available to your function at runtime and testing.

### Linting

To check for lint errors, run the following command:

```bash
npm run lint
```

To automatically fix lint errors, run:

```bash
npm run lint:fix
```

### Activating Snap-Ins

Once you are done with the testing, run the following commands to activate your snap_in:

1. Authenticate to devrev CLI

```
devrev profiles authenticate --org <devorg name> --usr <user email>
```

2. Create a snap_in_version

```
devrev snap_in_version create-one --path <template path> --create-package
```

3. Draft the snap_in

```
devrev snap_in draft
```

4. Update the snap_in

```
devrev snap_in update
```

5. Activate the snap_in

```
devrev snap_in activate
```
