import { calculateSummary } from "./default";
import { DynJson, DynKey, DynContext, ExprFunc, DerefFunc, SchemaPrimitive, isPrimitive } from "./types"
import { TYPE, META, AnyJson, SchemaDefinition, WalkDataActions, WalkSchemaActions } from "./types"

export const LOGGER = new class {
    isOn = true
    log(m: any, ...o: any[]): void { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined }
    warn(m: any, ...o: any[]): void { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined }
    error(m: any, ...o: any[]): void { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined }
    debug(m: any, ...o: any[]): void { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined }
}

export function JsonCopy<T extends SchemaDefinition | AnyJson>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}
const GLOBAL = (globalThis as any)

/** tag template to replace nullish values by empty string  */
GLOBAL.nvl = function (strarr: string[], ...valarr: any[]) {
    const all: any[] = []
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str))
    return all.join('')
}

/** tag template to resolve pointer access to value */
GLOBAL.V = function (strarr: string[], ...valarr: any[]) {
    const all: any[] = []
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str))
    return all.join('')
}

/** tag template to resolve pointer access to abstract */
GLOBAL.A = function (strarr: string[], ...valarr: any[]) {
    const all: any[] = []
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str))
    return all.join('')
}

/** tag template to resolve pointer access to schema */
GLOBAL.S = function (strarr: string[], ...valarr: any[]) {
    const all: any[] = []
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str))
    return all.join('')
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
            LOGGER.error([
                `Error while compiling schema ${String(e)}`,
                `action: ${action.name}`,
                `schema: ${pointerSchema(parent, propname)}`
            ].join("\n"))
        }
    })
    Object.entries(schema.properties ?? [])
        .forEach(([name, child]) => walkSchema(child, actions, schema, name))

    schema.items && walkSchema(schema.items, actions, schema, '*');
    [schema.oneOf, schema.anyOf, schema.allOf].forEach(
        schemas => schemas?.forEach((child) => walkSchema(child, actions, parent, propname))
    )
}

export const walkDynJson = (djs: DynJson, dsch: SchemaDefinition, actions: WalkDataActions, pdjs?: DynJson, key?: DynKey) => {
    for (const action of actions) {
        try {
            action(djs, dsch, pdjs, key)
        } catch (e) {
            LOGGER.error(`Error while compiling data ${String(e)}\naction: ${action.name}\n at: ${pointerData(pdjs, key)}`)
        }
    }

    if (djs[TYPE] == "array") {
        if (dsch.isComposed) {
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
        let [type, result] = ["undefined", {} as DynJson]
        if (value === null) [type, result] = ["null", {} as DynJson]
        else if (typeof value == "string") [type, result] = ["string", new String(value) as DynJson]
        else if (typeof value == "number") [type, result] = ["number", new Number(value) as DynJson]
        else if (typeof value == "boolean") [type, result] = ["boolean", new Boolean(value) as DynJson]
        else if (Array.isArray(value)) [type, result] = ["array", value.map(item => DynCtor(item)) as DynJson]
        else if (value != null) [type, result] = ["object", Object.keys(value).reduce((obj, key) => { obj[key] = DynCtor(value[key]); return obj }, {} as DynJson)]
        Object.defineProperty(result, TYPE, { value: type })
        Object.defineProperty(result, META, { value: {} })
        return new Proxy(result, {
            get(target, key) {
                //LOGGER.log(`Get on "${target[META].pointer}"`)   
                // FIX --- following fix error  calls to valueOf() over primitive (Number,String, Boolean)
                // TypeError: Number.prototype.valueOf requires that 'this' be a Number
                if (key === "valueOf" || key === "toString" || key === Symbol.toPrimitive) {
                    if (target[TYPE] == "null") return (hint: string) => hint == "string" ? "" : null
                    if (target[TYPE] == "undefined") return (hint: string) => hint == "string" ? "" : undefined
                    if (key === "valueOf" || key === "toString") return () => (target as any)[key].call(target)
                }
                // FIX --- 
                return Reflect.get(target, key, target)
            },
            set(target, key, value) {
                const dynjson = DynValue(value, target[META].schema, target[META].parent, target[META].key)
                //LOGGER.log(`Set on "${target[META].pointer}"`)   
                return Reflect.set(target, key, dynjson, target)
            }
        })
    }
    const dynjson = DynCtor(value)
    walkDynJson(dynjson, schema, [
        setMeta     // recursive initialisation of "META" property
    ], parent, key)
    return dynjson
}

export function schemaOf(pointer: string, root: SchemaDefinition, current: SchemaDefinition) {
    const sptr = splitPointer(pointer)
    let base: SchemaDefinition | undefined = sptr.relative ? current : root
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++) base = base?.parent
        if (!base) {
            LOGGER.error(`in context ${current.pointer} enable to dereference pointer ${pointer} (not enough ascendant')`)
            return
        }
    }
    for (const token of sptr.downsteps) {
        const prev = base
        base = (token === '*') ? base.items : base.properties?.[token]
        if (!base) {
            LOGGER.error(`in context ${current.pointer} enable to dereference pointer ${pointer}(property '${token}' not found in ${prev.pointer})`)
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
    readonly prop: string
    readonly expr: string | string[]
    private readonly defaultValue: any
    private func?: ExprFunc
    constructor(prop: string, schema: SchemaDefinition, expr: string | string[], type: SchemaPrimitive | null, defaultValue: T) {
        this.prop = prop
        this.expr = expr
        this.defaultValue = defaultValue
        this.compile(schema, type, defaultValue)
    }
    eval(value: DynJson): T {
        const context = Object.assign({} as DynContext, value[META])
        context.value = isPrimitive(value) ? value.valueOf() : value
        try { return this.func?.call(context) }
        catch (e) { return this.defaultValue }
    }
    compile(schema: SchemaDefinition, type: SchemaPrimitive | null, defval: T) {
        // expr is empty then default function
        if (this.expr == null || typeof this.expr != "string") return
        this.func = () => defval
        registerDependencies(schema, this.expr)
        try {
            switch (type) {
                case "string":
                    this.func = Function(` return nvl\`${this.expr}\`; `) as ExprFunc
                    break;
                case "number":
                case "integer":
                    this.func = Function(` return Number(${this.expr}); `) as ExprFunc
                    break;
                case "boolean":
                    this.func = Function(` return Boolean(${this.expr}); `) as ExprFunc
                    break;
                default:
                    this.func = Function(` return (${this.expr}); `) as ExprFunc
                    break;
            }
        } catch (e) {
            LOGGER.log([
                `Unable to compile ${this.prop} expression "${this.expr}"  \n`,
                `error is: ${String(e)}`,
                `Falling out to default value`
            ].join('\n'))
        }
    }
}


export function registerDependencies(current: SchemaDefinition, expr: string): void {
    const POINTER_RE = /[V|A|S]`(#|\d+)([/][^/])*`/g
    let matches
    while ((matches = POINTER_RE.exec(expr)) != null) {
        const pointer = matches[1]
        const dependant = schemaOf(pointer, current.root, current)
        dependant?.watchers.add(current.pointer)
    }
}
