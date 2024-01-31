# @vamship/config

> [!CAUTION]
> This package is no longer maintained. Please consider using an alternative
> such as node-config

_Singleton module for configuration and initialization of application wide
configuration objects._

This library does not actually provide logging functionality, but merely
abstracts the configuration and creation of application wide config objects.
Actual logging functionality is provided by
[rc](https://www.npmjs.com/package/rc)

## API Documentation

API documentation can be found [here](https://vamship.github.io/config).

## Motivation

Using configuration files to avoid hard coding parameters is a well understood
practice. Most applications leverage configuration files to store values
specific to certain execution environments (ex: dev, qa, prod, etc.), allowing
the code to be environment agnostic.

There are several good libraries available for working with configuration files,
such as: [rc](https://www.npmjs.com/package/rc) and
[config](https://www.npmjs.com/package/config), some of which even support
multiple execution environments, albeit with some drawbacks (like dependency on
a NODE_ENV variable, for example).

This library is does not reimplement functionality already provided by these
libraries. Instead, it is focused on solving the problem of being able to
initialize and select environment specific (also referred to as scope specific)
configurations consistently from within different modules in a single
application.

Most applications rely on having multiple code modules, broken up into separate
files, and each module may want to read configuration data during execution.
It is important that each sub module load configuration for the correct
execution environment, and this is typically addressed in one of two ways:
This is typically addressed in one of two ways:

1.  Each module looks up an environment variable (such as NODE_ENV), and uses
    this value to determine the current execution environment.
2.  The entry point for the application initializes the config, and passes the
    entire config, or relevant parts of it down to all other objects that are
    created within the application

The use of an environment variable to load specific configuration data works
for many scenarios, and this functionality is supported out of the box by
modules such as [config](https://www.npmjs.com/package/config). However, does
not work very well with stateless execution environments such as those
encountered with AWS Lambdas. Lambda functions are executed within containers
behind the scenes, and each execution instance may require different
configurations (based on the alias, for example).

Initializing the configuration object at the entry point and passing it down
to each of the submodules alleviates this problem, but that makes the object
interfaces clunky, sometimes requiring a parent object to accept a config
object for the sole reaon that its child components need it.

This library attempts to solve these problems by providing static interfaces for
the configuration and instantiation of a config object. The config object is
configured with application wide settings in the main entry point of the
program, such as an `index.js` file. All other modules with the application can
then use this library to instantiate config objects that are specific to that
module/class. As long as config configuration occurs prior to instantiation,
everything is good.

## Configuration Data Structure

Data for this module can be present in a file named `.<appName>rc`, or in
environment variables. This is standard functionality supported by the
[rc](https://www.npmjs.com/package/rc) library. However, in order to support
multiple environments, configuration data must be structured as follows:

#### When using a config file:

```
{
    "default": {
        // Default configuration parameters go here.
    },
    "dev": {
        // Dev specific overrides go here.
    },
    "prod": {
        // Prod specific overrides go here.
    }
}
```

#### When using environment variables:

```
export myApp_default__host='dev.example.com'
export myApp_default__log__level='info'
export myApp_dev__log__level='debug'
export myApp_prod__host='prod.example.com'
```

## Installation

This library can be installed using npm:

```
npm install @vamship/config
```

## Usage

### Using the config

Before creating any config instances, the config must be configured using the
`configure()` method. Optionally, a default scope can be set for the
application, so that each call to `getConfig()` always brings back
configuration specific to a runtime environment.

> If application scope is not set by calling `setApplicationScope()`, then each
> module must explicitly pass in a scope value when calling `getConfig()`.

#### index.js (application entry point):

```
const config = require('@vamship/config')
                // Configure application wide configuration
                .configure('myApp', {
                    // Hard coded default properties
                    api: {
                        host: 'example.com'
                    }
                })
                // Set default application scope.
                .setApplicationScope(process.env.NODE_ENV)
                // Get the config object
                .getConfig();

// Read config parameters
const host = config.get('api.host');
```

#### api.js (Class that makes API calls):

```
const config = require('@vamship/config').getConfig();

class API {
    constructor() {
        // Nested properties can be accessed via dot separated property names!
        this._host = config.get('api.host');
    }
}
```

### Note on using config with AWS Lambdas

AWS Lambdas are intended to be stateless, with execution contexts changing
based on the invocation alias or version number. When using aliases, it is
possible to have multiple aliases pointing to a single instance of the lambda
function, running within the same container. It is also possible that when
executing, different executions may require different configuration to be
loaded.

In order to handle such scenarios gracefully, it is best to not set a default
application scope on the config, and explicitly load configuration for a
specific scope by using `getConfig(<scope>)`, as shown below:

```
module.exports = (event, context, callback) => {

    ...

    alias = (alias === undefined || alias === '$LATEST') ? 'default' : alias;
    let alias = arn.split(':')[7];

    const config = require('@vamship/config')
                    // Configure application wide configuration
                    .configure('myApp', {
                        // Hard coded default properties
                        api: {
                            host: 'example.com'
                        }
                    })

                    // Get the config object based on alias
                    .getConfig(alias);

    ...
};
```
