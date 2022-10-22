import { emptyValue, isEmpty } from "./type";
import { TYPE, META } from "./type";
export function JsonType(value) {
    if (typeof value == "number")
        return "number";
    if (typeof value == "string")
        return "string";
    if (typeof value == "boolean")
        return "boolean";
    if (Array.isArray(value))
        return "array";
    if (value != null)
        return "object";
    if (value === null)
        return "null";
    return "undefined";
}
export function JsonCopy(value) {
    return JSON.parse(JSON.stringify(value));
}
function splitPointer(pointer) {
    const pointerRe = /^(\d+|#)([\/][^\/])*$/;
    if (pointerRe.test(pointer)) {
        const downsteps = pointer.split(/ *\/ */).filter(v => v != '').map(t => /^\d+$/.test(t) ? parseInt(t, 10) : t);
        const upsteps = typeof downsteps[0] == "number" ? downsteps[0] : -1;
        const relative = upsteps >= 0;
        const absolute = !relative;
        downsteps.shift();
        const parent = downsteps.length > 0 ? pointer.replace(/[/][^/]*$/, "") : undefined;
        const key = downsteps.length > 0 ? downsteps[downsteps.length - 1] : undefined;
        return { pointer, absolute, relative, upsteps, downsteps, parent, key };
    }
    throw (`Incorrect pointer syntax "${pointer}" must be "#/prop1/prop2/..." or "<number>/prop1/prop2/..."`);
}
export function pointerSchema(parent, propname) {
    var _a;
    return `${(_a = parent === null || parent === void 0 ? void 0 : parent.pointer) !== null && _a !== void 0 ? _a : '#'}${propname ? `/${propname}` : ''}`;
}
export function pointerData(parent, key) {
    var _a;
    return `${(_a = parent === null || parent === void 0 ? void 0 : parent[META].pointer) !== null && _a !== void 0 ? _a : '#'}${key != null ? `/${key}` : ''}`;
}
export function walkSchema(schema, actions, parent, propname) {
    actions.forEach(action => {
        try {
            action(schema, parent, propname);
        }
        catch (e) {
            console.error([
                `Error while compiling schema ${String(e)}`,
                `action: ${action.name}`,
                `schema: ${pointerSchema(parent, propname)}`
            ].join("\n"));
        }
    });
    if (schema.properties) {
        return Object.entries(schema.properties)
            .forEach(([name, child]) => walkSchema(child, actions, schema, name));
    }
    if (schema.items) {
        if (schema.items.oneOf)
            return walkSchema(schema.items, actions, schema, '*');
        if (schema.items.allOf)
            return walkSchema(schema.items, actions, schema, '*');
        if (schema.items.anyOf)
            return walkSchema(schema.items, actions, schema, '*');
        return walkSchema(schema.items, actions, schema, '*');
    }
    if (schema.oneOf)
        return schema.oneOf.forEach((child) => walkSchema(child, actions, parent, propname));
    if (schema.allOf)
        return schema.allOf.forEach((child) => walkSchema(child, actions, parent, propname));
    if (schema.anyOf)
        return schema.anyOf.forEach((child) => walkSchema(child, actions, parent, propname));
}
export const walkDynJson = (djs, dsch, actions, pdjs, key) => {
    for (const action of actions) {
        try {
            action(djs, dsch, pdjs, key);
        }
        catch (e) {
            console.error(`Error while compiling data ${String(e)}\naction: ${action.name}\n at: ${pointerData(pdjs, key)}`);
        }
    }
    if (djs[TYPE] == "array") {
        if (dsch.composed) {
            djs.forEach((item, index) => {
                var _a, _b, _c, _d, _e, _f;
                const composition = (_f = (_d = (_b = (_a = dsch.items) === null || _a === void 0 ? void 0 : _a.oneOf) !== null && _b !== void 0 ? _b : (_c = dsch.items) === null || _c === void 0 ? void 0 : _c.anyOf) !== null && _d !== void 0 ? _d : (_e = dsch.items) === null || _e === void 0 ? void 0 : _e.allOf) !== null && _f !== void 0 ? _f : [];
                composition.forEach((schema) => {
                    if (schema.isInstance && schema.isInstance(null, item, djs, index, () => null))
                        walkDynJson(item, schema, actions, djs, index);
                });
            });
        }
        else {
            djs.forEach((item, index) => dsch.items && walkDynJson(item, dsch.items, actions, djs, index));
        }
    }
    if (djs[TYPE] == "object") {
        Object.entries(djs).forEach(([propname, propval]) => {
            var _a;
            const propschema = (_a = dsch.properties) === null || _a === void 0 ? void 0 : _a[propname];
            if (propschema)
                walkDynJson(propval, propschema, actions, djs, propname);
        });
    }
};
/**
 * initialise metadata infos (pointer, schema, ...)  for dynJson object
 */
function setMeta(data, schema, parent, key) {
    if (parent != null && key != null) {
        data[META].pointer = `${parent[META].pointer}/${key}`;
        data[META].schema = schema;
        data[META].root = parent[META].root;
        data[META].parent = parent;
        data[META].key = key;
    }
    else {
        data[META].pointer = "#";
        data[META].schema = schema;
        data[META].root = data;
    }
    return data;
}
export function DynValue(value, schema, parent, key) {
    function DynCtor(value) {
        let type = "undefined";
        let result = {};
        if (value === null)
            [type, result] = ["null", {}];
        else if (typeof value == "string")
            [type, result] = ["string", new String(value)];
        else if (typeof value == "number")
            [type, result] = ["number", new Number(value)];
        else if (typeof value == "boolean")
            [type, result] = ["boolean", new Boolean(value)];
        else if (Array.isArray(value))
            [type, result] = ["array", value.map(item => DynCtor(item))];
        else if (value != null)
            [type, result] = ["object", Object.keys(value).reduce((obj, key) => { obj[key] = DynCtor(value[key]); return obj; }, {})];
        Object.defineProperty(result, TYPE, { value: type });
        Object.defineProperty(result, META, { value: {} });
        return result;
    }
    const dynjson = DynCtor(value);
    walkDynJson(dynjson, schema, [
        setMeta // recursive initialisation of "META" property
    ], parent, key);
    return dynjson;
}
export function calculateDefault(schema, parent, key) {
    switch (true) {
        case schema.const !== null:
            return schema.const;
        case schema.default != null:
            return DynValue(schema.default, schema, parent, key);
        case schema.main === 'object': {
            const dynobj = DynValue({}, schema, parent, key);
            schema.properties && Object.entries(schema.properties).forEach(([pname, pschema]) => {
                dynobj[pname] = calculateDefault(pschema, dynobj, pname);
            });
            return dynobj;
        }
        case schema.main === 'array':
            return DynValue([], schema, parent, key);
        default:
    }
    return DynValue(emptyValue(schema), schema, parent, key);
}
export function schemaOf(pointer, root, current) {
    var _a;
    const sptr = splitPointer(pointer);
    let base = sptr.relative ? current : root;
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++)
            base = base === null || base === void 0 ? void 0 : base.parent;
        if (!base) {
            console.error(`in context ${current.pointer} enable to dereference pointer ${pointer} (not enough ascendant')`);
            return;
        }
    }
    for (const token of sptr.downsteps) {
        const prev = base;
        base = (token === '*') ? base.items : (_a = base.properties) === null || _a === void 0 ? void 0 : _a[token];
        if (!base) {
            console.error(`in context ${current.pointer} enable to dereference pointer ${pointer}(property '${token}' not found in ${prev.pointer})`);
            return;
        }
    }
    return base;
}
export function valueOf(pointer, root, current) {
    const sptr = splitPointer(pointer);
    let base = sptr.relative ? current : root;
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++)
            base = base === null || base === void 0 ? void 0 : base[META].parent;
        if (!base)
            throw Error(`enable to dereference pointer ${pointer} (no more parents)`);
    }
    for (const token of sptr.downsteps) {
        if (base == null)
            return;
        if (base[TYPE] == "object") {
            base = base[token];
        }
        if (base[TYPE] == "array" && typeof token == "number") {
            base = base[token];
        }
    }
    return base;
}
export function calculateSummary(schema, value, $f) {
    var _a, _b, _c, _d, _e;
    if (schema == null || isEmpty(value))
        return '~';
    if (schema.summary)
        return schema[Symbol('summary')](schema, value, $f);
    if (schema.isEnum && schema.oneOf)
        return String((_b = (_a = schema.oneOf.find((item) => item.const === value)) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : value);
    if (schema.isEnum && schema.anyOf)
        return String((_d = (_c = schema.anyOf.find((item) => item.const === value)) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : value);
    if (schema.refTo) {
        const refenum = schema[Symbol('refTo')](schema, value, $f);
        if (refenum && refenum.refname && Array.isArray(refenum.refarray)) {
            const refname = (_e = refenum === null || refenum === void 0 ? void 0 : refenum.refname) !== null && _e !== void 0 ? _e : 'id';
            const refarray = refenum === null || refenum === void 0 ? void 0 : refenum.refarray;
            const index = refarray === null || refarray === void 0 ? void 0 : refarray.findIndex((item) => item[refname] === value);
            if (index >= 0) {
                const schema = refarray[index][META].schema;
                return schema === null || schema === void 0 ? void 0 : schema.summary(schema, refarray[index], refarray, index, $f);
            }
            return String(value);
        }
        return String(value);
    }
    if (value[TYPE] == "array") {
        return value
            .map((item) => item && schema.items ? calculateSummary(schema.items, item, $f) : item)
            .filter((v) => v)
            .join(',');
    }
    if (value[TYPE] == "object") {
        return schema.properties ? Object.keys(schema.properties)
            .filter((property) => !(value[property] == null))
            .map((property) => schema.properties ? calculateSummary(schema.properties[property], value[property], $f) : value[property])
            .join(',') : "";
    }
    return String(value);
}
var ResolveType;
(function (ResolveType) {
    ResolveType[ResolveType["value"] = 0] = "value";
    ResolveType[ResolveType["summary"] = 1] = "summary";
    ResolveType[ResolveType["schema"] = 2] = "schema";
})(ResolveType || (ResolveType = {}));
function deref(ctx) {
    return (pointer, resolveType) => {
        pointer = typeof pointer == "string" ? pointer : "#";
        resolveType = Number.isInteger(ResolveType.value) ? resolveType : 0;
        const value = valueOf(pointer, ctx.root, ctx.value);
        if (value == null)
            return;
        switch (resolveType) {
            case ResolveType.value: return value;
            case ResolveType.summary: return calculateSummary(value[META].schema, value, deref(ctx));
            case ResolveType.schema: return value === null || value === void 0 ? void 0 : value[META].schema;
        }
    };
}
export function evalExpr(attribute, value, userdata) {
    const schema = value[META].schema;
    const func = schema[Symbol(attribute)];
    const root = value[META].root;
    const key = value[META].key;
    const ctx = { value, root, schema, key, userdata };
    if (typeof func != "function")
        return;
    return func(schema, value, parent, key, deref(ctx), userdata);
}
//# sourceMappingURL=utils.js.map