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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    // init of root, parent, pointer, main, null allowed done by compileSchemaInit 
    (_a = schema.watchers) !== null && _a !== void 0 ? _a : (schema.watchers = new Set());
    (_b = schema.isComposed) !== null && _b !== void 0 ? _b : (schema.isComposed = false);
    (_c = schema.isEnum) !== null && _c !== void 0 ? _c : (schema.isEnum = false);
    (_d = schema.isA) !== null && _d !== void 0 ? _d : (schema.isA = false);
    (_e = schema.isTemporary) !== null && _e !== void 0 ? _e : (schema.isTemporary = false);
    (_f = schema.summary) !== null && _f !== void 0 ? _f : (schema.summary = "${ '- default summary -' }");
    (_g = schema.set) !== null && _g !== void 0 ? _g : (schema.set = undefined);
    (_h = schema.hidden) !== null && _h !== void 0 ? _h : (schema.hidden = "false");
    (_j = schema.readonly) !== null && _j !== void 0 ? _j : (schema.readonly = "false");
    (_k = schema.mandatory) !== null && _k !== void 0 ? _k : (schema.mandatory = "false");
    (_l = schema.open) !== null && _l !== void 0 ? _l : (schema.open = undefined);
    (_m = schema.select) !== null && _m !== void 0 ? _m : (schema.select = "true");
    (_o = schema.sort) !== null && _o !== void 0 ? _o : (schema.sort = undefined);
    schema.onChange = undefined;
    (_p = schema.onBegin) !== null && _p !== void 0 ? _p : (schema.onBegin = undefined);
    (_q = schema.onEnd) !== null && _q !== void 0 ? _q : (schema.onEnd = undefined);
    (_r = schema.reference) !== null && _r !== void 0 ? _r : (schema.reference = undefined);
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