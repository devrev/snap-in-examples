import {
    FunctionInput,
    OperationBase,
    OperationContext,
    ExecuteOperationInput,
    OperationOutput,
    Error_Type,
    OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';

import axios from 'axios';
import { isValidDon, parseDonV2 } from './utils/don';

interface GetSchemaInfoInput {
    id: string;
}

interface GetSchemaInfoOutputEntry {
    name: string;
    type: string;
    description: string;
}

interface SchemaListResponse {
    result: SchemaListResult[];
}

interface SchemaListResult {
    fields: SchemaField[];
}

interface SchemaField {
    name: string;
    field_type: string;
    base_type: string;
    description: string;
}

export class GetSchemaInfo extends OperationBase {
    constructor(e: FunctionInput) {
        super(e);
    }

    private getFieldsFromSchema(schema: any): GetSchemaInfoOutputEntry[] {
        const response = schema as SchemaListResponse;
        const fields = [];

        for (const result of response.result) {
            for (const field of result.fields) {
                let type = field.field_type;
                if (type === 'array') {
                    type = `[]${field.base_type}`;
                }
                fields.push({
                    name: field.name,
                    type: type,
                    description: field.description,
                });
            }
        }

        return fields;
    }

    async run(context: OperationContext, input: ExecuteOperationInput, _: Record<string, any>): Promise<OperationOutput> {
        const customSchemaEndpoint = `${context.devrev_endpoint}/internal/schemas.custom.list`;
        const stockSchemaEndpoint = `${context.devrev_endpoint}/internal/schemas.stock.list`;
        const token = context.secrets.access_token;
        const request = input.data as GetSchemaInfoInput;

        if (!request.id) {
            return OperationOutput.fromJSON({
                error: {
                    message: 'Object ID must be provided',
                    type: Error_Type.InvalidRequest,
                },
            });
        }

        if (!isValidDon(request.id)) {
            return OperationOutput.fromJSON({
                error: {
                    message: 'Invalid object ID',
                    type: Error_Type.InvalidRequest,
                },
            });
        }
        const objectDON = parseDonV2(request.id);
        const objectType = objectDON.objectType;

        try {
            const customFieldResponse = await axios.get(customSchemaEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                params: {
                    leaf_type: objectType,
                    is_custom_leaf_type: objectDON.is_custom_leaf_type,
                },
            });
            const customFields = this.getFieldsFromSchema(customFieldResponse.data);

            const stockFieldResponse = await axios.get(stockSchemaEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                params: {
                    leaf_type: objectType,
                },
            });
            const stockFields = this.getFieldsFromSchema(stockFieldResponse.data);

            return OperationOutput.fromJSON({
                output: {
                    values: [{
                        stock_fields: stockFields,
                        custom_fields: customFields,
                    }],
                } as OutputValue,
            });
        } catch (error: any) {
            console.error(error);
            return OperationOutput.fromJSON({
                error: {
                    message: error.message || 'An error occurred',
                    type: Error_Type.InvalidRequest,
                },
            });
        }
    }
}
