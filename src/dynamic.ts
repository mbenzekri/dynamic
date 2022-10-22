import Ajv, { AnySchema } from "ajv/dist/2020"
import Ajvi18n from "ajv-i18n/localize/fr"

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

import { AnyJson, DynJson, TYPE, META, SchemaDefinition, JsonMap, isEmpty } from "./type"
import { DynValue, JsonCopy, walkSchema } from "./utils"


function compileSchemaType(schema: SchemaDefinition) {
    if (Array.isArray(schema.type)) {
        schema.main = schema.type.find(t => t != "null") ?? "string"
        schema.nullable = schema.type.some(t => t == "null")
    } else {
        schema.main = schema.type
        schema.nullable = schema.type == "null"
    }
}

export class Dynamic {
    readonly data: DynJson
    readonly userdata: any
    readonly options: AnyJson
    private readonly validateFunc: (json: any) => boolean
    constructor(schemaJson: AnyJson | string, dataJson: AnyJson | string, userdata: any = undefined, options: AnyJson | string = {}) {
        schemaJson = typeof schemaJson == "string" ? JSON.parse(schemaJson) : JsonCopy(schemaJson)
        dataJson = typeof dataJson == "string" ? JSON.parse(dataJson) : dataJson
        options = typeof options == "string" ? JSON.parse(options) : JsonCopy(options)
        this.userdata = userdata
        this.options = options
        const compiledSchema = this.compileSchema(schemaJson)
        if (!compiledSchema) throw Error(this.validateErrors("Invalid Schema")?.join("\n"))
        this.validateFunc = AJV.compile(schemaJson as AnySchema)
        this.data = DynValue(dataJson, compiledSchema)
    }

    compileSchema(schemaJson: AnyJson) {
        const valid = AJV.validateSchema(schemaJson as AnySchema)
        if (valid) {
            // on passe par une copy pour ne pas modifier l'original
            const schema: SchemaDefinition = schemaJson as unknown as SchemaDefinition
            walkSchema(schema, [
                compileSchemaType
            ])
            return schema
        }
        return
    }

    validateErrors(msg: string) {
        Ajvi18n(AJV.errors)
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

    validate(json?: AnyJson, schema?: SchemaDefinition) {
        return (json == null || schema == null) ? this.validateFunc(this.data) : AJV.validate(schema, json)
    }

    deepCopy(value = this.data): AnyJson {
        const schema = value[META].schema
        // a temporary value is allways returned as undefined
        if (schema?.temporary) return undefined
        const nullval = schema.nullable ? null : undefined
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


