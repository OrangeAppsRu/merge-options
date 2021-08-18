'use strict';

var isOptionObject = function(value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') {
		return false;
	}

	var prototype = Object.getPrototypeOf(value);

	return prototype === null || prototype === Object.prototype;
};

var hasOwnProperty = Object.prototype.hasOwnProperty;
var propertyIsEnumerable = Object.propertyIsEnumerable;

var defineProperty = function defineProperty(object, name, value) {
	return Object.defineProperty(object, name, {
		value: value,
		writable: true,
		enumerable: true,
		configurable: true
	});
};

var globalThis = undefined;
var defaultMergeOptions = {
	concatArrays: false,
	ignoreUndefined: false
};

var getEnumerableOwnPropertyKeys = function getEnumerableOwnPropertyKeys(value) {
	var keys = [];

	for (var key in value) {
		if (hasOwnProperty.call(value, key)) {
			keys.push(key);
		}
	}

	/* istanbul ignore else  */
	if (Object.getOwnPropertySymbols) {
		var symbols = Object.getOwnPropertySymbols(value);

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = symbols[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var symbol = _step.value;

				if (propertyIsEnumerable.call(value, symbol)) {
					keys.push(symbol);
				}
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}
	}

	return keys;
};

function clone(value) {
	if (Array.isArray(value)) {
		return cloneArray(value);
	}

	if (isOptionObject(value)) {
		return cloneOptionObject(value);
	}

	return value;
}

function cloneArray(array) {
	var result = array.slice(0, 0);

	getEnumerableOwnPropertyKeys(array).forEach(function (key) {
		defineProperty(result, key, clone(array[key]));
	});

	return result;
}

function cloneOptionObject(object) {
	var result = Object.getPrototypeOf(object) === null ? Object.create(null) : {};

	getEnumerableOwnPropertyKeys(object).forEach(function (key) {
		defineProperty(result, key, clone(object[key]));
	});

	return result;
}

/**
 * @param {*} merged already cloned
 * @param {*} source something to merge
 * @param {string[]} keys keys to merge
 * @param {Object} config Config Object
 * @returns {*} cloned Object
 */
var mergeKeys = function mergeKeys(merged, source, keys, config) {
	keys.forEach(function (key) {
		if (typeof source[key] === 'undefined' && config.ignoreUndefined) {
			return;
		}

		// Do not recurse into prototype chain of merged
		if (key in merged && merged[key] !== Object.getPrototypeOf(merged)) {
			defineProperty(merged, key, merge(merged[key], source[key], config));
		} else {
			defineProperty(merged, key, clone(source[key]));
		}
	});

	return merged;
};

/**
 * @param {*} merged already cloned
 * @param {*} source something to merge
 * @param {Object} config Config Object
 * @returns {*} cloned Object
 *
 * see [Array.prototype.concat ( ...arguments )](http://www.ecma-international.org/ecma-262/6.0/#sec-array.prototype.concat)
 */
var concatArrays = function concatArrays(merged, source, config) {
	var result = merged.slice(0, 0);
	var resultIndex = 0;

	[merged, source].forEach(function (array) {
		var indices = [];

		// `result.concat(array)` with cloning
		for (var k = 0; k < array.length; k++) {
			if (!hasOwnProperty.call(array, k)) {
				continue;
			}

			indices.push(String(k));

			if (array === merged) {
				// Already cloned
				defineProperty(result, resultIndex++, array[k]);
			} else {
				defineProperty(result, resultIndex++, clone(array[k]));
			}
		}

		// Merge non-index keys
		result = mergeKeys(result, array, getEnumerableOwnPropertyKeys(array).filter(function (key) {
			return !indices.includes(key);
		}), config);
	});

	return result;
};

/**
 * @param {*} merged already cloned
 * @param {*} source something to merge
 * @param {Object} config Config Object
 * @returns {*} cloned Object
 */
function merge(merged, source, config) {
	if (config.concatArrays && Array.isArray(merged) && Array.isArray(source)) {
		return concatArrays(merged, source, config);
	}

	if (!isOptionObject(source) || !isOptionObject(merged)) {
		return clone(source);
	}

	return mergeKeys(merged, source, getEnumerableOwnPropertyKeys(source), config);
}

module.exports = function () {
	var config = merge(clone(defaultMergeOptions), this !== globalThis && this || {}, defaultMergeOptions);
	var merged = { _: {} };

	for (var _len = arguments.length, options = Array(_len), _key = 0; _key < _len; _key++) {
		options[_key] = arguments[_key];
	}

	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = options[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var option = _step2.value;

			if (option === undefined) {
				continue;
			}

			if (!isOptionObject(option)) {
				throw new TypeError('`' + option + '` is not an Option Object');
			}

			merged = merge(merged, { _: option }, config);
		}
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
	}

	return merged._;
};
