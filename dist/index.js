"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const settee_1 = require("./settee");
const schema_1 = require("./entities/schema");
exports.Schema = schema_1.default;
const type_1 = require("./entities/type");
exports.Type = type_1.default;
const settee = new settee_1.default();
exports.settee = settee;
__export(require("./errors"));
