# Codelab: Custom Keyring Types

## Overview
This example demonstrates how to create custom keyring types to connect to third-party services. Custom keyring types allow you to define your own connection types, including support for different authentication methods and custom UI. This example includes four different types of custom keyrings:
- Basic authentication
- OAuth 2.0
- Multi-field secrets
- Referencing existing keyring types

## Basic Authentication
This example shows how to create a custom keyring type for a service that uses basic authentication, such as Freshdesk.

### Manifest
The `custom-keyring-type-basic.yaml` file defines a custom keyring type for Freshdesk. It specifies that the connection uses a secret, that the subdomain is part of the URL, and it provides a URL for verifying the token.

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
    is_subdomain: true # The is_subdomain field is used to indicate that the subdomain is part of the URL.
    secret_config: # The secret_config section is used to define the fields in the secret.
      secret_transform: ".token+\":X\" | @base64" # The secret_config section is used to transform data from the input fields into the secret value (token).
      fields: # optional: data that the user shall provide in the input form when creating the connection. Each element represents one input field. Fields will be included in the final JSON secret. If omitted, the user will be asked for a generic secret.
        - id: token
          name: Token
          description: Freshdesk API token
      token_verification: # The token_verification section is used to verify the token provided by the user.
        url: "https://[SUBDOMAIN].freshdesk.com/api/v2/tickets"
        method: "GET"
        headers:
          Authorization: "Basic [API_KEY]"
```

## OAuth 2.0
This example shows how to create a custom keyring type for a service that uses OAuth 2.0, such as GitLab.

### Manifest
The `custom-keyring-type-oauth.yaml` file defines a custom keyring type for GitLab. It specifies the OAuth 2.0 scopes, the authorization and token URLs, and the refresh and revoke URLs.

```yaml
version: "2"
name: "Custom Keyring Type Snap-in"
description: "Creating custom keyring type for GitLab OAuth connection"

# ... (service_account, developer_keyrings, keyrings) ...

keyring_types:
  - id: gitlab-oauth-connection
    name: "GitLab Connection"
    description: "GitLab connection"
    kind: "Oauth2"
    scopes: # Scopes that the connection can request, add more scopes if needed for your use case. Each scope should have a name, description and value.
      - name: read
        description: Read access
        value: "read_api"
      - name: api
        description: API access
        value: "api"
    scope_delimiter: " " # Space separated scopes
    oauth_secret: gitlab-oauth-secret # developer keyring that contains OAuth2 client ID and client secret. Shall be of type `oauth-secret`.
    authorize: # The authorize section is used to get the authorization code from the user and exchange it for an access token.
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
    refresh: # The refresh section is used to refresh the access token using the refresh token.
      type: "config"
      url: "https://gitlab.com/api/oauth.v2.access"
      method: "POST"
      query_parameters:
        "client_id": "[CLIENT_ID]"
        "client_secret": "[CLIENT_SECRET]"
        "refresh_token": "[REFRESH_TOKEN]"
      headers:
        "Content-type": "application/x-www-form-urlencoded"
    revoke: # The revoke section is used to revoke the access token.
      type: "config"
      url: "https://gitlab.com/oauth/revoke"
      method: "POST"
      headers:
        "Content-type": "application/x-www-form-urlencoded"
      query_parameters:
        "client_id": "[CLIENT_ID]"
        "client_secret": "[CLIENT_SECRET]"
        "token": "[ACCESS_TOKEN]"
```

## Multi-field Secrets
This example shows how to create a custom keyring type for a secret that has multiple fields, such as a username and password.

### Manifest
The `custom-keyring-type-secret.yaml` file defines a custom keyring type with two fields: `username` and `password`.

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
    secret_config: # The secret_config section is used to define the fields in the secret.
      fields: # optional: data that the user shall provide in the input form when creating the connection. Each element represents one input field. Fields will be included in the final JSON secret. If omitted, the user will be asked for a generic secret.
        - id: username
          name: Username
          description: Username
        - id: password
          name: Password
          description: Password
          is_optional: true # The field is optional
```

## Referencing Existing Keyring Types
This example shows how to create a custom keyring type that references an existing keyring type. This is useful for extending existing connection types with additional scopes or functionality.

### Manifest
The `reference-keyring-type.yaml` file defines a custom keyring type for Slack that references the existing `devrev-slack-oauth` keyring type.

```yaml
version: "2"
name: "Reference Keyring Type Snap-in"
description: "Creating the keyring type for Slack connection with reference to the existing Slack connection"

# ... (service_account, developer_keyrings, keyrings) ...

keyring_types:
  - id: slack-oauth-connection
    name: Slack Connection
    description: Slack connection
    kind: "Oauth2"
    scopes: # Scopes that the connection can request, add more scopes if needed for your use case. each scope should have a name, description and value.
      - name: read
        description: App mentions read only access
        value: app_mentions:read
      - name: write
        description: App channels history read only access
        value: "channels:history"
    scope_delimiter: "," # Space separated scopes
    oauth_secret: slack-oauth-secret # developer keyring that contains OAuth2 client ID and client secret. Shall be of type `oauth-secret`.
    reference_keyring: devrev-slack-oauth # referring to the existing slack connection keyring
```

## Next Steps
- Create a new custom keyring type for a different service that you use.
- Use a custom keyring type in a Snap-in to connect to a third-party service.
