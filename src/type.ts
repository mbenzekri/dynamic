export type AnyJson = boolean | number | string | null | JsonArray | JsonMap | undefined;
export interface JsonMap { [key: string]: AnyJson; }
export interface JsonArray extends Array<AnyJson> { }

type SchemaPrimitive = "array" | "boolean" | "integer" | "null" | "number" | "object" | "string"

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
    pointer: string
    composed: boolean
    isA: boolean
    nullable: boolean
    temporary?: boolean
    main: SchemaPrimitive
    parent?: SchemaDefinition
    summary?: string
    isEnum: boolean
    refTo: string
    // added for compiled functions
    [name:symbol]: Function
}

export type DynKey = number | string
export type DynMetadata = {
    userdata:any
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
export type DynUndef = { [TYPE]: "undefined";[META]: DynMetadata }
export type DynNull = { [TYPE]: "null";[META]: DynMetadata }
export type DynString = String & { [TYPE]: "string";[META]: DynMetadata }
export type DynNumber = Number & { [TYPE]: "number";[META]: DynMetadata }
export type DynBoolean = Boolean & { [TYPE]: "boolean";[META]: DynMetadata }
export type DynArray = Array<DynJson> & { [TYPE]: "array";[META]: DynMetadata }
export type DynObject = { [key: string]: DynJson;[TYPE]: "object";[META]: DynMetadata }

type WalkDataAction = (data: DynJson, schema: SchemaDefinition, pdata?: DynJson, key?: DynKey) => void
export type WalkDataActions = WalkDataAction[]

type WalkSchemaAction = (schema: SchemaDefinition, parent?: SchemaDefinition, propname?: string) => void
export type WalkSchemaActions = WalkSchemaAction[]

export type DynContext = {
    value: DynJson
    root: DynJson
    schema: SchemaDefinition
    key?: DynKey
    userdata: any
}