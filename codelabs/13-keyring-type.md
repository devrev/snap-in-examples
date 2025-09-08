# Codelab: Custom Keyring Types

## Overview
This example demonstrates how to create custom keyring types to connect to third-party services. Custom keyring types allow you to define your own connection types, including support for different authentication methods and custom UI. This example includes four different types of custom keyrings:
- Basic authentication
- OAuth 2.0
- Multi-field secrets
- Referencing existing keyring types

## Prerequisites
- Node.js and `npm` installed.
- A DevRev account.
- The DevRev CLI installed and configured.

## 1. Basic Authentication
This example shows how to create a custom keyring type for a service that uses basic authentication, such as Freshdesk. The `custom-keyring-type-basic.yaml` file defines a custom keyring type for Freshdesk, specifying that the connection uses a secret, the subdomain is part of the URL, and provides a URL for verifying the token.

```yaml
version: "2"
name: "Custom Keyring Type Snap-in"
description: "Creating custom keyring type for Freshdesk Basic connection"
keyrings:
    organization:
      - name: freshdesk_connection
        display_name: Freshdesk connection (must be set up as dev org connection)
        description: The Freshdesk app connection for the organization.
        types:
            - freshdesk-basic-connection
keyring_types:
  - id: freshdesk-basic-connection
    name: Freshdesk Connection
    description: Freshdesk connection
    kind: "Secret"
    is_subdomain: true
    secret_config:
      secret_transform: ".token+\":X\" | @base64"
      fields:
        - id: token
          name: Token
          description: Freshdesk API token
      token_verification:
        url: "https://[SUBDOMAIN].freshdesk.com/api/v2/tickets"
        method: "GET"
        headers:
          Authorization: "Basic [API_KEY]"
```

## 2. OAuth 2.0
This example shows how to create a custom keyring type for a service that uses OAuth 2.0, such as GitLab. The `custom-keyring-type-oauth.yaml` file defines the scopes, authorization/token URLs, and refresh/revoke URLs.

```yaml
version: "2"
name: "Custom Keyring Type Snap-in"
description: "Creating custom keyring type for GitLab OAuth connection"
service_account:
  display_name: DevRev Bot
developer_keyrings:
  - name: gitlab-oauth-secret
    description: GitLab OAuth secret
    display_name: GitLab OAuth secret
keyrings:
  organization:
    - name: gitlab_connection
      display_name: GitLab connection (must be set up as dev org connection)
      description: The gitlab app connection for the organization.
      types:
        - gitlab-oauth-connection
keyring_types:
  - id: gitlab-oauth-connection
    name: "GitLab Connection"
    description: "GitLab connection"
    kind: "Oauth2"
    scopes:
      - name: read
        description: Read access
        value: "read_api"
      - name: api
        description: API access
        value: "api"
    scope_delimiter: " "
    oauth_secret: gitlab-oauth-secret
    authorize:
      type: "config"
      auth_url: "https://gitlab.com/oauth/authorize"
      token_url: "https://gitlab.com/oauth/token"
      grant_type: "authorization_code"
      auth_query_parameters:
        "client_id": "[CLIENT_ID]"
        "scope": "[SCOPES]"
        "response_type": "code"
      token_query_parameters:
        "client_id": "[CLIENT_ID]"
        "client_secret": "[CLIENT_SECRET]"
    refresh:
      type: "config"
      url: "https://gitlab.com/api/oauth.v2.access"
      method: "POST"
# ... (rest of the file)
```

## 3. Multi-field Secrets
This example shows how to create a custom keyring type for a secret with multiple fields, like a username and password. The `custom-keyring-type-secret.yaml` defines a type with `username` and `password` fields.

```yaml
version: "2"
name: "Custom Keyring Type Snap-in"
description: "Creating custom keyring type for Multi Field Secret"
keyrings:
  organization:
    - name: multi_field_secret
      display_name: Multi Field Secret
      description: The multi field secret for the organization.
      types:
        - multi-field-secret
keyring_types:
  - id: multi-field-secret
    name: Multi Field Secret
    description: Multi Field Secret
    kind: "Secret"
    secret_config:
      fields:
        - id: username
          name: Username
          description: Username
        - id: password
          name: Password
          description: Password
          is_optional: true
```

## 4. Referencing Existing Keyring Types
This example shows how to create a custom keyring type that references an existing one, which is useful for extending connection types. The `reference-keyring-type.yaml` file defines a custom type for Slack that references the existing `devrev-slack-oauth` type.

```yaml
version: "2"
name: "Reference Keyring Type Snap-in"
description: "Creating the keyring type for Slack connection with reference to the existing Slack connection"
service_account:
  display_name: DevRev Bot
developer_keyrings:
  - name: slack-oauth-secret
    description: Slack OAuth secret
    display_name: Slack OAuth secret
keyrings:
  organization:
    - name: slack_connection
      display_name: Slack connection (must be set up as dev org connection)
      description: The slack app connection for the organization.
      types:
        - slack-oauth-connection
keyring_types:
  - id: slack-oauth-connection
    name: Slack Connection
    description: Slack connection
    kind: "Oauth2"
    scopes:
      - name: read
        description: App mentions read only access
        value: app_mentions:read
      - name: write
        description: App channels history read only access
        value: "channels:history"
    scope_delimiter: ","
    oauth_secret: slack-oauth-secret
    reference_keyring: devrev-slack-oauth
```

## Getting Started from Scratch
To build this Snap-in from scratch, follow these steps:

1.  **Initialize Project**:
    - **TODO**: Use the `devrev snaps init` command to scaffold a new Snap-in project structure. This will create the basic directory layout and configuration files.

2.  **Update Manifest**:
    - **TODO**: Modify the generated `manifest.yaml` to define your Snap-in's name, functions, and event subscriptions, similar to the example provided in this guide.

3.  **Implement Function**:
    - **TODO**: Write your function's logic in the corresponding `index.ts` file within the `code/src/functions/` directory.

4.  **Test Locally**:
    - **TODO**: Create a test fixture (e.g., `event.json`) with a sample event payload. Use the `npm run start:watch` command to run your function and verify its behavior.
