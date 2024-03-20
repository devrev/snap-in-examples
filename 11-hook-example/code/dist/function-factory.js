"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.functionFactory = void 0;
const validate_input_1 = __importDefault(require("./functions/validate_input"));
exports.functionFactory = {
    // Add your functions here
    validate_input: validate_input_1.default,
};
