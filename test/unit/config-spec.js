'use strict';

const _sinon = require('sinon');
const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _rewire = require('rewire');
const { testValues: _testValues } = require('@vamship/test-utils');

const { ArgError } = require('@vamship/error-types').args;
const AppConfig = require('../../src/app-config');

let _config = null;

describe('config', function () {
    const DEFAULT_SCOPE = 'default';
    let AppConfigMock = null;
    let _rcMock = null;

    beforeEach(() => {
        AppConfigMock = _sinon.stub().callsFake((data) => {
            data = data || {};
            AppConfigMock._instance = new AppConfig(data);
            return AppConfigMock._instance;
        });
        _rcMock = _sinon.stub().callsFake((name, defaults) => {
            return _rcMock._config || defaults;
        });

        _config = _rewire('../../src/config');
        _config.__set__('AppConfig', AppConfigMock);
        _config.__set__('_rc', _rcMock);

        //Reset the initialized flag and default scope
        _config.__set__('_isInitialized', false);
        _config.__set__('_configCache', {});
        _config.__set__('_applicationScope', DEFAULT_SCOPE);
    });

    describe('[init]', () => {
        it('should expose the necessary fields and methods', () => {
            expect(_config.configure).to.be.a('function');
            expect(_config.getApplicationScope).to.be.a('function');
            expect(_config.setApplicationScope).to.be.a('function');
            expect(_config.getConfig).to.be.a('function');
        });
    });

    describe('configure()', () => {
        it('should throw an error if invoked without a valid app name', () => {
            const message = 'Invalid appName (arg #1)';
            _testValues.allButString('').forEach((appName) => {
                const wrapper = () => {
                    _config.configure(appName);
                };

                expect(wrapper).to.throw(ArgError, message);
            });
        });

        it('should return a reference to the config module when invoked', () => {
            const appName = _testValues.getString('appName');
            const ret = _config.configure(appName, {});

            expect(ret).to.equal(_config);
        });

        it('should initialize the config object with the correct parameters', () => {
            const appName = _testValues.getString('appName');
            const defaults = { prop: _testValues.getString('prop') };

            expect(_rcMock).to.not.have.been.called;

            _config.configure(appName, defaults);

            expect(_rcMock).to.have.been.calledOnce;
            expect(_rcMock.args[0][0]).to.equal(appName);
            expect(_rcMock.args[0][1]).to.deep.equal(defaults);
        });

        it('should initialize the config an empty defaults if defaults are not specified', () => {
            const inputs = _testValues.allButObject();

            inputs.forEach((defaults, index) => {
                const appName = _testValues.getString('appName');
                _config.configure(appName, defaults);
                expect(_rcMock.args[index][1]).to.deep.equal({});

                //Reset the initialized flag
                _config.__set__('_isInitialized', false);
            });
        });

        it('should have no impact if invoked multiple times', () => {
            let appName = _testValues.getString('appName');
            _config.configure(appName);

            for (let index = 0; index < 10; index++) {
                _rcMock.resetHistory();
                appName = _testValues.getString('appName');
                _config.configure(appName);

                expect(_rcMock).to.not.have.been.called;
            }
        });
    });

    describe('getApplicationScope()', () => {
        it('should return "default" if the scope has not been overridden', () => {
            const scope = _config.getApplicationScope();

            expect(scope).to.equal(DEFAULT_SCOPE);
        });

        it('should return the value of the current default scope', () => {
            const expectedScope = _testValues.getString('defaultScope');

            //NOTE: setting private variable.
            _config.__set__('_applicationScope', expectedScope);

            const scope = _config.getApplicationScope();
            expect(scope).to.equal(expectedScope);
        });
    });

    describe('setApplicationScope()', () => {
        it('should throw an error if invoked without a valid scope', () => {
            const message = 'Invalid scope (arg #1)';
            const inputs = _testValues.allButString('');

            inputs.forEach((scope) => {
                const wrapper = () => {
                    return _config.setApplicationScope(scope);
                };

                expect(wrapper).to.throw(ArgError, message);
            });
        });

        it('should return a reference to the config module when invoked', () => {
            const appName = _testValues.getString('appName');
            const ret = _config.setApplicationScope(appName);

            expect(ret).to.equal(_config);
        });

        it('should set the default scope for configs if a valid scope is specified', () => {
            const expectedScope = _testValues.getString('defaultScope');

            // NOTE: querying private variable
            let scope = _config.__get__('_applicationScope');

            expect(scope).to.not.equal(expectedScope);

            _config.setApplicationScope(expectedScope);

            // NOTE: querying private variable
            scope = _config.__get__('_applicationScope');
            expect(scope).to.equal(expectedScope);
        });
    });

    describe('getConfig()', () => {
        it('should return a config with no data if config has not been configured', () => {
            const dummyScope = _testValues.getString('scope');
            const inputs = _testValues.allButString(dummyScope);

            inputs.forEach((scope) => {
                expect(AppConfigMock).to.not.have.been.called;

                const config = _config.getConfig(scope);

                expect(config).to.equal(AppConfigMock._instance);
                expect(AppConfigMock).to.have.been.calledOnce;
                expect(AppConfigMock).to.have.been.calledWithNew;
                expect(AppConfigMock.args[0][0]).to.deep.equal({});

                AppConfigMock.resetHistory();
                _config.__set__('_configCache', {});
            });
        });

        it('should return a config with no data if configuration is empty', () => {
            const appName = _testValues.getString('appName');
            _config.configure(appName, {});

            expect(AppConfigMock).to.not.have.been.called;

            const scope = _testValues.getString('scope');
            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal({});
        });

        it('should return the default configuration if the specified scope is "default"', () => {
            const appName = _testValues.getString('appName');
            const defaultConfig = {
                foo: 'bar',
            };
            _config.configure(appName, { default: defaultConfig });

            expect(AppConfigMock).to.not.have.been.called;

            const scope = 'default';
            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal(defaultConfig);
        });

        it('should return the default configuration if the specified scope does not exist', () => {
            const appName = _testValues.getString('appName');
            const defaultConfig = {
                foo: 'bar',
            };
            _config.configure(appName, { default: defaultConfig });

            expect(AppConfigMock).to.not.have.been.called;

            const scope = _testValues.getString('scope');
            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal(defaultConfig);
        });

        it('should override the default object with scope specific values if present', () => {
            const appName = _testValues.getString('appName');
            const scope = _testValues.getString('scope');

            const defaults = {
                default: {
                    foo: 'bar',
                    baz: 'chaz',
                },
                [scope]: {
                    xyz: 123,
                    baz: 'faz',
                },
            };
            const expectedConfig = {
                foo: 'bar',
                xyz: 123,
                baz: 'faz',
            };

            _config.configure(appName, defaults);

            expect(AppConfigMock).to.not.have.been.called;

            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal(expectedConfig);
        });

        it('should use the application scope if the input scope is not a valid string', () => {
            const appName = _testValues.getString('appName');
            const scope = _testValues.getString('scope');
            const defaults = {
                default: {
                    foo: 'bar',
                    baz: 'chaz',
                },
                [scope]: {
                    xyz: 123,
                    baz: 'faz',
                },
            };
            const expectedConfig = {
                foo: 'bar',
                xyz: 123,
                baz: 'faz',
            };
            _config.configure(appName, defaults);
            _config.setApplicationScope(scope);
            const inputs = _testValues.allButString('');

            inputs.forEach((inputScope) => {
                expect(AppConfigMock).to.not.have.been.called;

                const config = _config.getConfig(inputScope);

                expect(config).to.equal(AppConfigMock._instance);
                expect(AppConfigMock).to.have.been.calledOnce;
                expect(AppConfigMock).to.have.been.calledWithNew;
                expect(AppConfigMock.args[0][0]).to.deep.equal(expectedConfig);

                AppConfigMock.resetHistory();
                _config.__set__('_configCache', {});
            });
        });

        it('should cache and reuse scope specific configs if config has been initialized', () => {
            const appName = _testValues.getString('appName');
            const scope = _testValues.getString('scope');

            const defaults = {
                default: {
                    foo: 'bar',
                    baz: 'chaz',
                },
                [scope]: {
                    xyz: 123,
                    baz: 'faz',
                },
            };
            const expectedConfig = {
                foo: 'bar',
                xyz: 123,
                baz: 'faz',
            };

            _config.configure(appName, defaults);

            expect(AppConfigMock).to.not.have.been.called;

            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal(expectedConfig);

            const newConfig = _config.getConfig(scope);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(newConfig).to.equal(config);
        });

        it('should perform no caching if the config has not been initialized', () => {
            const scope = _testValues.getString('scope');

            expect(AppConfigMock).to.not.have.been.called;

            const config = _config.getConfig(scope);

            expect(config).to.equal(AppConfigMock._instance);
            expect(AppConfigMock).to.have.been.calledOnce;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[0][0]).to.deep.equal({});

            const newConfig = _config.getConfig(scope);

            expect(newConfig).to.not.equal(config);
            expect(AppConfigMock).to.have.been.calledTwice;
            expect(AppConfigMock).to.have.been.calledWithNew;
            expect(AppConfigMock.args[1][0]).to.deep.equal({});
        });
    });
});
