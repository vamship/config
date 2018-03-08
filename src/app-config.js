'use strict';

const { argValidator: _argValidator } = require('@vamship/arg-utils');
const _dp = require('dot-prop');

/**
 * Wrapper for an application configuration object, based on configuration data
 * passed as a constructor parameter. Exposes methods to allow queryig of data
 * using dot separated property names.
 *
 * <p>
 * This class is not meant to be instantiated directly, but will be returned
 * from a call to [config.getConfig]{@link module:config~getConfig()}.
 * </p>
 */
class AppConfig {
    /**
     * @param {Object} data Configuration data, represented as a simple
     *        javascript object.
     */
    constructor(data) {
        _argValidator.checkObject(data, 'Invalid configuration data (arg #1)');

        this._data = data;
    }

    /**
     * Returns the value of the requested configuration property. Properties
     * can be specified as dot separated strings to reference nested properties
     * within complicated object structures.
     *
     * @param {String} prop The name of the property to fetch. This value can
     *        be a dot separated string to idenfity a nested property value.
     *
     * @return {*} The value of the configuration property identified by the
     *         property name. If this property (or any of the properties in
     *         the dot separated value) is not found, undefined will be
     *         returned.
     */
    get(prop) {
        if (_dp.has(this._data, prop)) {
            return _dp.get(this._data, prop);
        }
    }
}

module.exports = AppConfig;
