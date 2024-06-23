import {
    argValidator as _argValidator,
    schemaHelper as _schemaHelper,
} from '@vamship/arg-utils';
import { JSONSchemaType } from 'ajv';

/**
 * Loader function that loads configuration data from a source and returns it as
 * collection of key/value pairs.
 *
 * @returns A promise that resolves with a collection of key/value pairs that
 * represent raw configuration data loaded from a source.
 */
export type ConfigLoader = () => Promise<Record<string, unknown>[]>;

/**
 * Parser function that takes a collection of key/value pairs and returns a
 * config object of a specific type.
 *
 * @param T The type of the config object that the parser function will return.
 * @param properties A collection of key/value pairs that represent raw
 * configuration data loaded by the loader.
 *
 * @returns A promise that resolves when the parser has completed parsing raw
 * configuration data and populating the config object.
 */
export type ConfigParser<T> = (
    properties: Record<string, unknown>[],
    schema?: JSONSchemaType<T>,
) => Promise<T>;

/**
 * Represents the configuration settings for the application.
 */
export class Config<T> {
    private _isInitialized: boolean;
    private _config?: T;
    private _loaders: ConfigLoader[];
    private _parser?: ConfigParser<T>;
    private _schema?: JSONSchemaType<T>;

    /**
     * Initializes the configuration object with default properties.
     */
    constructor() {
        this._isInitialized = false;
        this._loaders = [];
        this._parser = undefined;
        this._config = undefined;
        this._schema = undefined;
    }

    /**
     * Initializes the application configuration, running it through a series of
     * steps including - loading properties, parsing values, and validating the
     * final set of properties.
     */
    async initialize(): Promise<void> {
        if (this._isInitialized) {
            return;
        }

        if (typeof this._parser === 'undefined') {
            throw new Error(
                'Cannot initialize config - parser has not been set',
            );
        }

        const parser: ConfigParser<T> = this._parser;

        // Load config data
        const configValues: Record<string, unknown>[] = [];
        for (const loader of this._loaders) {
            const values = await loader();
            _argValidator.checkArray(
                values,
                new Error(
                    'Invalid config data received from loader.' +
                        'The loader must return an array of key/value pairs',
                ),
            );
            values.forEach((value) => configValues.push(value));
        }

        // Parse config data
        const config = await parser(configValues, this._schema);
        _argValidator.checkObject(
            config,
            new Error(
                'Invalid config data returned by parser. ' +
                    'The parser must return an object',
            ),
        );

        // Validate config data against schema
        if (typeof this._schema !== 'undefined') {
            const checker = _schemaHelper.createSchemaChecker(
                this._schema,
                'Error validating config schema',
            );
            checker(config, true);
        }

        // Set config data as an accessible property
        this._config = config;
        this._isInitialized = true;
    }

    /**
     * Adds a loader function to the configuration object.
     *
     * @param loader A loader function that loads configuration data from some
     * source and returns it as a collection of key/value pairs.
     *
     * @returns A reference to the current configuration object, allowing for
     * chaining of method calls.
     */
    addLoader(loader: ConfigLoader): Config<T> {
        _argValidator.checkFunction(loader, 'Invalid loader (arg #1)');
        if (this._isInitialized) {
            throw new Error(
                'Cannot add loader after configuration is initialized',
            );
        }
        this._loaders.push(loader);

        return this;
    }

    /**
     * Sets the parser for the configuration object.
     *
     * @param parser A parser function that accepts a collection of key value
     * pairs and populates a config data object.
     *
     * @returns A reference to the current configuration object, allowing for
     * chaining of method calls.
     */
    setParser(parser: ConfigParser<T>): Config<T> {
        _argValidator.checkFunction(parser, 'Invalid parser (arg #1)');
        if (this._isInitialized) {
            throw new Error(
                'Cannot set parser after configuration is initialized',
            );
        }
        this._parser = parser;

        return this;
    }

    /**
     * Sets the schema for the configuration object.
     *
     * @param schema A JSON schema that describes the expected structure of the
     * config object.
     *
     * @returns A reference to the current configuration object, allowing for
     * chaining of method calls.
     */
    setSchema(schema: JSONSchemaType<T>): Config<T> {
        _argValidator.checkObject(schema, 'Invalid schema (arg #1)');
        if (this._isInitialized) {
            throw new Error(
                'Cannot set schema after configuration is initialized',
            );
        }
        this._schema = schema;

        return this;
    }

    /**
     * Determines whether or not the configuration object has been
     * initialized. Values cannot be read from the configuration object until
     * it has been initialized.
     */
    get isInitialized(): boolean {
        return this._isInitialized;
    }

    /**
     * Returns the configuration object for the application.
     */
    get data(): T {
        if (!this._isInitialized) {
            throw new Error(
                'Cannot access data before configuration is initialized',
            );
        }
        return this._config as T;
    }
}
