import { DynFunc, JsonCopy } from "./utils";
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
    schema.summary = "${ '' }";
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
/** copy $ref by the appropriate copied definition */
export const compileDefinition = (rootSchema) => {
    const definitionOf = definitionDeref(rootSchema);
    return (schema) => {
        if (schema.$ref)
            return definitionOf(schema);
    };
};
function definitionDeref(rootSchema) {
    const definitions = rootSchema.definitions;
    return function (schemaRef) {
        var _a, _b;
        debugger;
        if (!schemaRef.$ref)
            return;
        if (!/#\/definitions\/[^/]+$/.test((_a = schemaRef.$ref) !== null && _a !== void 0 ? _a : ""))
            throw Error(`$ref must have pattern '#/definitions/<name>' is "${schemaRef.$ref}"`);
        if (!definitions)
            throw Error(`No definitions in root schema`);
        const name = (_b = schemaRef.$ref) === null || _b === void 0 ? void 0 : _b.split("/")[2];
        if (!name || !definitions[name])
            throw Error(`No definition "${schemaRef.$ref}" found in root schema`);
        const definition = JsonCopy(definitions[name]);
        for (const [name, value] of Object.entries(definition)) {
            if (!(name in schemaRef))
                schemaRef[name] = value;
        }
    };
}
//# sourceMappingURL=compiler.js.map