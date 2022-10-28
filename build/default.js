import { emptyValue, isEmpty, META, SFUNC, TYPE } from "./types";
import { DynValue } from "./utils";
export function calculateDefault(schema, parent, key) {
    switch (true) {
        case schema.const !== null:
            return schema.const;
        case schema.default != null:
            return DynValue(schema.default, schema, parent, key);
        case schema.main === 'object': {
            const dynobj = DynValue({}, schema, parent, key);
            schema.properties && Object.entries(schema.properties).forEach(([pname, pschema]) => {
                dynobj[pname] = calculateDefault(pschema, dynobj, pname);
            });
            return dynobj;
        }
        case schema.main === 'array':
            return DynValue([], schema, parent, key);
        default:
    }
    return DynValue(emptyValue(schema), schema, parent, key);
}
export function calculateSummary(schema, value, $f) {
    var _a, _b, _c, _d, _e;
    if (schema == null || isEmpty(value))
        return '~';
    if (schema.summary)
        return schema[SFUNC.summary].eval(value);
    if (schema.isEnum && schema.oneOf)
        return String((_b = (_a = schema.oneOf.find((item) => item.const === value)) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : value);
    if (schema.isEnum && schema.anyOf)
        return String((_d = (_c = schema.anyOf.find((item) => item.const === value)) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : value);
    if (schema.reference) {
        const refenum = schema[Symbol('reference')].eval(value);
        if (refenum && refenum.refname && Array.isArray(refenum.refarray)) {
            const refname = (_e = refenum === null || refenum === void 0 ? void 0 : refenum.refname) !== null && _e !== void 0 ? _e : 'id';
            const refarray = refenum === null || refenum === void 0 ? void 0 : refenum.refarray;
            const index = refarray === null || refarray === void 0 ? void 0 : refarray.findIndex((item) => item[refname] === value);
            if (index >= 0) {
                const schema = refarray[index][META].schema;
                return schema === null || schema === void 0 ? void 0 : schema.summary(schema, refarray[index], refarray, index, $f);
            }
            return String(value);
        }
        return String(value);
    }
    if (value[TYPE] == "array") {
        return value
            .map((item) => item && schema.items ? calculateSummary(schema.items, item, $f) : item)
            .filter((v) => v)
            .join(',');
    }
    if (value[TYPE] == "object") {
        return schema.properties ? Object.keys(schema.properties)
            .filter((property) => !(value[property] == null))
            .map((property) => schema.properties ? calculateSummary(schema.properties[property], value[property], $f) : value[property])
            .join(',') : "";
    }
    return String(value);
}
//# sourceMappingURL=default.js.map