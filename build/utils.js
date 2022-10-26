import { calculateSummary } from "./default";
import { isPrimitive } from "./types";
import { TYPE, META } from "./types";
export const NOLOG = {
    log: (_m, ..._o) => { undefined; },
    warn: (_m, ..._o) => undefined,
    error: (_m, ..._o) => undefined,
    debug: (_m, ..._o) => undefined,
};
export const LOGGER = new class {
    constructor() {
        this.isOn = true;
    }
    log(m, ...o) { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined; }
    warn(m, ...o) { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined; }
    error(m, ...o) { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined; }
    debug(m, ...o) { this.isOn ? console.log(`DYNAMIC: ${m}`, ...o) : undefined; }
};
globalThis.nvl = function nvl(strarr, ...valarr) {
    const all = [];
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str));
    return all.join('');
};
globalThis.V = function (strarr, ...valarr) {
    const all = [];
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str));
    return all.join('');
};
globalThis.A = function (strarr, ...valarr) {
    const all = [];
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str));
    return all.join('');
};
globalThis.S = function (strarr, ...valarr) {
    const all = [];
    strarr.forEach((str, i) => (i == 0)
        ? all.push(str)
        : all.push(valarr[i - 1] == null ? '' : valarr[i - 1], str));
    return all.join('');
};
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
function pointerSchema(parent, propname) {
    var _a;
    return `${(_a = parent === null || parent === void 0 ? void 0 : parent.pointer) !== null && _a !== void 0 ? _a : '#'}${propname ? `/${propname}` : ''}`;
}
function pointerData(parent, key) {
    var _a;
    return `${(_a = parent === null || parent === void 0 ? void 0 : parent[META].pointer) !== null && _a !== void 0 ? _a : '#'}${key != null ? `/${key}` : ''}`;
}
export function walkSchema(schema, actions, parent, propname) {
    actions.forEach(action => {
        try {
            action(schema, parent, propname);
        }
        catch (e) {
            LOGGER.error([
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
            LOGGER.error(`Error while compiling data ${String(e)}\naction: ${action.name}\n at: ${pointerData(pdjs, key)}`);
        }
    }
    if (djs[TYPE] == "array") {
        if (dsch.isComposed) {
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
        let [type, result] = ["undefined", {}];
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
        return new Proxy(result, {
            get(target, key) {
                //LOGGER.log(`Get on "${target[META].pointer}"`)   
                // FIX --- following fix error  calls to valueOf() over primitive (Number,String, Boolean)
                // TypeError: Number.prototype.valueOf requires that 'this' be a Number
                if (key === "valueOf" || key === Symbol.toPrimitive) {
                    if (target[TYPE] == "null")
                        return (hint) => hint == "string" ? "" : null;
                    if (target[TYPE] == "undefined")
                        return (hint) => hint == "string" ? "" : undefined;
                    if (key === "valueOf")
                        return () => target[key].call(target);
                }
                // FIX --- 
                return Reflect.get(target, key, target);
            },
            set(target, key, value) {
                const dynjson = DynValue(value, target[META].schema, target[META].parent, target[META].key);
                //LOGGER.log(`Set on "${target[META].pointer}"`)   
                return Reflect.set(target, key, dynjson, target);
            }
        });
    }
    const dynjson = DynCtor(value);
    walkDynJson(dynjson, schema, [
        setMeta // recursive initialisation of "META" property
    ], parent, key);
    return dynjson;
}
export function schemaOf(pointer, root, current) {
    var _a;
    const sptr = splitPointer(pointer);
    let base = sptr.relative ? current : root;
    if (sptr.relative) {
        for (let i = 0; i < sptr.upsteps; i++)
            base = base === null || base === void 0 ? void 0 : base.parent;
        if (!base) {
            LOGGER.error(`in context ${current.pointer} enable to dereference pointer ${pointer} (not enough ascendant')`);
            return;
        }
    }
    for (const token of sptr.downsteps) {
        const prev = base;
        base = (token === '*') ? base.items : (_a = base.properties) === null || _a === void 0 ? void 0 : _a[token];
        if (!base) {
            LOGGER.error(`in context ${current.pointer} enable to dereference pointer ${pointer}(property '${token}' not found in ${prev.pointer})`);
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
export const deref = function (pointer, kind = "value") {
    const value = valueOf(pointer, this.root, this.value);
    if (value == null)
        return;
    switch (kind) {
        case "value": return value;
        case "summary": return calculateSummary(value[META].schema, value, deref.bind(this));
        case "schema": return value === null || value === void 0 ? void 0 : value[META].schema;
    }
};
export class DynFunc {
    constructor(prop, schema, expr, type, defaut) {
        this.prop = prop;
        this.expr = expr;
        this.defaut = defaut;
        this.compile(schema, type);
    }
    eval(value) {
        var _a;
        try {
            const context = Object.assign({}, value[META]);
            context.value = isPrimitive(value) ? value.valueOf() : value;
            return (_a = this.func) === null || _a === void 0 ? void 0 : _a.call(context);
        }
        catch (e) {
            LOGGER.error(`unable to eval property "${this.prop}" error is : \n\t => ${e.toString()}`);
            return this.defaut;
        }
    }
    compile(schema, type) {
        if (type == "string" && typeof this.expr == "string") {
            registerDependencies(schema, this.expr);
            try {
                const code = ` return nvl\`${this.expr}\`; `;
                this.func = Function(code);
            }
            catch (e) {
                this.func = () => "";
                LOGGER.log(`unable to compile ${this.prop} expression "${this.expr}" error is: \n\t => ${String(e)}`);
            }
        }
    }
}
export function registerDependencies(current, expr) {
    const POINTER_RE = /[V|A|S]`(#|\d+)([/][^/])*`/g;
    let matches;
    while ((matches = POINTER_RE.exec(expr)) != null) {
        const pointer = matches[1];
        const dependant = schemaOf(pointer, current.root, current);
        dependant === null || dependant === void 0 ? void 0 : dependant.watchers.add(current.pointer);
    }
}
//# sourceMappingURL=utils.js.map