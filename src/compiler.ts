
import { SchemaDefinition, SchemaPrimitive } from "./types"
import { DynFunc } from "./utils"


// first compilation step to initialise properties : root, parent, pointer, main, null allowed
export function compileSchemaInit(schema: SchemaDefinition, parent?: SchemaDefinition, key?: string) {
    schema.parent = parent
    if (parent) {
        schema.root =  parent.root
        schema.pointer = `${parent?.pointer}/${key}`
    } else {
        schema.root = schema
        schema.pointer = "#"
    }
    if (Array.isArray(schema.type)) {
        schema.main = schema.type.find(t => t != "null") ?? "string"
        schema.allowNull = schema.type.some(t => t == "null")
    } else {
        schema.main = schema.type
        schema.allowNull = schema.type == "null"
    }
}

export function compileSchemaDefault(schema: SchemaDefinition) {

    // init of root, parent, pointer, main, null allowed done by compileSchemaInit 
    schema.watchers = new Set<string>()
    schema.isComposed = false
    schema.isA = false
    schema.isEnum = false
    schema.isTemporary = false
    schema.summary = "${ '' }"
    schema.reference = undefined
}

export function compileDynFunc<T>(property: string, type: SchemaPrimitive, defval:T) {
    return (schema: SchemaDefinition, _parent?: SchemaDefinition, _key?: string) => {
        if (typeof (schema as any)[property] === "function") return
        const expression = String((schema as any)[property])
        schema[Symbol(property)] = new DynFunc<T>(property, schema, expression, type,defval)
    }
}



