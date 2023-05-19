'use strict';

const _isUndefined = require('lodash/isUndefined');
const _isNull = require('lodash/isNull');
const _isPlainObject = require('lodash/isPlainObject');
const _each = require('lodash/each');

const deepDefaults = (dest, src) => {
    if (_isUndefined(dest) || _isNull(dest) || !_isPlainObject(dest)) {
        return dest;
    }

    _each(src, function (v, k) {
        if (_isUndefined(dest[k])) {
            dest[k] = v;
        } else if (_isPlainObject(v)) {
            deepDefaults(dest[k], v);
        }
    });

    return dest;
};

module.exports = { deepDefaults };
