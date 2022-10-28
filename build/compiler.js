import { DynFunc } from "./utils";
// first compilation step to initialise properties : root, parent, pointer, main, null allowed
export function compileSchemaInit(schema, parent, key) {
    var _a;
    schema.parent = parent;
    if (parent) {
        schema.root = parent.root;
        schema.pointer = `${parent === null || parent === void 0 ? void 0 : parent.pointer}/${key}`;
    }
    else {
        schema.root = schema;
        schema.pointer = "#";
    }
    if (Array.isArray(schema.type)) {
        schema.main = (_a = schema.type.find(t => t != "null")) !== null && _a !== void 0 ? _a : "string";
        schema.allowNull = schema.type.some(t => t == "null");
    }
    else {
        schema.main = schema.type;
        schema.allowNull = schema.type == "null";
    }
}
export function compileSchemaDefault(schema) {
    // init of root, parent, pointer, main, null allowed done by compileSchemaInit 
    schema.watchers = new Set();
    schema.isComposed = false;
    schema.isA = false;
    schema.isEnum = false;
    schema.isTemporary = false;
    schema.summary = "${ '- default summary -' }";
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