import { SchemaDefinition, SchemaPrimitive } from "./types"
import { DynFunc, JsonCopy } from "./utils"


// first compilation step to initialise properties : root, parent, pointer, main, null allowed
export function compileSchemaInit(schema: SchemaDefinition, parent?: SchemaDefinition, key?: string) {
    schema.parent = parent
    if (parent) {
        schema.root = parent.root
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
    schema.watchers ??= new Set<string>()
    schema.isComposed ??= false
    schema.isEnum ??= false
    schema.isA ??= false
    schema.isTemporary ??= false
    schema.summary ??= "${ '- default summary -' }"
    schema.set ??= undefined
    schema.hidden ??= "false"
    schema.readonly ??= "false"
    schema.mandatory ??= "false"
    schema.open ??= undefined
    schema.select ??= "true"
    schema.sort ??= undefined
    schema.onChange = undefined
    schema.onBegin ??= undefined
    schema.onEnd ??= undefined
    schema.reference ??= undefined

}

export function compileDynFunc<T>(property: string, type: SchemaPrimitive | null, defval: T) {
    return (schema: SchemaDefinition, _parent?: SchemaDefinition, _key?: string) => {
        if (typeof (schema as any)[property] === "function") return
        const expression = String((schema as any)[property])
        schema[Symbol(property)] = new DynFunc<T>(property, schema, expression, type, defval)
    }
}

/** copy $ref by the appropriate copied definition */
export const compileDefinition = (rootSchema: SchemaDefinition) => {
    const definitionOf = definitionDeref(rootSchema)
    return (schema: SchemaDefinition) => {
        if (schema.$ref) return definitionOf(schema)
    }
}

function definitionDeref(rootSchema: SchemaDefinition): (schemaRef: SchemaDefinition) => void {
    const definitions = rootSchema.definitions
    return function (schemaRef: SchemaDefinition): void {
        debugger
        if (!schemaRef.$ref) return
        if (! /#\/definitions\/[^/]+$/.test(schemaRef.$ref ?? ""))
            throw Error(`$ref must have pattern '#/definitions/<name>' is "${schemaRef.$ref}"`)
        if (!definitions)
            throw Error(`No definitions in root schema`)
        const name = schemaRef.$ref?.split("/")[2];
        if (!name! || !definitions[name])
            throw Error(`No definition "${schemaRef.$ref}" found in root schema`)
        const definition = JsonCopy(definitions[name])
        for (const [name, value] of Object.entries(definition)) {
            if (!(name in schemaRef)) (schemaRef as any)[name] = value
        }
    }
}
