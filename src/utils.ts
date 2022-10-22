import { DynJson, DynUndef, DynNull, DynNumber, DynBoolean, DynString, DynObject, DynArray, DynKey, emptyValue, DynContext, isEmpty } from "./type"
import { TYPE, META, AnyJson, SchemaDefinition, WalkDataActions, WalkSchemaActions } from "./type"

export function JsonType(value: AnyJson) {
    if (typeof value == "number") return "number"
    if (typeof value == "string") return "string"
    if (typeof value == "boolean") return "boolean"
    if (Array.isArray(value)) return "array"
    if (value != null) return "object"
    if (value === null) return "null"
    return "undefined"
}

export function JsonCopy(value: AnyJson): AnyJson {
    return JSON.parse(JSON.stringify(value))
}

function splitPointer(pointer: string) {
    const pointerRe = /^(\d+|#)([\/][^\/])*$/
    if (pointerRe.test(pointer)) {
       const downsteps = pointer.split(/ *\/ */).filter(v => v != '').map(t => /^\d+$/.test(t) ? parseInt(t,10) : t)
       const upsteps = typeof downsteps[0] == "number" ? downsteps[0] : -1
       const relative = upsteps >= 0
       const absolute = !relative
       downsteps.shift()
       const parent = downsteps.length > 0 ? pointer.replace(/[/][^/]*$/, "") : undefined
       const key = downsteps.length > 0 ? downsteps[downsteps.length - 1] : undefined
       return {pointer, absolute, relative, upsteps, downsteps, parent, key}
    }
    throw(`Incorrect pointer syntax "${pointer}" must be "#/prop1/prop2/..." or "<number>/prop1/prop2/..."`)
}

export function pointerSchema(parent?: SchemaDefinition, propname?: string): string {
    return `${parent?.pointer ?? '#'}${propname ? `/${propname}` : ''}`
}

export function pointerData(parent?: DynJson, key?: DynKey): string {
    return `${parent?.[META].pointer ?? '#'}${key != null ? `/${key}` : ''}`
}

export function walkSchema(schema: SchemaDefinition, actions: WalkSchemaActions, parent?: SchemaDefinition, propname?: string): void {
    actions.forEach(action => {
        try {
            action(schema, parent, propname)
        } catch (e) {
            console.error([
                `Error while compiling schema ${String(e)}`,
                `action: ${action.name}`,
                `schema: ${pointerSchema(parent, propname)}`
            ].join("\n"))
        }
    })
    if (schema.properties) {
        return Object.entries(schema.properties)
            .forEach(([name, child]) => walkSchema(child, actions, schema, name))
    }
    if (schema.items) {
        if (schema.items.oneOf) return walkSchema(schema.items, actions, schema, '*')
        if (schema.items.allOf) return walkSchema(schema.items, actions, schema, '*')
        if (schema.items.anyOf) return walkSchema(schema.items, actions, schema, '*')
        return walkSchema(schema.items, actions, schema, '*')
    }
    if (schema.oneOf) return schema.oneOf.forEach((child) => walkSchema(child, actions, parent, propname))
    if (schema.allOf) return schema.allOf.forEach((child) => walkSchema(child, actions, parent, propname))
    if (schema.anyOf) return schema.anyOf.forEach((child) => walkSchema(child, actions, parent, propname))
}

export const walkDynJson = (djs: DynJson, dsch: SchemaDefinition, actions: WalkDataActions, pdjs?: DynJson, key?: DynKey) => {
    for (const action of actions) {
        try {
            action(djs, dsch, pdjs, key)
        } catch (e) {
            console.error(`Error while compiling data ${String(e)}\naction: ${action.name}\n at: ${pointerData(pdjs, key)}`)
        }
    }

    if (djs[TYPE] == "array") {
        if (dsch.composed) {
            djs.forEach((item, index) => {
                const composition = dsch.items?.oneOf ?? dsch.items?.anyOf ?? dsch.items?.allOf ?? []
                composition.forEach((schema: any) => {
                    if (schema.isInstance && schema.isInstance(null, item, djs, index, () => null))
                        walkDynJson(item, schema, actions, djs, index)
                })
            })
        } else {
            djs.forEach((item, index) => dsch.items && walkDynJson(item, dsch.items, actions, djs, index))
        }
    }
    if (djs[TYPE] == "object") {
        Object.entries(djs).forEach(([propname, propval]: [string, DynJson]) => {
            const propschema = dsch.properties?.[propname]
            if (propschema) walkDynJson(propval, propschema, actions, djs, propname)
        })
    }
}

/**
 * initialise metadata infos (pointer, schema, ...)  for dynJson object 
 */
function setMeta(data: DynJson, schema: SchemaDefinition, parent?: DynJson, key?: DynKey) {
    if (parent != null && key != null) {
        data[META].pointer = `${parent[META].pointer}/${key}`
        data[META].schema = schema
        data[META].root = parent[META].root
        data[META].parent = parent
        data[META].key = key
    } else {
        data[META].pointer = "#"
        data[META].schema = schema
        data[META].root = data
    }
    return data
}

export function DynValue(value: AnyJson, schema: SchemaDefinition, parent?: DynJson, key?: DynKey) {
    function DynCtor(value: AnyJson): DynJson {
        let type = "undefined"
        let result: DynJson = {} as DynUndef
        if (value === null) [type, result] = ["null", ({} as DynNull)]
        else if (typeof value == "string") [type, result] = ["string", new String(value) as DynString]
        else if (typeof value == "number") [type, result] = ["number", new Number(value) as DynNumber]
        else if (typeof value == "boolean") [type, result] = ["boolean", new Boolean(value) as DynBoolean]
        else if (Array.isArray(value)) [type, result] = ["array", value.map(item => DynCtor(item)) as DynArray]
        else if (value != null) [type, result] = ["object", Object.keys(value).reduce((obj, key) => { obj[key] = DynCtor(value[key]); return obj }, {} as DynObject)]
        Object.defineProperty(result, TYPE, { value: type })
        Object.defineProperty(result, META, { value: {} })
        return result
    }
    const dynjson = DynCtor(value)
    walkDynJson(dynjson, schema, [
        setMeta     // recursive initialisation of "META" property
    ], parent, key)
    return dynjson
}

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
                        dynobj[pname] = calculateDefault(pschema,dynobj,pname)
                })
            return dynobj
        }
        case schema.main === 'array':
            return DynValue([], schema, parent, key)
        default:
    }
    return DynValue(emptyValue(schema), schema, parent, key)
}

