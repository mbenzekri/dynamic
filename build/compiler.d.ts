import { SchemaDefinition, SchemaPrimitive } from "./types";
export declare function compileSchemaType(schema: SchemaDefinition): void;
export declare function compileSchemaDefault(schema: SchemaDefinition, parent?: SchemaDefinition, key?: string): void;
export declare function compileDynFunc<T>(property: string, type: SchemaPrimitive, defval: T): (schema: SchemaDefinition, _parent?: SchemaDefinition, _key?: string) => void;
//# sourceMappingURL=compiler.d.ts.map