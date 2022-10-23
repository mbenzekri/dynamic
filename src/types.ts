export type AnyJson = boolean | number | string | null | JsonArray | JsonMap | undefined;
export interface JsonMap { [key: string]: AnyJson; }
export interface JsonArray extends Array<AnyJson> { }

export type JsPrimitive = "array" | "boolean"| "null" | "number" | "object" | "string" | "undefined"
export type SchemaPrimitive = "array" | "boolean" | "integer" | "null" | "number" | "object" | "string"

export function isPrimitive(value: string | DynJson) {
    return ["boolean", "integer", "null", "number", "string"].includes(typeof value == 'string' ? value : value[TYPE])
}

export function isComposed(value: string | DynJson) {
    return ["object", "array"].includes(typeof value == 'string' ? value : value[TYPE])
}

export function isEmpty(value: string | DynJson) {
    return ["null", "undefined"].includes(typeof value == 'string' ? value : value[TYPE])
}

export function emptyValue(schema: SchemaDefinition) {
    return schema.nullable ? null : undefined
}

type SchemaType = SchemaPrimitive | SchemaPrimitive[]
//type _SchemaFuncBoolean = (value: DynJson, parent: DynJson, schema: SchemaDefinition, root: DynJson, $V: (ptr: string) => any) => boolean

export type DynContext = DynMetadata & { value: any }
export type DerefFunc = (this: DynContext, string: string, kind: "value" | "summary" | "schema") => DynJson
export type ExprFunc = (this: DynContext) => any

interface DynFunc { eval(value: DynJson): any }

export type SchemaDefinition = {
    type: SchemaType
    $id?: string
    $schema?: string
    $ref?: string
    $comment?: string
    title?: string
    description?: string
    default?: any
    readOnly?: boolean
    writeOnly?: boolean
    examples?: any[]
    multipleOf?: number
    maximum?: number
    exclusiveMaximum?: number
    minimum?: number
    exclusiveMinimum?: number
    additionalItems?: SchemaDefinition,
    maxLength?: number
    minLength?: number
    pattern?: string
    items?: SchemaDefinition
    maxItems?: number
    minItems?: number
    uniqueItems?: boolean
    contains?: SchemaDefinition
    maxProperties?: number
    minProperties?: number
    required?: string[]
    additionalProperties?: SchemaDefinition | boolean
    definitions?: { [name: string]: SchemaDefinition }
    properties?: { [key: string]: SchemaDefinition };
    patternProperties?: string
    dependencies?: SchemaDefinition
    propertyNames?: string,
    const?: any,
    enum?: any[]
    format: string
    contentMediaType: string
    contentEncoding: string
    if?: SchemaDefinition,
    then?: SchemaDefinition,
    else?: SchemaDefinition,
    allOf?: SchemaDefinition[]
    anyOf?: SchemaDefinition[]
    oneOf?: SchemaDefinition[]
    not?: SchemaDefinition

    // added for Form behavior
    root: SchemaDefinition
    pointer: string
    parent?: SchemaDefinition
    watchers: Set<string>
    main: SchemaPrimitive
    composed: boolean
    nullable: boolean
    isA: boolean
    isEnum: boolean
    temporary?: boolean
    summary?: string
    reference?: string
    // added for compiled functions
    [name: symbol]: DynFunc
}

export type DynKey = number | string
export type DynMetadata = {
    shared: any
    pointer: string
    schema: SchemaDefinition
    root: DynJson
    parent?: DynJson
    key?: DynKey
}

export const META: unique symbol = Symbol()
export const TYPE: unique symbol = Symbol()
export const USER: unique symbol = Symbol()

export type DynJson = DynUndef | DynNull | DynString | DynNumber | DynBoolean | DynObject | DynArray
export type DynUndef = { [TYPE]: "undefined";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynNull = { [TYPE]: "null";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynString = String & { [TYPE]: "string";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynNumber = Number & { [TYPE]: "number";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynBoolean = Boolean & { [TYPE]: "boolean";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynArray = Array<DynJson> & { [TYPE]: "array";[META]: DynMetadata;[key: DynKey]: DynJson }
export type DynObject = { [TYPE]: "object";[META]: DynMetadata;[key: DynKey]: DynJson }

type WalkDataAction = (data: DynJson, schema: SchemaDefinition, pdata?: DynJson, key?: DynKey) => void
export type WalkDataActions = WalkDataAction[]

type WalkSchemaAction = (schema: SchemaDefinition, parent?: SchemaDefinition, propname?: string) => void
export type WalkSchemaActions = WalkSchemaAction[]
