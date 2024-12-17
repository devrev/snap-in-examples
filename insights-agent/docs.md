# Insights Agent Workflow Setup

This documentation outlines the steps to create a workflow that executes SQL queries on an Oasis dataset and returns the results to an agent.

> **Note**: Before starting, set your DevRev environment variables:
> ```bash
> export DEVREV_PAT="your_pat_token_here"
> export DEVREV_URL="https://api.devrev.ai"  # Or your appropriate DevRev API URL
> ```

## 1. Create Workflow
```bash
WORKFLOW_ID=$(curl "${DEVREV_URL}/internal/workflows.create" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "title": "Insights Agent"
  }' | jq -r .workflow.id)

echo "Created workflow with ID: $WORKFLOW_ID"
```

## 2. Add Manual Trigger Step
```bash
MANUAL_TRIGGER_STEP_ID=$(curl "${DEVREV_URL}/internal/workflow-steps.create" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "description": "Manually triggers the workflow",
    "name": "Manual Trigger",
    "operation": "don:integration:dvrv-us-1:operation/devrev.manual_trigger",
    "workflow": "'${WORKFLOW_ID}'",
    "output_ports": [{
      "name": "output",
      "schema": {
        "field_descriptors": [
          {
            "field_type": "id",
            "db_name": "agent_session_id",
            "description": "The ID of the agent session",
            "id_type": ["ai_agent_session"],
            "is_required": true,
            "name": "agent_session_id"
          },
          {
            "field_type": "text",
            "db_name": "skill_call_id",
            "description": "The ID of the skill call being executed",
            "is_required": true,
            "name": "skill_call_id"
          },
          {
            "field_type": "text",
            "db_name": "skill_name",
            "description": "The name of the skill being executed",
            "is_required": true,
            "name": "skill_name"
          },
          {
            "field_type": "text",
            "db_name": "sql_query",
            "description": "The query",
            "is_required": true,
            "name": "sql_query"
          }
        ],
        "type": "field_descriptor"
      }
    }],
    "reference_key": "ai_agent_skill_manual_trigger",
    "ui_metadata": {"position": {"x": 0, "y": 0}}
  }' | jq -r .workflow_step.id)

echo "Created manual trigger step with ID: $MANUAL_TRIGGER_STEP_ID"
```

## 3. Add SQL Execute Step
```bash
SQL_EXECUTE_STEP_ID=$(curl "${DEVREV_URL}/internal/workflow-steps.create" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "description": "Executes a SQL query on an Oasis dataset",
    "name": "Oasis Sql Execute",
    "operation": "don:integration:dvrv-us-1:operation/devrev.oasis_sql_execute",
    "reference_key": "oasis_sql_execute_1",
    "ui_metadata": {"position": {"x": 150, "y": 150}},
    "workflow": "'${WORKFLOW_ID}'"
  }' | jq -r .workflow_step.id)

echo "Created SQL execute step with ID: $SQL_EXECUTE_STEP_ID"
```

## 4. Connect Trigger to SQL Step
```bash
curl "${DEVREV_URL}/internal/workflow-steps.update" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "id": "'${MANUAL_TRIGGER_STEP_ID}'",
    "next_steps": [{
      "next_port_name": "input",
      "next_step": "'${SQL_EXECUTE_STEP_ID}'",
      "port_name": "output"
    }]
  }'
```

## 5. Configure SQL Input
```bash
curl "${DEVREV_URL}/internal/workflow-steps.update" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "id": "'${SQL_EXECUTE_STEP_ID}'",
    "input_values": [{
      "fields": [{
        "name": "sql_query",
        "value": {
          "type": "text_template",
          "value": "{% expr $get('\''ai_agent_skill_manual_trigger'\'', '\''output'\'').sql_query %}"
        }
      }],
      "port_name": "input"
    }]
  }'
```

## 6. Add Agent Callback Step
```bash
curl "${DEVREV_URL}/internal/workflow-steps.create" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "description": "Takes the output of the retriever workflow and returns it to the agent",
    "name": "Agent Callback",
    "operation": "don:integration:dvrv-us-1:operation/devrev.agent_callback",
    "previous_steps": [{
      "id": "'${SQL_EXECUTE_STEP_ID}'",
      "port_name": "input",
      "previous_port_name": "output"
    }],
    "reference_key": "agent_callback_1",
    "workflow": "'${WORKFLOW_ID}'",
    "ui_metadata": {"position": {"x": 131, "y": 339}},
    "input_values": [{
      "fields": [
        {
          "name": "agent_session_id",
          "value": {
            "type": "jsonata_expression",
            "value": "$get('\''ai_agent_skill_manual_trigger'\'', '\''output'\'').agent_session_id"
          }
        },
        {
          "name": "skill_call_id",
          "value": {
            "type": "jsonata_expression",
            "value": "$get('\''ai_agent_skill_manual_trigger'\'', '\''output'\'').skill_call_id"
          }
        },
        {
          "name": "skill_name",
          "value": {
            "type": "jsonata_expression",
            "value": "$get('\''ai_agent_skill_manual_trigger'\'', '\''output'\'').skill_name"
          }
        },
        {
          "name": "output",
          "value": {
            "type": "jsonata_expression",
            "value": "$get('\''oasis_sql_execute_1'\'', '\''output'\'')"
          }
        }
      ],
      "port_name": "input"
    }]
  }'
```


## 7. Activate the Workflow
```bash
curl "${DEVREV_URL}/internal/workflows.update-status" \
  -H 'accept: application/json' \
  -H "authorization: ${DEVREV_PAT}" \
  -H 'content-type: application/json' \
  --data-raw '{
    "id": "'${WORKFLOW_ID}'",
    "status": "active"
  }'
```
