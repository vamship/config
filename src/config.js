'use strict';

const { argValidator: _argValidator } = require('@vamship/arg-utils');
const _rc = require('rc');
const { deepDefaults } = require('./deep-defaults');
const AppConfig = require('./app-config');

const DEFAULT_APP_SCOPE = 'default';
const _configCache = {};
let _applicationScope = DEFAULT_APP_SCOPE;
let _config = {};
let _isInitialized = false;

/**
 * Utility module that allows the initialization and loading of an environment
 * specific application configuration. Environments refer to strings that
 * logically distinguish between multiple execution contexts. These could
 * be the traditional <strong>'dev'</strong>, <strong>'qa'</strong>, and
 * <strong>'prod'</strong> identifiers, or could be an identifier for a
 * specific version (when mulitple concurrent versions of an app are supported).
 * The meaning of these environment strings are left to the end user.
 *
 * <p>
 * The Current implementation of this module uses the
 * [rc package]{@link https://www.npmjs.com/package/rc} to load configuration,
 * and supports configuration values in files and environment variables.
 * </p>
 *
 * @example
 * <caption>
 * Application configuration stored in files must have the following structure:
 * </caption>
 *
 * {
 *    "default": {
 *      // Default application configuration goes here. These values will
 *      // be used if no environment specific values are provided
 *      "host": "dev.example.com",
 *      "log": {
 *        "level": "error"
 *      }
 *    },
 *    "dev": {
 *      // Overrides specific to the environment "dev" can be specified here
 *      "log": {
 *        "level": "debug"
 *      }
 *    },
 *    "prod": {
 *      // Overrides specific to the environment "prod" can be specified here
 *      "host": "prod.example.com"
 *    }
 * }
 *
 * @example
 * <caption>
 * If environment variables are used to specify config values, they must be
 * named as follows, assuming that the application is called "myApp". For more
 * information, see the
 * [rc standards]{@link https://www.npmjs.com/package/rc#standards}
 * documentation.
 * </caption>
 *
 * export myApp_default__host='dev.example.com'
 * export myApp_default__log__level='info'
 * export myApp_dev__log__level='debug'
 * export myApp_prod__host='prod.example.com'
 *
 * @module config
 */
module.exports = {
    /**
     * Configures global configuration settings, include application name, and
     * initial default values for the configuration. This method must be invoked
     * before any calls to
     * [getConfig()]{@link module:config.getConfig} in order to ensure that
     * configuration objects are configured correctly.
     *
     * <p>
     * Note that invoking this method multiple times could change the reference
     * to the config object returned via a call to the
     * [getConfig()]{@link module:config.getConfig} method.
     * </p>
     *
     * @param {String} name The application name to use when loading up the
     *        configuration data. See
     *        [rc standards]{@link https://www.npmjs.com/package/rc#standards}
     *        for more information on the naming and placement of application
     *        configuration files.
     * @param {Object} [defaults={}] The default configuration properties to
     *        initialize the config with.
     *
     * @return {module:config} A reference to the current module, allowing for
     *         chaining of method calls.
     */
    configure: function (name, defaults) {
        _argValidator.checkString(name, 1, 'Invalid appName (arg #1)');
        if (!_argValidator.checkObject(defaults)) {
            defaults = {};
        }

        if (!_isInitialized) {
            _config = _rc(name, defaults);
            _isInitialized = true;
        }

        // Reference to the current module.
        return module.exports;
    },

    /**
     * Returns the current default scope for the application. This represents
     * the default scope value that will be used in calls to
     * [getConfig()]{@link module:config.getConfig}. If not explicitly
     * overridden, this method will always return "default".
     *
     * @return {String} The default scope that the config object will use.
     */
    getApplicationScope: function (scope) {
        return _applicationScope;
    },

    /**
     * Sets the scope for the application. This value will be used as the
     * default arg for
     * [getConfig()]{@link module:config.getConfig}. If this method is never
     * invoked, the value of the default scope will be "default".
     *
     * @param {String} scope The default scope to assign to the config.
     *
     * @return {module:config} A reference to the current module, allowing for
     *         chaining of method calls.
     */
    setApplicationScope: function (scope) {
        _argValidator.checkString(scope, 1, 'Invalid scope (arg #1)');
        _applicationScope = scope;
        return module.exports;
    },

    /**
     * Returns a configuration object that is scoped to a specific environment.
     * This configuration object will return default application configuration
     * properties, overridden by environment speicific values.
     *
     * @param {String} [scope=<default scope>] The name of the environment for
     *        which the application configuration object will be returned.  If
     *        omitted, this value will be defaulted to the environment
     *        set by invoking
     *        [setAppScope()]{@link module:config.setAppScope}. If this
     *        method was never invoked, the default scope is "default".
     *
     * @return {AppConfig} A configuration object that can be used to query for
     *         configuration parameters.
     */
    getConfig: function (scope) {
        if (!_argValidator.checkString(scope)) {
            scope = _applicationScope;
        }

        let config = _configCache[scope];
        if (!config) {
            const data = deepDefaults(
                deepDefaults({}, _config[scope]),
                _config.default
            );
            config = new AppConfig(data);
            if (_isInitialized) {
                _configCache[scope] = config;
            }
        }

        return config;
    },
};
