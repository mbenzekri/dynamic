import { AnyJson, DynJson, SchemaDefinition } from "./type";
export declare class Dynamic {
    readonly data: DynJson;
    readonly userdata: any;
    readonly options: AnyJson;
    private readonly validateFunc;
    constructor(schemaJson: AnyJson | string, dataJson: AnyJson | string, userdata?: any, options?: AnyJson | string);
    compileSchema(schemaJson: AnyJson): SchemaDefinition | undefined;
    validateErrors(msg: string): string[] | undefined;
    validate(json?: AnyJson, schema?: SchemaDefinition): boolean;
    deepCopy(value?: DynJson): AnyJson;
    toJSON(): AnyJson;
}
//# sourceMappingURL=dynamic.d.ts.map