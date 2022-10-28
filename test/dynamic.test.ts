import { Dynamic } from "../src/dynamic"
import { META, TYPE } from "../src/types"

// switch off logs during testing
Dynamic.logOff()

describe("test Dynamic class", () => {

    it("should throw on invalid Schema", () => {
        const t = () => {
            new Dynamic({ type: "numberZ" }, 12);
        };
        expect(t).toThrow(Error);
    })
    it("should throw an 'Invalid Schema' message", () => {
        try {
            new Dynamic({ type: "numberZ" }, 12);
        } catch (e) {
            expect((e as Error).message.startsWith("Invalid Schema")).toBe(true);
        }
    })

    it("should throw an 'Invalid Schema' compilation message", () => {
        try {
            new Dynamic({ type: "number", "summary": "${}" }, 12);
        } catch (e) {
            expect((e as Error).message.startsWith("Invalid Schema")).toBe(true);
        }
    })

    it("should create a undefined value", () => {
        const value = new Dynamic({ type: "null" }, undefined)
        expect(value.toJSON()).toBeUndefined();
        expect(value.data[TYPE]).toBe("undefined");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("null");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })

    it("should create a null value", () => {
        const value = new Dynamic({ type: "null" }, null)
        expect(value.toJSON()).toBeNull();
        expect(value.data[TYPE]).toBe("null");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("null");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })

    it("should create a number", () => {
        const value = new Dynamic({ type: "number" }, 12)
        expect(value.toJSON()).toBe(12);
        expect(value.data[TYPE]).toBe("number");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("number");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })
    it("should create a boolean", () => {
        const value = new Dynamic({ type: "boolean" }, false)
        expect(value.toJSON()).toBe(false);
        expect(value.data[TYPE]).toBe("boolean");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("boolean");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })
    it("should create a string", () => {
        const value = new Dynamic({ type: "string" }, "dummy")
        expect(value.toJSON()).toBe("dummy");
        expect(value.data[TYPE]).toBe("string");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("string");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })
    it("should create an object (without schema on attribute)", () => {
        const value = new Dynamic({ type: "object" }, { a: 1, b: true, c: "a string" })
        expect(value.toJSON()).toStrictEqual({ a: 1, b: true, c: "a string" });
        expect(value.data[TYPE]).toBe("object");
        expect(value.data[META].pointer).toBe('#');
        expect(value.data[META].schema.type).toBe("object");
        expect(value.data[META].parent).toBe(undefined);
        expect(value.data[META].key).toBe(undefined);
        expect(value.data[META].root).toBe(value.data);
        expect(value.data[META].shared).toBe(undefined);
    })

    it("should create an object (with schema on attribute)", () => {
        const schema = {
            type: "object",
            properties: {
                a: { type: "number" },
                b: { type: "boolean" },
                c: { type: "string" },
                d: { type: "null" },
                e: { type: "number" },
            }
        }
        const value = new Dynamic(schema, { a: 1, b: true, c: "a string", d: null })
        expect(value.toJSON()).toStrictEqual({ a: 1, b: true, c: "a string", d: null });
        expect(value.data["a"][TYPE]).toBe("number");
        expect(value.data["a"][META]).toMatchObject({ pointer: "#/a", root: value.data, schema: schema.properties.a, parent: value.data, key: "a" });
        expect(value.data["b"][TYPE]).toBe("boolean");
        expect(value.data["b"][META]).toMatchObject({ pointer: "#/b", root: value.data, schema: schema.properties.b, parent: value.data, key: "b" });
        expect(value.data["c"][TYPE]).toBe("string");
        expect(value.data["c"][META]).toMatchObject({ pointer: "#/c", root: value.data, schema: schema.properties.c, parent: value.data, key: "c" });
        expect(value.data["d"][TYPE]).toBe("null");
        expect(value.data["d"][META]).toMatchObject({ pointer: "#/d", root: value.data, schema: schema.properties.d, parent: value.data, key: "d" });
    })

    it("should primitives be used in expression seamlessly", () => {
        const schema = {
            type: "object",
            properties: {
                a: { type: "number" },
                b: { type: "number" },
                c: { type: ["number", "null"] },
            }
        }
        const data = { a: 3, b: 10, c: null }
        const value: any = new Dynamic(schema, data)
        expect(value.data.a + 0).toBe(3)
        expect(value.data.a * value.data.b).toBe(30)
        expect(value.data.b - value.data.a).toBe(7)
        expect(value.data.b / 2).toBe(5)
        expect(value.data.a < value.data.b).toBeTruthy()
        expect(value.data.a > value.data.b).toBeFalsy()
    })

    it("should nullish values be used in expression seamlessly", () => {
        const schema = {}
        const data = { n: null, u: undefined }
        const value: any = new Dynamic(schema, data)
        expect(value.data.n.valueOf()).toBeNull()
        expect(value.data.u.valueOf()).toBeUndefined()
        // expect(value.data.n == null).toBeTruthy()
        // expect(value.data.u == null).toBeTruthy()
        // expect(value.data.n == undefined).toBeFalsy()
        // expect(value.data.u == undefined).toBeTruthy()
    })

    it("should resolve definitions", () => {
        const schema  = { 
            definitions : {
                adr: { 
                    type : "object", 
                    properties : { 
                        no: { type : "number"}, 
                        street:  { type : "string"}, 
                        city:  { type : "string"}
                    }
                }
            },
            $ref : "#/definitions/adr"
        }
        const data = { 
            a: 2,
            b: 3,
        }
        const value: any = new Dynamic(schema, data)
        expect(value.data[META].schema).toMatchObject(schema.definitions.adr)
    })


})
