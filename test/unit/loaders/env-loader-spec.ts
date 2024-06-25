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

import { ConfigLoader } from '../../../src/config';
import { createEnvLoader } from '../../../src/loaders/env-loader.js';

describe('createEnvLoader()', function () {
    type ImportResult = {
        testTarget: (prefix?: string) => ConfigLoader;
    };

    async function _import(): Promise<ImportResult> {
        type LoaderModule = {
            createEnvLoader: (prefix?: string) => ConfigLoader;
        };

        const importHelper = new MockImportHelper<LoaderModule>(
            'project://src/loaders/env-loader.js',
            {},
            import.meta.resolve('../../../../working'),
        );

        const targetModule = await _esmock(
            importHelper.importPath,
            importHelper.getLibs(),
            importHelper.getGlobals(),
        );

        return {
            testTarget: targetModule.createEnvLoader,
        };
    }

    _testValues.allButSelected('string', 'undefined').forEach((value) => {
        it(`should throw an error if a prefix is specified but is invalid (value=${value})`, async function () {
            const { testTarget } = await _import();
            const error = 'Invalid prefix (arg #1)';
            const prefix = value as unknown as string;
            const wrapper = () => testTarget(prefix);

            expect(wrapper).to.throw(error);
        });
    });

    it('should return a function when invoked without a prefix', async function () {
        const { testTarget } = await _import();
        const loader = testTarget();

        expect(loader).to.be.a('function');
    });

    ['', 'foo', 'bar'].forEach((value) => {
        it(`should return a function when invoked with a valid prefix (value=${value})`, async function () {
            const { testTarget } = await _import();
            const loader = testTarget();
            const prefix = value as unknown as string;

            expect(loader).to.be.a('function');
        });
    });

    describe('[loader]', function () {
        let _savedEnv: { [key: string]: string | undefined };

        async function _getLoader(
            prefix = '',
            env: { [key: string]: string | undefined } = {},
        ): Promise<ConfigLoader> {
            process.env = env;
            const { testTarget } = await _import();
            return testTarget(prefix);
        }

        beforeEach(function () {
            _savedEnv = process.env;
        });

        afterEach(function () {
            process.env = _savedEnv;
        });

        it('should return an empty array when no environment variables are set', async function () {
            const loader = await _getLoader(undefined, {});
            const result = await loader();

            expect(result).to.be.an('array').with.length(0);
        });

        it('should return an empty array when no environment variables match the prefix', async function () {
            const loader = await _getLoader('FOO', {
                BAR_VALUE: 'bar',
                BAZ_VALUE: 'baz',
            });
            const result = await loader();

            expect(result).to.be.an('array').with.length(0);
        });

        it('should return an array of key/value pairs for matching environment variables', async function () {
            const loader = await _getLoader('FOO', {
                FOO_CONFIG_KEY_1: 'bar',
                FOO_CONFIG_KEY_2: 'baz',
                BAR_VALUE: '1234',
                BAZ_VALUE: '1234',
                QUUZ_VALUE: '1234',
            });
            const result = await loader();

            expect(result).to.be.an('array').with.length(2);
            expect(result).to.deep.include({ fooConfigKey1: 'bar' });
            expect(result).to.deep.include({ fooConfigKey2: 'baz' });
        });

        it('should match all environment variables if the prefix is an empty string', async function () {
            const loader = await _getLoader('', {
                FOO_CONFIG_KEY_1: 'bar',
                FOO_CONFIG_KEY_2: 'baz',
                BAR_VALUE: '1234',
                BAZ_VALUE: '1234',
                QUUZ_VALUE: '1234',
            });
            const result = await loader();

            expect(result).to.be.an('array').with.length(5);
            expect(result).to.deep.include({ fooConfigKey1: 'bar' });
            expect(result).to.deep.include({ fooConfigKey2: 'baz' });
            expect(result).to.deep.include({ barValue: '1234' });
            expect(result).to.deep.include({ bazValue: '1234' });
            expect(result).to.deep.include({ quuzValue: '1234' });
        });

        it('should use dots to separate keys when double underscores are present', async function () {
            const loader = await _getLoader('FOO', {
                FOO__CONFIG_KEY_1: 'bar',
                FOO__CONFIG_KEY_2: 'baz',
                BAR_VALUE: '1234',
                BAZ_VALUE: '1234',
                QUUZ_VALUE: '1234',
            });
            const result = await loader();

            expect(result).to.be.an('array').with.length(2);
            expect(result).to.deep.include({ 'foo.configKey1': 'bar' });
            expect(result).to.deep.include({ 'foo.configKey2': 'baz' });
        });
    });
});
