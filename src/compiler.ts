
import {SchemaDefinition} from "./types"

export function compileSchemaType(schema: SchemaDefinition) {
    if (Array.isArray(schema.type)) {
        schema.main = schema.type.find(t => t != "null") ?? "string"
        schema.nullable = schema.type.some(t => t == "null")
    } else {
        schema.main = schema.type
        schema.nullable = schema.type == "null"
    }
}
