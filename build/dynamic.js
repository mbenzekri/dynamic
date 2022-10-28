import Ajv from "ajv/dist/2020";
const AJV = new Ajv({ strictNumbers: false, strictSchema: false, coerceTypes: false, allErrors: true });
AJV.addFormat("color", /./);
AJV.addFormat("signature", /./);
AJV.addFormat("password", /./);
AJV.addFormat("doc", /./);
AJV.addFormat("uuid", /./);
AJV.addFormat("geo", /./);
AJV.addFormat("markdown", /./);
AJV.addFormat("asset", /./);
AJV.addFormat("date", /./);
AJV.addFormat("time", /./);
AJV.addFormat("date-time", /./);
AJV.addFormat("email", /./);
AJV.addFormat("uri-reference", /./);
AJV.addFormat("uri", /./);
AJV.addFormat("regex", /./);
import { TYPE, META, isEmpty } from "./types";
import { DynValue, JsonCopy, LOGGER, walkSchema } from "./utils";
import { compileDefinition, compileDynFunc, compileSchemaDefault, compileSchemaInit } from "./compiler";
export class Dynamic {
    constructor(schemaJson, dataJson, shared = undefined, options = {}) {
        var _a;
        this.schema = typeof schemaJson == "string" ? JSON.parse(schemaJson) : JsonCopy(schemaJson);
        this.shared = shared;
        this.options = typeof options == "string" ? JSON.parse(options) : JsonCopy(options);
        const compiledSchema = this.compileSchema(schemaJson);
        if (!compiledSchema)
            throw Error((_a = this.validateErrors("Invalid Schema")) === null || _a === void 0 ? void 0 : _a.join("\n"));
        this.data = DynValue(dataJson, compiledSchema);
    }
    get logger() { return LOGGER; }
    static logOn() { LOGGER.isOn = true; }
    static logOff() { LOGGER.isOn = false; }
    compileSchema(schemaJson) {
        const valid = AJV.validateSchema(schemaJson);
        if (valid) {
            // on passe par une copy pour ne pas modifier l'original
            const schema = schemaJson;
            walkSchema(schema, [
                compileDefinition(schema),
                compileSchemaInit,
                compileSchemaDefault,
                compileDynFunc('isA', "boolean", true),
                compileDynFunc('summary', "string", "${A`0`}"),
                compileDynFunc('set', null, null),
                compileDynFunc('hidden', "boolean", false),
                compileDynFunc('readonly', "boolean", false),
                compileDynFunc('mandatory', "boolean", false),
                compileDynFunc('open', "boolean", true),
                compileDynFunc('select', "boolean", true),
                compileDynFunc('sort', null, null),
                compileDynFunc('onChange', null, null),
                compileDynFunc('onBegin', null, null),
                compileDynFunc('onEnd', null, null),
                // specific compiler for : schema.reference ??= undefined
                // nom	type	description
                // group	string	permet de fixer le group d'un champs
                // tab	string	permet de fixer le classeur d'un groupe (le groupe devient onglet)
                // enumRef	string	enumRef permet de collecter dynamiquement une énumération depuis l'application appelante. La valeur correspond à un identifiant d'énumération, l'attribut options doit contenir un champ 'ref' de type 'function' prenant en paramètre cet identifiant et doit retourner une énumération sous la forme d'un tableau de {"const": valeur, "title": libelle}.
                // assets	string	liste les types d'éléments sélectionnable sous la forme "attribut@class,..."
            ]);
            try {
                this.validateFunc = AJV.compile(schema);
            }
            catch (e) { }
            return schema;
        }
        return;
    }
    validateErrors(msg) {
        var _a;
        const errors = (_a = AJV.errors) === null || _a === void 0 ? void 0 : _a.map(error => {
            const params = [];
            for (const key in error.params) {
                params.push(`${key}=${JSON.stringify(error.params[key])}`);
            }
            return `Error "${error.message}" @ ${error.instancePath}  Params => ${params.join(' ')}`;
        });
        errors === null || errors === void 0 ? void 0 : errors.unshift(msg);
        return errors;
    }
    validate() {
        var _a;
        return !!((_a = this.validateFunc) === null || _a === void 0 ? void 0 : _a.call(this, this.data));
    }
    deepCopy(value = this.data) {
        const schema = value[META].schema;
        // a temporary value is allways returned as undefined
        if (schema === null || schema === void 0 ? void 0 : schema.isTemporary)
            return undefined;
        const nullval = (schema === null || schema === void 0 ? void 0 : schema.allowNull) ? null : undefined;
        switch (value[TYPE]) {
            case "undefined": return undefined;
            case "null": return null;
            case "number": return value.valueOf();
            case "boolean": return value.valueOf();
            case "string": return value.valueOf();
            case "object":
                return Object.values(value).every(v => isEmpty(v))
                    ? nullval : Object.entries(value).reduce((obj, [propname, propval]) => {
                    obj[propname] = this.deepCopy(propval);
                    return obj;
                }, {});
            case "array": return value.length > 0 ? value.map(v => this.deepCopy(v)) : nullval;
        }
    }
    toJSON() {
        return this.deepCopy();
    }
}
//# sourceMappingURL=dynamic.js.map