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
//# sourceMappingURL=compiler.js.map