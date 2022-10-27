import Ajv, { AnySchema } from "ajv/dist/2020"

const AJV = new Ajv({ strictNumbers: false, strictSchema: false, coerceTypes: false, allErrors: true })
AJV.addFormat("color", /./)
AJV.addFormat("signature", /./)
AJV.addFormat("password", /./)
AJV.addFormat("doc", /./)
AJV.addFormat("uuid", /./)
AJV.addFormat("geo", /./)
AJV.addFormat("markdown", /./)
AJV.addFormat("asset", /./)
AJV.addFormat("date", /./)
AJV.addFormat("time", /./)
AJV.addFormat("date-time", /./)
AJV.addFormat("email", /./)
AJV.addFormat("uri-reference", /./)
AJV.addFormat("uri", /./)
AJV.addFormat("regex", /./)

import { AnyJson, DynJson, TYPE, META, SchemaDefinition, JsonMap, isEmpty } from "./types"
import { DynValue, JsonCopy, LOGGER, walkSchema } from "./utils"
import { compileDefinition, compileDynFunc, compileSchemaDefault, compileSchemaInit } from "./compiler"

export class Dynamic {
    readonly data: DynJson
    readonly schema: AnyJson
    readonly shared: any
    readonly options: AnyJson
    private validateFunc?: (json: any) => boolean
    constructor(schemaJson: AnyJson, dataJson: AnyJson, shared: any = undefined, options: AnyJson | string = {}) {
        this.schema = typeof schemaJson == "string" ? JSON.parse(schemaJson) : JsonCopy(schemaJson)
        this.shared = shared
        this.options = typeof options == "string" ? JSON.parse(options) : JsonCopy(options)
        const compiledSchema = this.compileSchema(schemaJson)
        if (!compiledSchema) throw Error(this.validateErrors("Invalid Schema")?.join("\n"))
        this.data = DynValue(dataJson, compiledSchema)
    }
    get logger() { return LOGGER }
    static logOn() {  LOGGER.isOn = true }
    static logOff() { LOGGER.isOn = false }
    compileSchema(schemaJson: AnyJson) {
        const valid = AJV.validateSchema(schemaJson as AnySchema)
        if (valid) {
            // on passe par une copy pour ne pas modifier l'original
            const schema: SchemaDefinition = schemaJson as unknown as SchemaDefinition
            walkSchema(schema, [
                compileDefinition(schema),
                compileSchemaInit,
                compileSchemaDefault,
                compileDynFunc<string>('summary',"string","")
            ])
            try {
                this.validateFunc = AJV.compile(schema as AnySchema)
            } catch(e) {}
            return schema
        }
        return
    }

    validateErrors(msg: string) {
        const errors = AJV.errors?.map(error => {
            const params = []
            for (const key in error.params) {
                params.push(`${key}=${JSON.stringify(error.params[key])}`)
            }
            return `Error "${error.message}" @ ${error.instancePath}  Params => ${params.join(' ')}`
        })
        errors?.unshift(msg)
        return errors
    }

    validate() {
        return !!this.validateFunc?.(this.data)
    }

    deepCopy(value = this.data): AnyJson {
        const schema = value[META].schema
        // a temporary value is allways returned as undefined
        if (schema?.isTemporary) return undefined
        const nullval = schema?.allowNull ? null : undefined
        switch (value[TYPE]) {
            case "undefined": return undefined
            case "null": return null
            case "number": return value.valueOf()
            case "boolean": return value.valueOf()
            case "string": return value.valueOf()
            case "object":
                return Object.values(value).every(v => isEmpty(v))
                 ? nullval : Object.entries(value).reduce(
                    (obj, [propname, propval]) => {
                        obj[propname] = this.deepCopy(propval); 
                        return obj
                    }, {} as JsonMap)
            case "array": return value.length > 0 ? value.map(v => this.deepCopy(v)) : nullval
        }
    }

    toJSON() {
        return this.deepCopy()
    }
}


