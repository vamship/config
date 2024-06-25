import { expect, use as _useWithChai } from 'chai';
import { JSONSchemaType } from 'ajv';
import _chaiAsPromised from 'chai-as-promised';
import _sinonChai from 'sinon-chai';
import 'mocha';

_useWithChai(_sinonChai);
_useWithChai(_chaiAsPromised);

import {
    MockImportHelper,
    testValues as _testValues,
} from '@vamship/test-utils';
import _esmock from 'esmock';

import { ConfigParser } from '../../../src/config.js';

describe('dotParser()', function () {
    type ImportResult<T> = {
        testTarget: ConfigParser<T>;
    };

    async function _import<T>(): Promise<ImportResult<T>> {
        type ConfigModule<T> = {
            dotParser: ConfigParser<T>;
        };

        const importHelper = new MockImportHelper<ConfigModule<T>>(
            'project://src/parsers/dot-parser.js',
            {},
            import.meta.resolve('../../../../working'),
        );

        const targetModule = await _esmock(
            importHelper.importPath,
            importHelper.getLibs(),
            importHelper.getGlobals(),
        );

        return {
            testTarget: targetModule.dotParser,
        };
    }

    type DummyConfigUncoerced = {
        cfg: {
            str: {
                str: string;
                num: string;
                bool: string;
                arr: string;
            };
            num: {
                str: number;
                num: number;
                bool: number;
                arr: number;
            };
            bool: {
                str: boolean;
                num: boolean;
                bool: boolean;
                arr: boolean;
            };
            arr: {
                str: string[];
                num: number[];
                bool: boolean[];
                arr: number[];
            };
        };
    };

    type DummyConfig = {
        cfg: {
            str: {
                str: string;
                num: number;
                bool: boolean;
                arr: number[];
            };
            num: {
                str: string;
                num: number;
                bool: boolean;
                arr: number[];
            };
            bool: {
                str: string;
                num: number;
                bool: boolean;
                arr: number[];
            };
            arr: {
                str: string;
                num: number;
                bool: boolean;
                arr: number[];
            };
        };
    };

    function createDummyConfigSchema(
        removeAdditional = false,
    ): JSONSchemaType<DummyConfig> {
        const schema: JSONSchemaType<DummyConfig> = {
            $schema: 'http://json-schema.org/draft-07/schema#',
            type: 'object',
            properties: {
                cfg: {
                    type: 'object',
                    properties: {
                        str: {
                            type: 'object',
                            properties: {
                                str: { type: 'string' },
                                num: { type: 'number' },
                                bool: { type: 'boolean' },
                                arr: {
                                    type: 'array',
                                    items: { type: 'number' },
                                },
                            },
                            required: ['str', 'num', 'bool', 'arr'],
                        },
                        num: {
                            type: 'object',
                            properties: {
                                str: { type: 'string' },
                                num: { type: 'number' },
                                bool: { type: 'boolean' },
                                arr: {
                                    type: 'array',
                                    items: { type: 'number' },
                                },
                            },
                            required: ['str', 'num', 'bool', 'arr'],
                        },
                        bool: {
                            type: 'object',
                            properties: {
                                str: { type: 'string' },
                                num: { type: 'number' },
                                bool: { type: 'boolean' },
                                arr: {
                                    type: 'array',
                                    items: { type: 'number' },
                                },
                            },
                            required: ['str', 'num', 'bool', 'arr'],
                        },
                        arr: {
                            type: 'object',
                            properties: {
                                str: { type: 'string' },
                                num: { type: 'number' },
                                bool: { type: 'boolean' },
                                arr: {
                                    type: 'array',
                                    items: { type: 'number' },
                                },
                            },
                            required: ['str', 'num', 'bool', 'arr'],
                        },
                    },
                    required: ['str', 'num', 'bool', 'arr'],
                },
            },
            required: ['cfg'],
        };

        if (removeAdditional) {
            const schemaForUpdate = schema as {
                additionalProperties: boolean;
                properties: {
                    cfg: {
                        additionalProperties: boolean;
                        properties: {
                            str: {
                                additionalProperties: boolean;
                            };
                            num: {
                                additionalProperties: boolean;
                            };
                            bool: {
                                additionalProperties: boolean;
                            };
                            arr: {
                                additionalProperties: boolean;
                            };
                        };
                    };
                };
            };
            schemaForUpdate.additionalProperties = false;
            schemaForUpdate.properties.cfg.additionalProperties = false;
            schemaForUpdate.properties.cfg.properties!.str.additionalProperties =
                false;
            schemaForUpdate.properties.cfg.properties!.num.additionalProperties =
                false;
            schemaForUpdate.properties.cfg.properties!.bool.additionalProperties =
                false;
            schemaForUpdate.properties.cfg.properties!.arr.additionalProperties =
                false;
        }

        return schema;
    }

    function createRawConfig(): Record<string, unknown>[] {
        return [
            { 'cfg.str.str': '42' },
            { 'cfg.str.num': '42' },
            { 'cfg.str.bool': 'false' },
            { 'cfg.str.arr': '123' },

            { 'cfg.num.str': 42 },
            { 'cfg.num.num': 42 },
            { 'cfg.num.bool': 0 },
            { 'cfg.num.arr': 123 },

            { 'cfg.bool.str': false },
            { 'cfg.bool.num': false },
            { 'cfg.bool.bool': false },
            { 'cfg.bool.arr': true },

            { 'cfg.arr.str': ['foo'] },
            { 'cfg.arr.num': [42] },
            { 'cfg.arr.bool': [false] },
            { 'cfg.arr.arr': [123] },
        ];
    }

    _testValues.allButArray().forEach((value) => {
        it(`should throw an error if invoked without a valid array of properties (value=${value})`, async function () {
            const { testTarget } = await _import<DummyConfig>();
            const error = 'Invalid config properties (arg #1)';
            const properties = value as unknown as Record<string, unknown>[];
            const schema: JSONSchemaType<DummyConfig> = {
                type: 'object',
            } as JSONSchemaType<DummyConfig>;

            await expect(testTarget(properties, schema)).to.be.rejectedWith(
                error,
            );
        });
    });

    _testValues.allButSelected('object', 'undefined').forEach((value) => {
        it(`should throw an error if a schema is specified but is not valid (value=${value})`, async function () {
            const { testTarget } = await _import<DummyConfig>();
            const error = 'Invalid schema (arg #2)';
            const schema = value as unknown as JSONSchemaType<DummyConfig>;
            const properties: Record<string, unknown>[] = [];

            await expect(testTarget(properties, schema)).to.be.rejectedWith(
                error,
            );
        });
    });

    it('should return a promise that resolves with an empty object if invoked with an empty array', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = [];

        const result = await testTarget(properties);
        expect(result).to.deep.equal({});
    });

    it('should map each record in the input array to a corresponding record in the output object', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = [
            { foo: 42 },
            { bar: 'baz' },
        ];

        const result = await testTarget(properties);
        expect(result).to.deep.equal({ foo: 42, bar: 'baz' });
    });

    it('should create nested objects for keys that contain dots', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = [
            { 'foo.bar.baz': 42, 'foo.chaz': 'chaz' },
            { 'foo.bar.qux': 'quux' },
        ];

        const result = await testTarget(properties);
        expect(result).to.deep.equal({
            foo: {
                chaz: 'chaz',
                bar: {
                    baz: 42,
                    qux: 'quux',
                },
            },
        });
    });

    it('should overwrite values for items that have the same keys', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = [
            { 'foo.bar.baz': 42, 'foo.chaz': 'chaz' },
            { 'foo.bar.qux': 'quux', 'foo.chaz': 'jazz' },
        ];

        const result = await testTarget(properties);
        expect(result).to.deep.equal({
            foo: {
                chaz: 'jazz',
                bar: {
                    baz: 42,
                    qux: 'quux',
                },
            },
        });
    });

    it('should not attempt coercion if no schema is provided', async function () {
        const { testTarget } = await _import<DummyConfigUncoerced>();
        const properties = createRawConfig();

        const result = await testTarget(properties);
        expect(result).to.deep.equal({
            cfg: {
                str: {
                    str: '42',
                    num: '42',
                    bool: 'false',
                    arr: '123',
                },
                num: {
                    str: 42,
                    num: 42,
                    bool: 0,
                    arr: 123,
                },
                bool: {
                    str: false,
                    num: false,
                    bool: false,
                    arr: true,
                },
                arr: {
                    str: ['foo'],
                    num: [42],
                    bool: [false],
                    arr: [123],
                },
            },
        });
    });

    it('should coerce values to the correct types if a schema is provided', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = createRawConfig();
        const schema: JSONSchemaType<DummyConfig> = createDummyConfigSchema();

        const result = await testTarget(properties, schema);

        expect(result).to.deep.equal({
            cfg: {
                str: {
                    str: '42',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
                num: {
                    str: '42',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
                bool: {
                    str: 'false',
                    num: 0,
                    bool: false,
                    arr: [1],
                },
                arr: {
                    str: 'foo',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
            },
        });
    });

    it('should remove additional properties from the object if the schema specifies it', async function () {
        const { testTarget } = await _import<DummyConfig>();
        const properties: Record<string, unknown>[] = createRawConfig();
        const schema: JSONSchemaType<DummyConfig> =
            createDummyConfigSchema(true);

        properties.push({ 'cfg.foo.bar': 1234 });
        properties.push({ 'cfg.foo.baz': 1234 });
        properties.push({ 'cfg.foo.quuz': 1234 });
        properties.push({ 'cfg.foo.chaz': 1234 });
        const result = await testTarget(properties, schema);

        expect(result).to.deep.equal({
            cfg: {
                str: {
                    str: '42',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
                num: {
                    str: '42',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
                bool: {
                    str: 'false',
                    num: 0,
                    bool: false,
                    arr: [1],
                },
                arr: {
                    str: 'foo',
                    num: 42,
                    bool: false,
                    arr: [123],
                },
            },
        });
    });
});
