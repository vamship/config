'use strict';

const _chai = require('chai');
_chai.use(require('sinon-chai'));
_chai.use(require('chai-as-promised'));
const expect = _chai.expect;

const _rewire = require('rewire');

const { argValidator: _argValidator } = require('@vamship/arg-utils');
const { testValues: _testValues } = require('@vamship/test-utils');
const { ArgError } = require('@vamship/error-types').args;

let AppConfig = null;

describe('AppConfig', function () {
    function _createConfig(data) {
        data = data || {};
        return new AppConfig(data);
    }

    beforeEach(() => {
        AppConfig = _rewire('../../src/app-config');
    });

    describe('ctor()', () => {
        it('should throw an error if invoked with invalid data', () => {
            const message = 'Invalid configuration data (arg #1)';
            const inputs = _testValues.allButObject();

            inputs.forEach((data) => {
                const wrapper = () => {
                    return new AppConfig(data);
                };
                expect(wrapper).to.throw(ArgError, message);
            });
        });

        it('should expose the expected properties and methods', () => {
            const config = new AppConfig({});

            expect(config).to.be.an.instanceof(AppConfig);
            expect(config.get).to.be.a('function');
        });
    });

    describe('get', () => {
        it('should return undefined if the property name is not valid', () => {
            const config = _createConfig({});
            const inputs = _testValues.allButString('');

            inputs.forEach((prop) => {
                expect(config.get(prop)).to.be.undefined;
            });
        });

        it('should return undefined if the specified property has not been defined in config', () => {
            const data = { foo: 'bar' };
            const config = _createConfig(data);

            for (let index = 0; index < 10; index++) {
                let prop = _testValues.getString('prop');

                expect(config.get(prop)).to.be.undefined;
            }
        });

        it('should use the lodash library (_.has, _.get methods) to lookup and return the appropriate config value', () => {
            const levels = ['', ''].map(() => {
                let inputs = _testValues.allButObject();
                return inputs.reduce((data, value) => {
                    const propName = _testValues.getString('prop');
                    data[propName] = value;
                    return data;
                }, {});
            });
            levels.reduce((result, value) => {
                if (result) {
                    const prop = _testValues.getString('child');
                    result[prop] = value;
                }
                return value;
            });
            const config = _createConfig(levels[0]);

            const doTest = (level, prefix) => {
                for (let propName in level) {
                    let expectedValue = level[propName];

                    let fullPropName = `${prefix}${propName}`;
                    let value = config.get(fullPropName);

                    expect(value).to.equal(expectedValue);
                    if (_argValidator.checkObject(expectedValue)) {
                        doTest(expectedValue, `${fullPropName}.`);
                    }
                }
            };

            doTest(levels[0], '');
        });
    });
});
