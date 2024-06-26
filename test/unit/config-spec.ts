import { expect, use as _useWithChai } from 'chai';
import { JSONSchemaType } from 'ajv';
import _chaiAsPromised from 'chai-as-promised';
import _sinonChai from 'sinon-chai';
import 'mocha';

_useWithChai(_sinonChai);
_useWithChai(_chaiAsPromised);

import {
    ObjectMock,
    MockImportHelper,
    testValues as _testValues,
} from '@vamship/test-utils';
import { schemaHelper } from '@vamship/arg-utils';
import { stub, SinonStub } from 'sinon';
import _esmock from 'esmock';

import { Config, ConfigLoader, ConfigParser } from '../../src/config.js';

describe('Config', function () {
    type ConfigPrivate<T> = {
        _loaders: ConfigLoader[];
        _parser: ConfigParser<T>;
        _schema?: JSONSchemaType<T>;
    };

    type DummyConfig = {
        key1: string;
        key2: string;
        key3: string;
    };

    type SchemaHelperModule = typeof schemaHelper;

    type ImportResult = {
        testTarget: typeof Config;
        schemaHelperMock: ObjectMock<SchemaHelperModule>;
        checkSchemaMock: SinonStub<unknown[], unknown[]>;
    };

    async function _import<T>(): Promise<ImportResult> {
        type ConfigModule<T> = {
            Config: Config<T>;
        };

        const importHelper = new MockImportHelper<ConfigModule<T>>(
            'project://src/config.js',
            {
                'arg-utils': '@vamship/arg-utils',
            },
            import.meta.resolve('../../../working'),
        );

        const checkSchemaMock = stub();
        const schemaHelperMock = new ObjectMock<SchemaHelperModule>().addMock(
            'createSchemaChecker',
            () => checkSchemaMock,
        );

        importHelper.setMock('arg-utils', {
            schemaHelper: schemaHelperMock.instance,
        });

        const targetModule = await _esmock(
            importHelper.importPath,
            importHelper.getLibs(),
            importHelper.getGlobals(),
        );

        return {
            testTarget: targetModule.Config,
            schemaHelperMock,
            checkSchemaMock,
        };
    }

    async function _createInstance<T>(): Promise<{
        instance: Config<T>;
        instancePrivate: ConfigPrivate<T>;
        schemaHelperMock: ObjectMock<SchemaHelperModule>;
        checkSchemaMock: SinonStub<unknown[], unknown[]>;
    }> {
        const { testTarget, schemaHelperMock, checkSchemaMock } =
            await _import();
        const instance = new testTarget<T>();

        return {
            instance,
            instancePrivate: instance as unknown as ConfigPrivate<T>,
            schemaHelperMock,
            checkSchemaMock,
        };
    }

    function _setParser<T>(
        instance: Config<T>,
        autoResolve = true,
    ): {
        parser: SinonStub<void[], T>;
    } {
        const parser = stub();
        if (autoResolve) {
            parser.resolves({} as T);
        }

        instance.setParser(parser);

        return { parser };
    }

    describe('ctor()', async function () {
        it('should return an instance initialized with defaults', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();

            expect(instance.isInitialized).to.be.false;
            expect(instancePrivate._loaders).to.deep.equal([]);
            expect(instancePrivate._parser).to.be.undefined;
            expect(instancePrivate._schema).to.be.undefined;
        });
    });

    describe('addLoader()', async function () {
        _testValues.allButFunction().forEach((value) => {
            it(`should throw an error if invoked with an invalid loader (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                const loader = value as unknown as ConfigLoader;
                const addToStart = undefined;
                const wrapper = () => instance.addLoader(loader, addToStart);
                const error = 'Invalid loader (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        _testValues.allButSelected('boolean', 'undefined').forEach((value) => {
            it(`should throw an error if a addToStart flag is specified but is invalid (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                const loader = async () => [];
                const addToStart = value as unknown as boolean;
                const wrapper = () => instance.addLoader(loader, addToStart);
                const error = 'Invalid addToStart flag (arg #2)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if called after initialization', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const loader = async () => [];
            const wrapper = () => instance.addLoader(loader);
            const error =
                'Cannot add loader after configuration is initialized';

            _setParser(instance);

            await instance.initialize();

            expect(wrapper).to.throw(error);
        });

        it('should add the loader to the end of the list of loaders (addToStart=undefined)', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();
            const loader = async () => [];
            const loader2 = async () => [];

            instance.addLoader(loader, undefined);
            expect(instancePrivate._loaders).to.deep.equal([loader]);

            instance.addLoader(loader2, undefined);
            expect(instancePrivate._loaders).to.deep.equal([loader, loader2]);
        });

        it('should add the loader to the end of the list of loaders (addToStart=false)', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();
            const loader = async () => [];
            const loader2 = async () => [];

            instance.addLoader(loader, false);
            expect(instancePrivate._loaders).to.deep.equal([loader]);

            instance.addLoader(loader2, false);
            expect(instancePrivate._loaders).to.deep.equal([loader, loader2]);
        });

        it('should add the loader to tne start of the list of loaders (addToStart=false)', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();
            const loader = async () => [];
            const loader2 = async () => [];

            instance.addLoader(loader, true);
            expect(instancePrivate._loaders).to.deep.equal([loader]);

            instance.addLoader(loader2, true);
            expect(instancePrivate._loaders).to.deep.equal([loader2, loader]);
        });

        it('should return the instance to support chaining', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const loader = async () => [];
            const result = instance.addLoader(loader);

            expect(result).to.equal(instance);
        });
    });

    describe('setParser()', async function () {
        _testValues.allButFunction().forEach((value) => {
            it(`should throw an error if invoked with an invalid parser (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                const parser = value as unknown as ConfigParser<DummyConfig>;
                const wrapper = () => instance.setParser(parser);
                const error = 'Invalid parser (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if called after initialization', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const parser = async () => ({} as DummyConfig);
            const wrapper = () => instance.setParser(parser);
            const error =
                'Cannot set parser after configuration is initialized';

            _setParser(instance);

            await instance.initialize();

            expect(wrapper).to.throw(error);
        });

        it('should update the current parser with the specified value', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();

            expect(instancePrivate._parser).to.be.undefined;

            const parser = async () => ({} as DummyConfig);
            instance.setParser(parser);
            expect(instancePrivate._parser).to.equal(parser);

            const newParser = async () => ({} as DummyConfig);
            instance.setParser(newParser);
            expect(instancePrivate._parser).to.deep.equal(newParser);
        });

        it('should return the instance to support chaining', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const parser = async () => ({} as DummyConfig);
            const result = instance.setParser(parser);

            expect(result).to.equal(instance);
        });
    });

    describe('setSchema()', async function () {
        _testValues.allButObject().forEach((value) => {
            it(`should throw an error if invoked with an invalid schema (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                const schema = value as unknown as JSONSchemaType<DummyConfig>;
                const wrapper = () => instance.setSchema(schema);
                const error = 'Invalid schema (arg #1)';

                expect(wrapper).to.throw(error);
            });
        });

        it('should throw an error if called after initialization', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            _setParser(instance);

            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;
            const wrapper = () => instance.setSchema(schema);
            const error =
                'Cannot set schema after configuration is initialized';

            await instance.initialize();

            expect(wrapper).to.throw(error);
        });

        it('should update the current schema with the specified value', async function () {
            const { instance, instancePrivate } =
                await _createInstance<DummyConfig>();

            expect(instancePrivate._schema).to.be.undefined;

            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;
            instance.setSchema(schema);
            expect(instancePrivate._schema).to.equal(schema);

            const newSchema = { type: 'object' } as JSONSchemaType<DummyConfig>;
            instance.setSchema(newSchema);
            expect(instancePrivate._schema).to.deep.equal(newSchema);
        });

        it('should return the instance to support chaining', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;
            const result = instance.setSchema(schema);

            expect(result).to.equal(instance);
        });
    });

    describe('data', async function () {
        it('should throw an error if accessed before initialization', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const wrapper = () => instance.data;
            const error =
                'Cannot access data before configuration is initialized';

            expect(wrapper).to.throw(error);
        });

        it('should return an empty object if initialized with no data', async function () {
            const { instance } = await _createInstance<DummyConfig>();

            instance.setParser(async () => ({} as DummyConfig));

            await instance.initialize();

            expect(instance.data).to.deep.equal({});
        });
    });

    describe('initialize()', async function () {
        function _addLoaders<T>(
            instance: Config<T>,
            count = 3,
            autoResolve = true,
        ): {
            loaders: SinonStub<void[], unknown[]>[];
        } {
            const loaders = new Array(count).fill(0).map(() => stub());

            if (autoResolve) {
                loaders.forEach((loader) => loader.resolves([]));
            }

            loaders.forEach((loader) => instance.addLoader(loader));

            return { loaders };
        }

        it('should reject the promize if a parser has not been set', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const error = 'Cannot initialize config - parser has not been set';

            await expect(instance.initialize()).to.be.rejectedWith(error);
        });

        it('should set the initialized flag to true', async function () {
            const { testTarget } = await _import();
            const instance = new testTarget<DummyConfig>();

            _setParser(instance);

            await instance.initialize();
            expect(instance.isInitialized).to.be.true;
        });

        it('should invoke each loader in the order they were added', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const { loaders } = _addLoaders(instance, 3);

            _setParser(instance);

            loaders.forEach((loader) => expect(loader).to.not.have.been.called);

            await instance.initialize();

            loaders.forEach((loader) => {
                expect(loader).to.have.been.calledWithExactly();
                expect(loader.callCount).to.equal(1);
            });
        });

        it('should throw an error if any loader fails', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const { loaders } = _addLoaders(instance, 3, false);
            const error = 'Loader failed';

            _setParser(instance);

            const failIndex = _testValues.getNumber(0, loaders.length - 1);

            loaders.forEach((loader, index) => {
                index === failIndex
                    ? loader.rejects(new Error(error))
                    : loader.resolves([]);
            });

            await expect(instance.initialize()).to.be.rejectedWith(error);
        });

        _testValues.allButArray().forEach((value) => {
            it(`should throw an error if the loader returns a non-array value (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                const { loaders } = _addLoaders(instance, 3, false);
                const error =
                    'Invalid config data received from loader.' +
                    'The loader must return an array of key/value pairs';

                _setParser(instance);

                const failIndex = _testValues.getNumber(0, loaders.length - 1);

                loaders.forEach((loader, index) => {
                    index === failIndex
                        ? loader.resolves(value)
                        : loader.resolves([]);
                });

                await expect(instance.initialize()).to.be.rejectedWith(error);
            });
        });

        it('should invoke the parser with the data returned by the loaders', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const configValues = [
                {
                    key1: 'value1',
                },
                {
                    key2: 'value2',
                },
                {
                    key3: 'value3',
                },
            ];
            const { loaders } = _addLoaders(instance, 3, false);
            const { parser } = _setParser(instance);
            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;

            instance.setSchema(schema);

            loaders.forEach((loader, index) =>
                loader.resolves([configValues[index]]),
            );

            expect(parser).to.not.have.been.called;

            await instance.initialize();

            expect(parser).to.have.been.calledOnce;
            expect(parser.firstCall.args).to.deep.equal([configValues, schema]);
        });

        it('should fail if the parser throws an error', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const error = 'Parser failed';

            _addLoaders(instance, 3);
            _setParser(instance);

            instance.setParser(async () => {
                throw new Error(error);
            });

            await expect(instance.initialize()).to.be.rejectedWith(error);
        });

        _testValues.allButObject().forEach((value) => {
            it(`should throw an error if the parser returns a non-object value (value=${value})`, async function () {
                const { instance } = await _createInstance<DummyConfig>();
                _addLoaders(instance, 3);
                const { parser } = _setParser(instance, false);
                const error =
                    'Invalid config data returned by parser. ' +
                    'The parser must return an object';

                parser.resolves(value);

                await expect(instance.initialize()).to.be.rejectedWith(error);
            });
        });

        it('should skip schema validation if no schema is set', async function () {
            const { instance, schemaHelperMock, checkSchemaMock } =
                await _createInstance<DummyConfig>();

            _addLoaders(instance, 3);
            _setParser(instance);

            const createSchemaCheckerMock =
                schemaHelperMock.mocks.createSchemaChecker;

            expect(createSchemaCheckerMock.stub).to.not.have.been.called;
            expect(checkSchemaMock).to.not.have.been.called;

            await instance.initialize();

            expect(createSchemaCheckerMock.stub).to.not.have.been.called;
            expect(checkSchemaMock).to.not.have.been.called;
        });

        it('should validate the parsed data against the schema if a schema is set', async function () {
            const { instance, schemaHelperMock, checkSchemaMock } =
                await _createInstance<DummyConfig>();
            const configData = {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3',
            };
            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;
            const errorMessage = 'Error validating config schema';

            _addLoaders(instance, 3);
            const { parser } = _setParser(instance, false);

            parser.resolves(configData);

            instance.setSchema(schema);

            const createSchemaCheckerMock =
                schemaHelperMock.mocks.createSchemaChecker;

            expect(createSchemaCheckerMock.stub).to.not.have.been.called;
            expect(checkSchemaMock).to.not.have.been.called;

            await instance.initialize();

            expect(
                createSchemaCheckerMock.stub,
            ).to.have.been.calledOnceWithExactly(schema, errorMessage);
            expect(checkSchemaMock).to.have.been.calledOnceWithExactly(
                configData,
                true,
            );
        });

        it('should set the data property to the value returned by the parser', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const configData = {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3',
            };
            const { parser } = _setParser(instance, false);

            _addLoaders(instance, 3);
            parser.resolves(configData);

            await instance.initialize();

            expect(instance.data).to.deep.equal(configData);
        });

        it('should set the initialized flag to true', async function () {
            const { testTarget } = await _import();
            const instance = new testTarget<DummyConfig>();

            _setParser(instance);

            await instance.initialize();
            expect(instance.isInitialized).to.be.true;
        });

        it('should return the config instance', async function () {
            const { testTarget } = await _import();
            const instance = new testTarget<DummyConfig>();

            _setParser(instance);

            const ret = await instance.initialize();

            expect(ret).to.equal(instance);
        });

        it('should do nothing if the instance is already initialized', async function () {
            const { instance } = await _createInstance<DummyConfig>();
            const { loaders } = _addLoaders(instance, 3);

            _setParser(instance);

            loaders.forEach((loader) => expect(loader).to.not.have.been.called);

            let ret = await instance.initialize();

            loaders.forEach((loader) => {
                expect(loader).to.have.been.calledWithExactly();
                expect(loader.callCount).to.equal(1);
            });

            expect(ret).to.equal(instance);

            // Second invocation
            ret = await instance.initialize();

            loaders.forEach((loader) => {
                expect(loader).to.have.been.calledWithExactly();
                expect(loader.callCount).to.equal(1);
            });

            expect(ret).to.equal(instance);
        });
    });
});
