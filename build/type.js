export function isPrimitive(value) {
    return ["boolean", "integer", "null", "number", "string"].includes(typeof value == 'string' ? value : value[TYPE]);
}
export function isComposed(value) {
    return ["object", "array"].includes(typeof value == 'string' ? value : value[TYPE]);
}
export function isEmpty(value) {
    return ["null", "undefined"].includes(typeof value == 'string' ? value : value[TYPE]);
}
export function emptyValue(schema) {
    return schema.nullable ? null : undefined;
}
export const META = Symbol();
export const TYPE = Symbol();
export const USER = Symbol();
//# sourceMappingURL=type.js.map