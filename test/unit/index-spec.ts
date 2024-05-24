import { expect, use as _useWithChai } from 'chai';
import _chaiAsPromised from 'chai-as-promised';
import _sinonChai from 'sinon-chai';
import 'mocha';

_useWithChai(_sinonChai);
_useWithChai(_chaiAsPromised);

import { Config } from '../../src/config.js';
import * as _index from '../../src/index.js';

describe('index', function () {
    it('should implement methods required by the interface', async function () {
        expect(_index.Config).to.equal(Config);
    });
});