export function schemaOf(pointer: string, root: SchemaDefinition, current: SchemaDefinition) {
    const sptr = splitPointer(pointer)
    let base: SchemaDefinition | undefined = sptr.relative ? current : root
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++) base = base?.parent
        if (!base) {
            console.error(`in context ${current.pointer} enable to dereference pointer ${pointer} (not enough ascendant')`)
            return 
        }
    }
    for (const token of sptr.downsteps) {
        const prev = base
        base = (token === '*') ? base.items : base.properties?.[token]
        if (!base) {
            console.error(`in context ${current.pointer} enable to dereference pointer ${pointer}(property '${token}' not found in ${prev.pointer})`)
            return 
        }
    }
    return base
}

export function valueOf( pointer: string,root: DynJson, current: DynJson) {
    const sptr = splitPointer(pointer)
    let base: DynJson | undefined = sptr.relative ? current : root
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++) base = base?.[META].parent
        if (!base) throw Error(`enable to dereference pointer ${pointer} (no more parents)`)
    }
    for (const token of sptr.downsteps) {
        if (base == null) return
        if(base[TYPE] == "object") { base = base[token] }
        if(base[TYPE] == "array" && typeof token == "number") { base = base[token] }
    }
    return base
}

export function calculateSummary(schema: SchemaDefinition, value: DynJson, $f: (p: string, a: number) => any): string {
    if (schema == null || isEmpty(value)) return '~'
    if (schema.summary) return schema[Symbol('summary')](schema, value, $f)
    if (schema.isEnum && schema.oneOf ) return String(schema.oneOf.find((item: any) => item.const === value)?.title ?? value)
    if (schema.isEnum && schema.anyOf) return String(schema.anyOf.find((item: any) => item.const === value)?.title ?? value)
    if (schema.refTo) {
        const refenum = schema[Symbol('refTo')](schema, value, $f)
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

enum ResolveType {
    value = 0,
    summary,
    schema
}

function deref(ctx: DynContext) {
    return (pointer: string, resolveType?: ResolveType): any => {
        pointer = typeof pointer == "string" ? pointer : "#"
        resolveType = Number.isInteger(ResolveType.value) ? resolveType : 0
        const value = valueOf( pointer, ctx.root, ctx.value)
        if (value == null) return
        switch(resolveType) {
            case ResolveType.value: return value
            case ResolveType.summary: return calculateSummary(value[META].schema, value,deref(ctx))
            case ResolveType.schema:  return value?.[META].schema
        }
    }
}


export function evalExpr(attribute: string, value: DynJson, userdata: any) {
    const schema = value[META].schema
    const func = schema[Symbol(attribute)]
    const root =  value[META].root
    const key =  value[META].key
    const ctx: DynContext = {value,root,schema,key,userdata}
    if (typeof func != "function") return
    return func(schema, value, parent, key, deref(ctx), userdata)
}
