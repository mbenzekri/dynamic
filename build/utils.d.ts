import { DynJson, DynKey } from "./type";
import { AnyJson, SchemaDefinition, WalkDataActions, WalkSchemaActions } from "./type";
export declare function JsonType(value: AnyJson): "object" | "string" | "number" | "boolean" | "null" | "array" | "undefined";
export declare function JsonCopy(value: AnyJson): AnyJson;
export declare function pointerSchema(parent?: SchemaDefinition, propname?: string): string;
export declare function pointerData(parent?: DynJson, key?: DynKey): string;
export declare function walkSchema(schema: SchemaDefinition, actions: WalkSchemaActions, parent?: SchemaDefinition, propname?: string): void;
export declare const walkDynJson: (djs: DynJson, dsch: SchemaDefinition, actions: WalkDataActions, pdjs?: DynJson, key?: DynKey) => void;
export declare function DynValue(value: AnyJson, schema: SchemaDefinition, parent?: DynJson, key?: DynKey): DynJson;
export declare function calculateDefault(schema: SchemaDefinition, parent: DynJson, key: DynKey): DynJson;
export declare function schemaOf(pointer: string, root: SchemaDefinition, current: SchemaDefinition): SchemaDefinition | undefined;
export declare function valueOf(pointer: string, root: DynJson, current: DynJson): DynJson | undefined;
export declare function calculateSummary(schema: SchemaDefinition, value: DynJson, $f: (p: string, a: number) => any): string;
export declare function evalExpr(attribute: string, value: DynJson, userdata: any): any;
//# sourceMappingURL=utils.d.ts.map