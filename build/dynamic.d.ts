import { AnyJson, DynJson, SchemaDefinition } from "./types";
export declare class Dynamic {
    readonly data: DynJson;
    readonly schema: AnyJson;
    readonly shared: any;
    readonly options: AnyJson;
    private validateFunc?;
    constructor(schemaJson: AnyJson, dataJson: AnyJson, shared?: any, options?: AnyJson | string);
    compileSchema(schemaJson: AnyJson): SchemaDefinition | undefined;
    validateErrors(msg: string): string[] | undefined;
    validate(): boolean;
    deepCopy(value?: DynJson): AnyJson;
    toJSON(): AnyJson;
}
//# sourceMappingURL=dynamic.d.ts.map