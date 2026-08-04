import { client } from '@devrev/typescript-sdk';
import {
  Error as OperationError,
  Error_Type,
  ExecuteOperationInput,
  FunctionInput,
  OperationBase,
  OperationContext,
  OperationOutput,
  OutputValue,
} from '@devrev/typescript-sdk/dist/snap-ins';

interface GenerateFormalDocumentInput {
  text: string;
  case_type: string;
}

export class GenerateFormalDocument extends OperationBase {
  constructor(e: FunctionInput) {
    super(e);
  }

  async run(_context: OperationContext, input: ExecuteOperationInput, _resources: any): Promise<OperationOutput> {
    console.debug('Starting generate_formal_document operation');
    console.debug('Input received:', JSON.stringify(input.data, null, 2));

    const input_data = input.data as GenerateFormalDocumentInput;
    
    if (!input_data.text || !input_data.case_type) {
      console.error('Missing required fields:', {
        hasText: !!input_data.text,
        hasCaseType: !!input_data.case_type
      });
      return OperationOutput.fromJSON({
        error: {
          message: 'Missing required fields: text and case_type must be provided',
          type: Error_Type.InvalidRequest,
        },
        output: {
          values: [],
        } as OutputValue,
      });
    }

    try {
      console.debug('Validating case type:', input_data.case_type);
      // validation for case type
      // ensure case type is one of the following:
      // Contract Agreement - ca 
      // Non-Disclosure Agreement - nda
      // Service Level Agreement - sla
      // Employment Agreement - employment
      // General Letter - letter
      const validCaseTypes = ['ca', 'nda', 'sla', 'employment', 'letter'];
      if (!validCaseTypes.includes(input_data.case_type)) {
        console.error('Invalid case type provided:', {
          providedType: input_data.case_type,
          validTypes: validCaseTypes
        });
        return OperationOutput.fromJSON({
          error: {
            message: `Invalid case type. Must be one of: ${validCaseTypes.join(', ')}`,
            type: Error_Type.InvalidRequest,
          },
          output: {
            values: [],
          } as OutputValue,
        });
      }

      console.debug('Generating document for case type:', input_data.case_type);
      // Generate formal document based on case type
      const formalDocument = this.generateFormalDocument(input_data.text, input_data.case_type);
      console.debug('Document generated successfully');

      return OperationOutput.fromJSON({
        error: undefined,
        output: {
          values: [{ "formal_document": formalDocument }],
        } as OutputValue,
      });
    } catch (error) {
      console.error('Error in generate_formal_document:', {
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
        input: {
          text: input_data.text?.substring(0, 100) + '...',  // Log first 100 chars for context
          case_type: input_data.case_type
        }
      });
      return OperationOutput.fromJSON({
        error: {
          message: `Failed to generate formal document: ${error}`,
          type: Error_Type.Unknown,
        },
        output: {
          values: [],
        } as OutputValue,
      });
    }
  }

  private generateFormalDocument(text: string, caseType: string): string {
    console.debug('Entering generateFormalDocument with case type:', caseType);
    const currentDate = new Date().toLocaleDateString();
    
    let result: string;
    try {
      switch (caseType) {
        case 'ca':
          result = this.generateContractAgreement(text, currentDate);
          break;
        case 'nda':
          result = this.generateNDA(text, currentDate);
          break;
        case 'sla':
          result = this.generateSLA(text, currentDate);
          break;
        case 'employment':
          result = this.generateEmploymentAgreement(text, currentDate);
          break;
        case 'letter':
          result = this.generateGeneralLetter(text, currentDate);
          break;
        default:
          throw new Error(`Unhandled case type: ${caseType}`);
      }
      console.debug('Document generated successfully for case type:', caseType);
      return result;
    } catch (error) {
      console.error('Error in template generation:', {
        caseType,
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;  // Re-throw to be handled by the main error handler
    }
  }

  private generateContractAgreement(text: string, date: string): string {
    return `
CONTRACT AGREEMENT

Date: ${date}

THIS AGREEMENT is made and entered into on the date specified above.

${text}

TERMS AND CONDITIONS:
1. The terms outlined in this agreement are legally binding.
2. Any modifications must be made in writing and agreed upon by all parties.
3. This agreement is governed by applicable state and federal laws.

IN WITNESS WHEREOF, the parties have executed this Contract Agreement.

________________________
Party A Signature

________________________
Party B Signature

________________________
Date
`;
  }

  private generateNDA(text: string, date: string): string {
    return `
NON-DISCLOSURE AGREEMENT

Effective Date: ${date}

CONFIDENTIALITY AGREEMENT

1. CONFIDENTIAL INFORMATION
The undersigned parties agree to maintain strict confidentiality regarding:

${text}

2. TERM
This agreement shall remain in effect for a period of [DURATION] from the effective date.

3. OBLIGATIONS
The recipient agrees to:
a) Maintain strict confidentiality
b) Not disclose to third parties
c) Use information only for authorized purposes

________________________
Disclosing Party

________________________
Receiving Party

________________________
Witness
`;
  }

  private generateSLA(text: string, date: string): string {
    return `
SERVICE LEVEL AGREEMENT

Date: ${date}

SERVICE DESCRIPTION AND PERFORMANCE SPECIFICATIONS

${text}

SERVICE LEVELS:
1. Availability: [specify]
2. Response Time: [specify]
3. Resolution Time: [specify]

MONITORING AND REPORTING:
- Service Provider will monitor performance
- Monthly reports will be provided
- Regular review meetings will be scheduled

________________________
Service Provider

________________________
Client

________________________
Date
`;
  }

  private generateEmploymentAgreement(text: string, date: string): string {
    return `
EMPLOYMENT AGREEMENT

Date: ${date}

TERMS OF EMPLOYMENT

${text}

GENERAL PROVISIONS:
1. Position and Duties
2. Compensation and Benefits
3. Term and Termination
4. Confidentiality
5. Non-Competition

This agreement represents the entire understanding between the parties.

________________________
Employer

________________________
Employee

________________________
Date
`;
  }

  private generateGeneralLetter(text: string, date: string): string {
    return `
FORMAL LETTER

Date: ${date}

${text}

Sincerely,

________________________
[NAME]

________________________
[TITLE]

________________________
[ORGANIZATION]
`;
  }
} 