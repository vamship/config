import { argValidator as _argValidator } from '@vamship/arg-utils';
import { ConfigLoader } from '../config.js';
import _camelCase from 'camelcase';

/**
 * Creates a loader functiont hat lodas configuration data from the environment
 * and returns it as a collection of key/value pairs.
 *
 * Environment variable names will be converted into camel case using the '_'
 * character as a separator. For example, an environment variable named
 * `CONNECTION_STRING` will be converted to `connectionString`.
 *
 * Additionally, double underscores will be converted to dots to indicate nested
 * properties. For example, an environment variable named
 * `DB__CONNECTION_STRING` will be converted to `db.connectionString`.
 *
 * @param [prefix=''] An optional prefix that will be used to filter environment
 * variables. Only environment variables that start with the prefix will be
 * included in the result. An empty prefix implies that all environment variables
 * will be included.
 *
 * @returns A promise that resolves with a collection of key/value pairs that
 * represent raw configuration data loaded from the environment.
 */
export function createEnvLoader(prefix = ''): ConfigLoader {
    if (typeof prefix !== 'undefined') {
        _argValidator.checkString(prefix, 0, 'Invalid prefix (arg #1)');
    }

    return async () =>
        Object.keys(process.env)
            .filter((key) => key.startsWith(prefix))
            .map((key) => {
                const newKey = key
                    .split('__')
                    .map((key) => _camelCase(key))
                    .join('.');
                return {
                    [newKey]: process.env[key],
                };
            });
}
