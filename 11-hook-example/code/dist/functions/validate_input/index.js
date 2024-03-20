"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const typescript_sdk_1 = require("@devrev/typescript-sdk");
// Validating the input by fetching the account details.
function handleEvent(event) {
    return __awaiter(this, void 0, void 0, function* () {
        // Extract necessary information from the event
        const token = event.context.secrets['service_account_token'];
        const endpoint = event.execution_metadata.devrev_endpoint;
        // Set up the DevRev SDK with the extracted information
        const devrevSDK = typescript_sdk_1.client.setupBeta({
            endpoint: endpoint,
            token: token,
        });
        // Extract the part ID and commits from the event
        const accountId = event.input_data.global_values['account_id'];
        const initialStage = event.input_data.global_values['initial_stage'];
        const finalStage = event.input_data.global_values['final_stage'];
        // Check the intitial and final stages are not equal
        if (initialStage === finalStage) {
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw 'Initial and final stages cannot be the same.';
        }
        try {
            // Create a timeline comment using the DevRev SDK
            const response = yield devrevSDK.accountsGet({
                id: accountId,
            });
            console.log(JSON.stringify(response.data));
            // Return the response from the DevRev API
            return response;
        }
        catch (error) {
            console.error(error);
            // Handle the error here
            // eslint-disable-next-line @typescript-eslint/no-throw-literal
            throw 'Failed to fetch account details';
        }
    });
}
const run = (events) => __awaiter(void 0, void 0, void 0, function* () {
    for (const event of events) {
        yield handleEvent(event);
    }
});
exports.run = run;
exports.default = exports.run;
