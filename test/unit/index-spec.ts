import { expect, use as _useWithChai } from 'chai';
import _chaiAsPromised from 'chai-as-promised';
import _sinonChai from 'sinon-chai';
import 'mocha';

_useWithChai(_sinonChai);
_useWithChai(_chaiAsPromised);

import { dotParser } from '../../src/parsers/dot-parser.js';
import { createEnvLoader } from '../../src/loaders/env-loader.js';
import { Config } from '../../src/config.js';
import { createNodeConfig } from '../../src/config-factory.js';
import * as _index from '../../src/index.js';

describe('index', function () {
    it('should implement methods required by the interface', async function () {
        expect(_index.Config).to.equal(Config);
        expect(_index.dotParser).to.equal(dotParser);
        expect(_index.createEnvLoader).to.equal(createEnvLoader);
        expect(_index.createNodeConfig).to.equal(createNodeConfig);
    });
});
