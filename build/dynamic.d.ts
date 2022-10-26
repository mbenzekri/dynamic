import { AnyJson, DynJson, SchemaDefinition } from "./types";
export declare class Dynamic {
    readonly data: DynJson;
    readonly schema: AnyJson;
    readonly shared: any;
    readonly options: AnyJson;
    private validateFunc?;
    constructor(schemaJson: AnyJson, dataJson: AnyJson, shared?: any, options?: AnyJson | string);
    get logger(): {
        isOn: boolean;
        log(m: any, ...o: any[]): void;
        warn(m: any, ...o: any[]): void;
        error(m: any, ...o: any[]): void;
        debug(m: any, ...o: any[]): void;
    };
    static logOn(): void;
    static logOff(): void;
    compileSchema(schemaJson: AnyJson): SchemaDefinition | undefined;
    validateErrors(msg: string): string[] | undefined;
    validate(): boolean;
    deepCopy(value?: DynJson): AnyJson;
    toJSON(): AnyJson;
}
//# sourceMappingURL=dynamic.d.ts.map