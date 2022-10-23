
import { SchemaDefinition, SchemaPrimitive } from "./types"
import { DynFunc } from "./utils"

export function compileSchemaType(schema: SchemaDefinition) {
    if (Array.isArray(schema.type)) {
        schema.main = schema.type.find(t => t != "null") ?? "string"
        schema.nullable = schema.type.some(t => t == "null")
    } else {
        schema.main = schema.type
        schema.nullable = schema.type == "null"
    }
}

export function compileSchemaDefault(schema: SchemaDefinition, parent?: SchemaDefinition, key?: string) {

    schema.pointer = parent == null ? "#" : `${parent?.pointer}/${key}`
    schema.composed = false
    schema.isA = false
    schema.isEnum = false
    schema.temporary = false
    schema.summary = undefined
    schema.reference = undefined
}

export function compileDynFunc<T>(property: string, type: SchemaPrimitive, defval:T) {
    return (schema: SchemaDefinition, _parent?: SchemaDefinition, _key?: string) => {
        if (typeof (schema as any)[property] === "function") return
        const expression = String((schema as any)[property])
        schema[Symbol(property)] = new DynFunc<T>(property, schema, expression, type,defval)
    }
}



