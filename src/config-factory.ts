import { Config } from './config.js';
import { createEnvLoader } from './loaders/env-loader.js';
import { dotParser } from './parsers/dot-parser.js';
import { JSONSchemaType } from 'ajv';
import { argValidator as _argValidator } from '@vamship/arg-utils';

/**
 * Factory method that initializes a default config object, using a loader for
 * environment variables and a parser for dot notation.
 */
export function createNodeConfig<T>(schema?: JSONSchemaType<T>): Config<T> {
    if (typeof schema !== 'undefined') {
        _argValidator.checkObject(schema, 'Invalid schema (arg #1)');
    }
    const config = new Config<T>()
        .addLoader(createEnvLoader())
        .setParser(dotParser);

    if (typeof schema !== 'undefined') {
        config.setSchema(schema);
    }

    return config;
}
