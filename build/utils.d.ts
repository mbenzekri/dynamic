import { DynJson, DynKey, DerefFunc, SchemaPrimitive } from "./types";
import { AnyJson, SchemaDefinition, WalkDataActions, WalkSchemaActions } from "./types";
export declare const NOLOG: {
    log: (_m: any, ..._o: any[]) => void;
    warn: (_m: any, ..._o: any[]) => void;
    error: (_m: any, ..._o: any[]) => void;
    debug: (_m: any, ..._o: any[]) => void;
};
export declare const LOGGER: {
    isOn: boolean;
    log(m: any, ...o: any[]): void;
    warn(m: any, ...o: any[]): void;
    error(m: any, ...o: any[]): void;
    debug(m: any, ...o: any[]): void;
};
export declare function JsonCopy<T extends SchemaDefinition | AnyJson>(value: T): T;
export declare function walkSchema(schema: SchemaDefinition, actions: WalkSchemaActions, parent?: SchemaDefinition, propname?: string): void;
export declare const walkDynJson: (djs: DynJson, dsch: SchemaDefinition, actions: WalkDataActions, pdjs?: DynJson, key?: DynKey) => void;
export declare function DynValue(value: AnyJson, schema: SchemaDefinition, parent?: DynJson, key?: DynKey): DynJson;
export declare function schemaOf(pointer: string, root: SchemaDefinition, current: SchemaDefinition): SchemaDefinition | undefined;
export declare function valueOf(pointer: string, root: DynJson, current: DynJson): DynJson | undefined;
export declare const deref: DerefFunc;
export declare class DynFunc<T> {
    private func?;
    readonly prop: string;
    readonly defaut: T;
    readonly expr: string | string[];
    constructor(prop: string, schema: SchemaDefinition, expr: string | string[], type: SchemaPrimitive, defaut: T);
    eval(value: DynJson): T;
    compile(schema: SchemaDefinition, type: SchemaPrimitive): void;
}
export declare function registerDependencies(current: SchemaDefinition, expr: string): void;
//# sourceMappingURL=utils.d.ts.map