import { argValidator as _argValidator } from '@vamship/arg-utils';
import { JSONSchemaType } from 'ajv';
import { getProperty, setProperty, hasProperty } from 'dot-prop';
import { Ajv } from 'ajv';

/**
 * Parser implementation that takes a collection of properties and merges them
 * into a single object. The collection must be an object containing zero or
 * more key-value pairs.
 *
 * Keys can be provided as dot separated strings to indicate nested properties.
 * For example `{ "foo.bar.baz": 42 }` will be merged into
 * `{ foo: { bar: { baz: 42 } } }`.
 *
 * There can be duplicate keys in the coillction, in which case the last value
 * will be used. For example `[{ foo: 42 }, {foo: 43 }]` will be merged into
 * `{ foo: 43 }`.
 *
 * The parser will also attempt to coerce values into their correct types if a
 * schema is specified. Coercion rules will follow those defined by
 * [ajv](https://ajv.js.org/guide/modifying-data.html#coercing-data-types)
 *
 * @param properties A collection of key/value pairs that represent raw key
 * value pairs that need to be parsed into a config object.
 *
 * @param schema An optional JSON schema that defines the structure of the
 * expected config object. If provided, the parser will attempt to coerce values
 * into the correct types as defined by the schema, but will ignore any schema
 * validation errors.
 *
 * @returns A promise that resolves with the parsed config object.
 */
export async function dotParser<T>(
    properties: Record<string, unknown>[],
    schema?: JSONSchemaType<T>,
): Promise<T> {
    if (!_argValidator.checkArray(properties)) {
        throw new Error('Invalid config properties (arg #1)');
    }
    if (typeof schema !== 'undefined') {
        _argValidator.checkObject(schema, 'Invalid schema (arg #2)');
    }

    const config = properties.reduce((result, record) => {
        for (const key in record) {
            setProperty(result, key, record[key]);
        }
        return result;
    }, {});

    if (typeof schema !== 'undefined') {
        const ajv = new Ajv({ coerceTypes: 'array', removeAdditional: true });
        ajv.compile(schema)(config) as T;
    }
    return config as T;
}
