import { DynJson, DynObject, DynKey, emptyValue, DynContext, isEmpty, ExprFunc, DerefFunc, SchemaPrimitive, isPrimitive } from "./types"
import { TYPE, META, AnyJson, SchemaDefinition, WalkDataActions, WalkSchemaActions } from "./types"

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
        const downsteps = pointer.split(/ *\/ */).filter(v => v != '').map(t => /^\d+$/.test(t) ? parseInt(t, 10) : t)
        const upsteps = typeof downsteps[0] == "number" ? downsteps[0] : -1
        const relative = upsteps >= 0
        const absolute = !relative
        downsteps.shift()
        const parent = downsteps.length > 0 ? pointer.replace(/[/][^/]*$/, "") : undefined
        const key = downsteps.length > 0 ? downsteps[downsteps.length - 1] : undefined
        return { pointer, absolute, relative, upsteps, downsteps, parent, key }
    }
    throw (`Incorrect pointer syntax "${pointer}" must be "#/prop1/prop2/..." or "<number>/prop1/prop2/..."`)
}

function pointerSchema(parent?: SchemaDefinition, propname?: string): string {
    return `${parent?.pointer ?? '#'}${propname ? `/${propname}` : ''}`
}

function pointerData(parent?: DynJson, key?: DynKey): string {
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
        let [type,result] = ["undefined",{} as DynJson]
        if (value === null) [type, result] = ["null", {} as DynJson]
        else if (typeof value == "string") [type, result] = ["string", new String(value) as DynJson]
        else if (typeof value == "number") [type, result] = ["number", new Number(value) as DynJson]
        else if (typeof value == "boolean") [type, result] = ["boolean", new Boolean(value) as DynJson]
        else if (Array.isArray(value)) [type, result] = ["array", value.map(item => DynCtor(item)) as DynJson]
        else if (value != null) [type, result] = ["object", Object.keys(value).reduce((obj, key) => { obj[key] = DynCtor(value[key]); return obj }, {} as DynJson)]
        Object.defineProperty(result, TYPE, { value: type })
        Object.defineProperty(result, META, { value: {} })
        return new Proxy(result,{
            get(target,key)  {
                //console.log(`Get on "${target[META].pointer}"`)   
                // FIX --- following fix error  calls to valueOf() over primitive (Number,String, Boolean)
                // TypeError: Number.prototype.valueOf requires that 'this' be a Number
                if (key === "valueOf" || key === Symbol.toPrimitive)  {
                    if (target[TYPE] == "null") return (hint:string) => hint == "string" ? "" : null
                    if (target[TYPE] == "undefined") return (hint:string) => hint == "string" ? "" : undefined
                    if (key === "valueOf") return () =>  (target as any)[key].call(target)
                }
                // FIX --- 
                return Reflect.get(target,key,target)
            },
            set(target,key,value)  {
                const dynjson = DynValue(value,target[META].schema,target[META].parent,target[META].key)
                //console.log(`Set on "${target[META].pointer}"`)   
                return Reflect.set(target,key,dynjson,target)
            }
        })
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

export function valueOf(pointer: string, root: DynJson, current: DynJson) {
    const sptr = splitPointer(pointer)
    let base: DynJson | undefined = sptr.relative ? current : root
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++) base = base?.[META].parent
        if (!base) throw Error(`enable to dereference pointer ${pointer} (no more parents)`)
    }
    for (const token of sptr.downsteps) {
        if (base == null) return
        if (base[TYPE] == "object") { base = base[token] }
        if (base[TYPE] == "array" && typeof token == "number") { base = base[token] }
    }
    return base
}

export function calculateSummary(schema: SchemaDefinition, value: DynJson, $f: DerefFunc): string {
    if (schema == null || isEmpty(value)) return '~'
    if (schema.summary) return schema[Symbol('summary')].eval(value)
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

export const deref: DerefFunc = function (this: DynContext, pointer: string, kind: string = "value"): any {
    const value = valueOf(pointer, this.root, this.value)
    if (value == null) return
    switch (kind) {
        case "value": return value
        case "summary": return calculateSummary(value[META].schema, value, deref.bind(this))
        case "schema": return value?.[META].schema
    }
}
export class DynFunc<T> {
    private func?: ExprFunc
    readonly prop: string
    readonly defaut: T
    readonly expr: string | string[]
    constructor(prop: string, schema: SchemaDefinition, expr: string | string[], type: SchemaPrimitive, defaut: T) {
        this.prop = prop
        this.expr = expr
        this.defaut = defaut
        this.compile(schema,type)
    }
    eval(value: DynJson): T {
        try {
            const context = Object.assign({} as DynContext, value[META])
            context.value = isPrimitive(value) ? value.valueOf() : value
            return this.func?.call(context)
        } catch (e: any) {
            console.error(`unable to eval property "${this.prop}" error is : \n\t => ${e.toString()}`)
            return this.defaut
        }
    }
    compile(schema: SchemaDefinition, type: SchemaPrimitive) {
        if (type == "string" && typeof this.expr == "string") {
            registerDependencies(schema, this.expr)
            try {
                const code = ` return nvl\`${this.expr}\`; `
                this.func = Function(code) as ExprFunc
            } catch (e) {
                this.func = () => ""
                console.error(`unable to compile ${this.prop} expression "${this.expr}" error is: \n\t => ${String(e)}`)
            }
        }
    }
}


export function registerDependencies(current: SchemaDefinition, expr: string): void {
    const POINTER_RE = /((#|\d+)(\/[^"']+)+)/g
    let matches
    while ((matches = POINTER_RE.exec(expr)) != null) {
        const pointer = matches[1]
        const dependant = schemaOf(pointer, current.root, current)
        dependant?.watchers.add(current.pointer)
    }
}
