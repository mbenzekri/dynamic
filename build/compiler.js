import { DynFunc } from "./utils";
export function compileSchemaType(schema) {
    var _a;
    if (Array.isArray(schema.type)) {
        schema.main = (_a = schema.type.find(t => t != "null")) !== null && _a !== void 0 ? _a : "string";
        schema.nullable = schema.type.some(t => t == "null");
    }
    else {
        schema.main = schema.type;
        schema.nullable = schema.type == "null";
    }
}
export function compileSchemaDefault(schema, parent, key) {
    schema.pointer = parent == null ? "#" : `${parent === null || parent === void 0 ? void 0 : parent.pointer}/${key}`;
    schema.composed = false;
    schema.isA = false;
    schema.isEnum = false;
    schema.temporary = false;
    schema.summary = undefined;
    schema.reference = undefined;
}
export function compileDynFunc(property, type, defval) {
    return (schema, _parent, _key) => {
        if (typeof schema[property] === "function")
            return;
        const expression = String(schema[property]);
        schema[Symbol(property)] = new DynFunc(property, schema, expression, type, defval);
    };
}
//# sourceMappingURL=compiler.js.map