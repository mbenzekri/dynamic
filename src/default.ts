import { DerefFunc, DynJson, DynKey, DynObject, emptyValue, isEmpty, META, SchemaDefinition, SFUNC, TYPE } from "./types"
import { DynValue } from "./utils"

export function calculateDefault(schema: SchemaDefinition, parent: DynJson, key: DynKey): DynJson {
    switch (true) {
        case schema.const !== null:
            return schema.const
        case schema.default != null:
            return DynValue(schema.default, schema, parent, key)
        case schema.main === 'object': {
            const dynobj = DynValue({}, schema, parent, key) as DynObject
            schema.properties && Object.entries(schema.properties).forEach(
                ([pname, pschema]) => {
                    dynobj[pname] = calculateDefault(pschema, dynobj, pname)
                })
            return dynobj
        }
        case schema.main === 'array':
            return DynValue([], schema, parent, key)
        default:
    }
    return DynValue(emptyValue(schema), schema, parent, key)
}

export function calculateSummary(schema: SchemaDefinition, value: DynJson, $f: DerefFunc): string {
    if (schema == null || isEmpty(value)) return '~'
    if (schema.summary) return schema[SFUNC.summary].eval(value)
    if (schema.isEnum && schema.oneOf) return String(schema.oneOf.find((item: any) => item.const === value)?.title ?? value)
    if (schema.isEnum && schema.anyOf) return String(schema.anyOf.find((item: any) => item.const === value)?.title ?? value)
    if (schema.reference) {
        const refenum = schema[Symbol('reference')].eval(value)
        if (refenum && refenum.refname && Array.isArray(refenum.refarray)) {
            const refname = refenum?.refname ?? 'id'
            const refarray = refenum?.refarray
            const index = refarray?.findIndex((item: any) => item[refname] === value)
            if (index >= 0) {
                const schema = refarray[index][META].schema
                return schema?.summary(schema, refarray[index], refarray, index, $f)
            }
            return String(value)
        }
        return String(value)
    }
    if (value[TYPE] == "array") {
        return (value as Array<any>)
            .map((item: any) => item && schema.items ? calculateSummary(schema.items, item, $f) : item)
            .filter((v: any) => v)
            .join(',')
    }
    if (value[TYPE] == "object") {
        return schema.properties ? Object.keys(schema.properties)
            .filter((property: string) => !(value[property] == null))
            .map((property: string) => schema.properties ? calculateSummary(schema.properties[property], value[property], $f) : value[property])
            .join(',') : ""
    }
    return String(value)
}
