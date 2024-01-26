## DevRev Snaps TypeScript Template

This repository contains a template for the functions that can be deployed as
part of Snap-Ins.

For more reference on Snap-Ins, please refer to the [documentation](https://github.com/devrev/snap-in-docs)

### Getting started with the template
1. Create a new repository from this template.
2. In the new repository, you can add functions at path `src/functions` where the folder name corresponds to the function name in your manifest file.
3. Each function you add will also need to be mentioned in `src/function-factory.ts` .

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

### Deploying Snap-Ins
Once you are done with the testing, run the following commands to deploy your snap_in:

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
5. Deploy the snap_in
```
devrev snap_in deploy
```