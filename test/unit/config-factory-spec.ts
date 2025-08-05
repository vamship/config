import { expect, use as _useWithChai } from 'chai';
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
import { stub } from 'sinon';
import _esmock from 'esmock';
import { JSONSchemaType } from 'ajv';

import { createNodeConfig } from '../../src/config-factory.js';
import { Config, ConfigLoader, ConfigParser } from '../../src/config.js';

describe('[configFactory]', function () {
    type EnvLoaderCreator = (prefix?: string) => ConfigLoader;

    type ImportResult<T> = {
        createNodeConfig: typeof createNodeConfig;

        configMock: ObjectMock<Config<T>>;
        createEnvLoaderMock: EnvLoaderCreator;
        dotParserMock: ConfigParser<T>;
        envLoaderMock: ConfigLoader;
    };

    async function _import<T>(): Promise<ImportResult<T>> {
        type ConfigFactoryModule<T> = {
            createNodeConfig: typeof createNodeConfig<T>;
        };

        const importHelper = new MockImportHelper<ConfigFactoryModule<T>>(
            'project://src/config-factory.js',
            {
                config: 'project://src/config.js',
                'env-loader': 'project://src/loaders/env-loader.js',
                'dot-parser': 'project://src/parsers/dot-parser.js',
            },
            import.meta.resolve('../../../working'),
        );

        const envLoader: ConfigLoader = stub();
        const createEnvLoader: EnvLoaderCreator = stub().returns(envLoader);
        const dotParser: ConfigParser<T> = stub();
        const configMock = new ObjectMock<Config<T>>();

        configMock.addMock('addLoader', () => configMock.instance);
        configMock.addMock('setParser', () => configMock.instance);
        configMock.addMock('setSchema', () => configMock.instance);

        importHelper.setMock('config', { Config: configMock.ctor });
        importHelper.setMock('env-loader', { createEnvLoader });
        importHelper.setMock('dot-parser', { dotParser });

        const targetModule = await _esmock(
            importHelper.importPath,
            importHelper.getLibs(),
            importHelper.getGlobals(),
        );

        return {
            createNodeConfig: targetModule.createNodeConfig,
            configMock,
            createEnvLoaderMock: createEnvLoader,
            dotParserMock: dotParser,
            envLoaderMock: envLoader,
        };
    }

    type DummyConfig = {
        dummy: string;
    };

    describe('createNodeConfig()', async function () {
        _testValues.allButSelected('undefined', 'object').forEach((value) => {
            it(`should throw an error if invoked without a valid schema (value=${value})`, async function () {
                const { createNodeConfig } = await _import<DummyConfig>();
                const error = 'Invalid schema (arg #1)';
                const schema = value as unknown as JSONSchemaType<DummyConfig>;
                const wrapper = () => createNodeConfig(schema);

                expect(wrapper).to.throw(error);
            });
        });

        it('should create a new instance of the Config class', async function () {
            const { createNodeConfig, configMock } =
                await _import<DummyConfig>();

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(configMock.ctor).to.not.have.been.called;

            createNodeConfig();

            expect(configMock.ctor).to.have.been.calledOnceWithExactly();
            //eslint-disable-next-line tsel/no-unused-expressions
            expect(configMock.ctor).to.have.been.calledWithNew;
        });

        it('should create a new env loader function', async function () {
            const { createNodeConfig, createEnvLoaderMock } =
                await _import<DummyConfig>();

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(createEnvLoaderMock).to.not.have.been.called;

            createNodeConfig();

            expect(createEnvLoaderMock).to.have.been.calledOnceWithExactly();
        });

        it('should add the env loader to the loader list', async function () {
            const { createNodeConfig, configMock, envLoaderMock } =
                await _import<DummyConfig>();
            const addLoaderMethod = configMock.mocks.addLoader;

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(addLoaderMethod.stub).to.not.have.been.called;

            createNodeConfig();

            expect(addLoaderMethod.stub).to.have.been.calledOnceWithExactly(
                envLoaderMock,
            );
        });

        it('should set the parser to the dotParser function', async function () {
            const { createNodeConfig, configMock, dotParserMock } =
                await _import<DummyConfig>();
            const setParserMethod = configMock.mocks.setParser;

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(setParserMethod.stub).to.not.have.been.called;

            createNodeConfig();

            expect(setParserMethod.stub).to.have.been.calledOnceWithExactly(
                dotParserMock,
            );
        });

        it('should set a schema object if one was specified', async function () {
            const { createNodeConfig, configMock } =
                await _import<DummyConfig>();
            const setSchemaMethod = configMock.mocks.setSchema;
            const schema = { type: 'object' } as JSONSchemaType<DummyConfig>;

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(setSchemaMethod.stub).to.not.have.been.called;

            createNodeConfig(schema);

            expect(setSchemaMethod.stub).to.have.been.calledOnceWithExactly(
                schema,
            );
        });

        it('should not set a schema object if one was not specified', async function () {
            const { createNodeConfig, configMock } =
                await _import<DummyConfig>();
            const setSchemaMethod = configMock.mocks.setSchema;
            const schema = undefined;

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(setSchemaMethod.stub).to.not.have.been.called;

            createNodeConfig(schema);

            //eslint-disable-next-line tsel/no-unused-expressions
            expect(setSchemaMethod.stub).to.not.have.been.called;
        });

        it('should return the resultant config object', async function () {
            const { createNodeConfig, configMock } =
                await _import<DummyConfig>();

            const ret = createNodeConfig();

            expect(ret).to.equal(configMock.instance);
        });
    });
});
