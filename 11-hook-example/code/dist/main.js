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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const test_runner_1 = require("./test-runner/test-runner");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const argv = yield (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv)).options({
        fixturePath: {
            require: true,
            type: 'string',
        },
        functionName: {
            require: true,
            type: 'string',
        },
    }).argv;
    if (!argv.fixturePath || !argv.functionName) {
        console.error('Please make sure you have passed fixturePath & functionName');
    }
    yield (0, test_runner_1.testRunner)({
        fixturePath: argv.fixturePath,
        functionName: argv.functionName,
    });
}))();
