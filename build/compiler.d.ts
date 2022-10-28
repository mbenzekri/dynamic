import { SchemaDefinition, SchemaPrimitive } from "./types";
export declare function compileSchemaInit(schema: SchemaDefinition, parent?: SchemaDefinition, key?: string): void;
export declare function compileSchemaDefault(schema: SchemaDefinition): void;
export declare function compileDynFunc<T>(property: string, type: SchemaPrimitive | null, defval: T): (schema: SchemaDefinition, _parent?: SchemaDefinition, _key?: string) => void;
/** copy $ref by the appropriate copied definition */
export declare const compileDefinition: (rootSchema: SchemaDefinition) => (schema: SchemaDefinition) => void;
//# sourceMappingURL=compiler.d.ts.map