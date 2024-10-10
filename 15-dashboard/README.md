## DevRev Snaps TypeScript Template

This repository contains a template for the functions that can be deployed as
part of Snap-Ins.

For reference on snap-ins, refer to the [documentation](https://github.com/devrev/snap-in-docs).

### Getting started with the template

1. Create a new repository using this template.
2. In the new repository, you can add functions at the path `src/functions` where the folder name corresponds to the function name in your manifest file.
3. Ensure to include each new function in the file named "src/function-factory.ts".

### Testing locally

To test your code locally, add test events under 'src/fixtures' following the example event provided. Additionally, you can include keyring values in the event payload to test API calls.```

After adding the event, execute the following commands to test your code:

```
npm install
npm run start -- --functionName=on_work_creation --fixturePath=on_work_created_event.json
```

### Adding external dependencies

You can also add dependencies on external packages to package.json under the “dependencies” key. These dependencies will be made available to your function at runtime and during testing.

### Linting

To check for lint errors, run the following command:

```bash
npm run lint
```

To automatically fix fixable lint errors, run:

```bash
npm run lint:fix
```

### Deploying Snap-ins

Once you are done with the testing, run the following commands to deploy your snap-in:

1. Authenticate to devrev CLI, run the following command:

```
devrev profiles authenticate --org <devorg name> --usr <user email>
```

2. To create a snap_in_version, run the following command:

```
devrev snap_in_version create-one --path <template path> --create-package
```

3. Draft the snap_in, run the following command:

```
devrev snap_in draft
```

4. To update the snap-in, run the following command:

```
devrev snap_in update
```

5. Activate the snap_in

```
devrev snap_in activate
```

### Testing Snap-in changes locally

### Setting up the server

To test out changes in snap-in locally, developers can create a snap-in version in test mode.
A snap-in version created in test mode enables developers to specify a public HTTP URL to receive events from DevRev. This makes for
quick code changes on the local machine without needing to repeatedly deploy the snap-in again for testing the changes.

To test out a snap-in version locally, follow the below steps:

1. Run a server locally to ingest events from DevRev. The `port` parameter is optional. If not set, the server starts default on `8000`.

```
npm run test:server -- --port=<PORT>
```

2. Expose the local port as a publicly available URL. We recommend using [`ngrok`](https://ngrok.com/download) since it is free and easy to set up. The command for running ngrok tunnelling on port `8000`:

```
ngrok http 8000
```

This returns a public HTTP URL.

3. Create a snap-in version with the `testing-url` flag set

```
devrev snap_in_version create-one --path <template path> --create-package --testing-url <HTTP_URL>
```

Here, `HTTP_URL` is the publicly available URL from Step 2. The URL should start with `http` or `https`

4. Once the snap-in version is ready, create a snap-in, update and activate it.

```
devrev snap_in draft
```

Update the snap-in through UI or using the CLI:

```
devrev snap_in update
```

Activate the snap-in through UI or through the CLI command:

```
devrev snap_in activate
```

### Receiving events locally

After the snap-in has been activated, it can receive events locally from DevRev as a
snap-in would. If the snap-in was listening to `work_created` event type, then creating a
new work-item would send the event to the local server.

If utilizing ngrok, accessing the ngrok UI is possible by opening http://127.0.0.1:4040/ in the browser. This interface offers a neat way to review the list of requests and replay them if necessary.

The service account token included with the request is valid for only 30 minutes. Therefore, attempting to call the DevRev API with that token for events older than this timeframe will result in a '401 Unauthorized' error.

### Updating manifest or the URL

The code can be changed without the need to create a snap-in version or redeploy the snap-in. On any change to the
`src` folder, the server restarts with the updated changes. However, on [patch compatible](https://developer.devrev.ai/snap-in-development/upgrade-snap-ins#version-compatibility) updates to the manifest or the testing URL, we can `upgrade` the snap-in version.

```
devrev snap_in_version upgrade --manifest <PATH_TO_MANIFEST> --testing-url <UPDATED_URL>
```

In case of non-patch compatible updates, the `force` flag can be used to upgrade the version. However this will delete any
existing snap-ins that have been created from this version.

```
devrev snap_in_version upgrade --force --manifest <PATH_TO_MANIFEST> --testing-url <UPDATED_URL>
```

Do note that manifest must always be provided when upgrading a snap-in version.
