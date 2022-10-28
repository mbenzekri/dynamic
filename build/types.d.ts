export declare type AnyJson = boolean | number | string | null | JsonArray | JsonMap | undefined;
export interface JsonMap {
    [key: string]: AnyJson;
}
export interface JsonArray extends Array<AnyJson> {
}
export declare type JsPrimitive = "array" | "boolean" | "null" | "number" | "object" | "string" | "undefined";
export declare type SchemaPrimitive = "array" | "boolean" | "integer" | "null" | "number" | "object" | "string";
export declare function isPrimitive(value: string | DynJson): boolean;
export declare function isComposed(value: string | DynJson): boolean;
export declare function isEmpty(value: string | DynJson): boolean;
export declare function emptyValue(schema: SchemaDefinition): null | undefined;
declare type SchemaType = SchemaPrimitive | SchemaPrimitive[];
export declare type DynContext = DynMetadata & {
    value: any;
};
export declare type DerefFunc = (this: DynContext, string: string, kind: "value" | "summary" | "schema") => DynJson;
export declare type ExprFunc = (this: DynContext) => any;
interface DynFunc<T> {
    eval(value: DynJson): T;
}
export declare const SFUNC: {
    isA: symbol;
    isTemporary: symbol;
    summary: symbol;
    reference: symbol;
};
export declare type SchemaDefinition = {
    type: SchemaType;
    $id?: string;
    $schema?: string;
    $ref?: string;
    $comment?: string;
    title?: string;
    description?: string;
    default?: any;
    readOnly?: boolean;
    writeOnly?: boolean;
    examples?: any[];
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    additionalItems?: SchemaDefinition;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    items?: SchemaDefinition;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    contains?: SchemaDefinition;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: SchemaDefinition | boolean;
    definitions?: {
        [name: string]: SchemaDefinition;
    };
    properties?: {
        [key: string]: SchemaDefinition;
    };
    patternProperties?: string;
    dependencies?: SchemaDefinition;
    propertyNames?: string;
    const?: any;
    enum?: any[];
    format: string;
    contentMediaType: string;
    contentEncoding: string;
    if?: SchemaDefinition;
    then?: SchemaDefinition;
    else?: SchemaDefinition;
    allOf?: SchemaDefinition[];
    anyOf?: SchemaDefinition[];
    oneOf?: SchemaDefinition[];
    not?: SchemaDefinition;
    /** root schema (uppermost ascendant) if this schema */
    root: SchemaDefinition;
    /** absolute pointer of this schema */
    pointer: string;
    /** parent of this schema */
    parent?: SchemaDefinition;
    /** main type of this schema */
    main: SchemaPrimitive;
    /** true if null is an authorized value */
    allowNull: boolean;
    /** set of pointers of schema dependant/watching to this schema */
    watchers: Set<string>;
    /**  internal boolean expression : true if schema if a composition oneOf, anyOf, allOf  */
    isComposed: boolean;
    /** internal boolean expression : true if schema if an enumeration through "enum" property of by composition (oneOf consts only)  */
    isEnum: boolean;
    /** boolean expression : when evaluates to true mean the value is instance of this schema */
    isA: boolean | string;
    /** true if value is living only during form processing temporary (never returned) */
    isTemporary: boolean;
    /** string expression:  evaluated to be shown as a summary for this current schema value*/
    summary: string;
    /** any expression : calculted and assigned to this current schema value */
    set?: string;
    /** boolean expression : when evaluates to true the value must be hidden */
    hidden: string;
    /** boolean expression : when evaluated to true value is readonly else not (updatable)  */
    readonly: string;
    /** boolean expression : when evaluated to true value is mandatory else not */
    mandatory: string;
    /** boolean expression : when evaluated to true value pannel must uncollapsed else collapsed */
    open?: string;
    /** boolean expression : when evaluated to true value is selectable enum item else not */
    select: string;
    /** any expression : enum are sorted by value returned bay this expression */
    sort?: string;
    /** any expression : this expression is evaluated on change of this current schema value */
    onChange?: string;
    /** any expression : this expression is evaluated on init of this current schema value */
    onBegin?: string;
    /** any expression : this expression is evaluated on end of this current schema value */
    onEnd?: string;
    /** pointer to and array value wich */
    reference?: {
        pointer: string;
        id: string;
        withAdd: boolean;
        withModify: boolean;
    };
    [name: symbol]: DynFunc<any>;
};
export declare type DynKey = number | string;
export declare type DynMetadata = {
    shared: any;
    pointer: string;
    schema: SchemaDefinition;
    root: DynJson;
    parent?: DynJson;
    key?: DynKey;
};
export declare const META: unique symbol;
export declare const TYPE: unique symbol;
export declare const USER: unique symbol;
export declare type DynJson = DynUndef | DynNull | DynString | DynNumber | DynBoolean | DynObject | DynArray;
export declare type DynUndef = {
    [TYPE]: "undefined";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynNull = {
    [TYPE]: "null";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynString = String & {
    [TYPE]: "string";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynNumber = Number & {
    [TYPE]: "number";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynBoolean = Boolean & {
    [TYPE]: "boolean";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynArray = Array<DynJson> & {
    [TYPE]: "array";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
export declare type DynObject = {
    [TYPE]: "object";
    [META]: DynMetadata;
    [key: DynKey]: DynJson;
};
declare type WalkDataAction = (data: DynJson, schema: SchemaDefinition, pdata?: DynJson, key?: DynKey) => void;
export declare type WalkDataActions = WalkDataAction[];
declare type WalkSchemaAction = (schema: SchemaDefinition, parent?: SchemaDefinition, propname?: string) => void;
export declare type WalkSchemaActions = WalkSchemaAction[];
export {};
//# sourceMappingURL=types.d.ts.map