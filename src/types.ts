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
    return schema.allowNull ? null : undefined
}

type SchemaType = SchemaPrimitive | SchemaPrimitive[]
//type _SchemaFuncBoolean = (value: DynJson, parent: DynJson, schema: SchemaDefinition, root: DynJson, $V: (ptr: string) => any) => boolean

export type DynContext = DynMetadata & { value: any }
export type DerefFunc = (this: DynContext, string: string, kind: "value" | "summary" | "schema") => DynJson
export type ExprFunc = (this: DynContext) => any

interface DynFunc<T> { eval(value: DynJson): T }

export const SFUNC = {
    isA : Symbol('isA'),
    isTemporary : Symbol('isTemporary'),
    summary : Symbol('summary'),
    reference : Symbol('reference'),
}

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
    /** root schema (uppermost ascendant) if this schema */ 
    root: SchemaDefinition
    /** absolute pointer of this schema */ 
    pointer: string
    /** parent of this schema */ 
    parent?: SchemaDefinition
    /** main type of this schema */ 
    main: SchemaPrimitive
    /** true if null is an authorized value */ 
    allowNull: boolean
    /** set of pointers of schema dependant/watching to this schema */ 
    watchers: Set<string>
    /**  internal boolean expression : true if schema if a composition oneOf, anyOf, allOf  */ 
    isComposed: boolean
    /** internal boolean expression : true if schema if an enumeration through "enum" property or by "consts" composition */ 
    isEnum: boolean 
    /** boolean expression : when evaluates to true mean the value is instance of this schema */ 
    isA: boolean | string            
    /** true if value is living only during form processing temporary (never returned) */ 
    isTemporary: boolean
    /** string expression:  evaluated to be shown as a summary for this current schema value*/ 
    summary: string
    /** any expression : calculted and assigned to this current schema value */
    set?: string,
    /** boolean expression : when evaluates to true the value must be hidden */
    hidden: string,
    /** boolean expression : when evaluated to true value is readonly else not (updatable)  */
    readonly: string,
    /** boolean expression : when evaluated to true value is mandatory else not */
    mandatory: string,
    /** boolean expression : when evaluated to true value pannel must uncollapsed else collapsed */
    open?: string,
    /** boolean expression : when evaluated to true value is selectable enum item else not */
    select: string,
    /** any expression : enum are sorted by value returned bay this expression */
    sort?: string,
    /** any expression : this expression is evaluated on change of this current schema value */
    onChange?: string,
    /** any expression : this expression is evaluated on init of this current schema value */
    onBegin?: string,
    /** any expression : this expression is evaluated on end of this current schema value */
    onEnd?: string,
    /** pointer to and array value which item have to be referenced in this value */ 
    reference?: {pointer: string, id:string, withAdd: boolean, withModify: boolean }
    /** an external access to reference enum provided by enclosing app (app provide list)*/
    extEnum?: any, 
    /** an external access to reference data provided by enclosing app (app provide UX)*/
    extRef?: any,
    /** Name of a card panel to group a set of properties */ 
    group?: {card: string, stack?: string, type?: any},
    // added for compiled functions
    [name: symbol]: DynFunc<any>
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
