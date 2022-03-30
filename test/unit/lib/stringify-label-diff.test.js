'use strict';

const assert = require('proclaim');

describe('lib/stringify-label-diff', () => {
	let stringifyLabelDiff;

	beforeEach(() => {
		stringifyLabelDiff = require('../../../lib/stringify-label-diff');
	});

	it('should export a function', () => {
		assert.isFunction(stringifyLabelDiff);
	});

	describe('stringifyLabelDiff(labelDiff)', () => {
		let labelDiff;
		let stringifiedDiff;

		beforeEach(() => {
			labelDiff = [];
		});

		it('should return an array', function() {
			assert.isArray(stringifyLabelDiff(labelDiff));
		});

		it('should stringify "missing" diff entries', () => {
			labelDiff.push({
				name: 'foo',
				type: 'missing',
				actual: null,
				expected: {
					name: 'foo',
					color: '00ff00'
				}
			});
			stringifiedDiff = stringifyLabelDiff(labelDiff);
			assert.lengthEquals(stringifiedDiff, 1);
			assert.strictEqual(stringifiedDiff[0], 'Missing: the "foo" label is missing from the repo. It will be created.');
		});

		it('should stringify "changed" diff entries', () => {
			labelDiff.push({
				name: 'foo',
				type: 'changed',
				actual: {
					name: 'foo',
					color: 'ff0000'
				},
				expected: {
					name: 'bar',
					color: '00ff00'
				}
			});
			stringifiedDiff = stringifyLabelDiff(labelDiff);
			assert.lengthEquals(stringifiedDiff, 1);
			assert.strictEqual(stringifiedDiff[0], 'Changed: the "foo" label in the repo is out of date. It will be updated to "bar" with color "#00ff00".');
		});

		it('should stringify "merge" diff entries', () => {
			labelDiff.push({
				name: 'foo',
				type: 'merge',
				actual: {
					name: 'foo',
					color: 'ff0000'
				},
				expected: {
					name: 'bar',
					color: '00ff00'
				}
			});
			stringifiedDiff = stringifyLabelDiff(labelDiff);
			assert.lengthEquals(stringifiedDiff, 1);
			assert.strictEqual(stringifiedDiff[0], 'Changed: the "foo" label in the repo is out of date. It will be updated to "bar" with color "#00ff00".');
		});

		it('should stringify "added" diff entries', () => {
			labelDiff.push({
				name: 'foo',
				type: 'added',
				actual: {
					name: 'foo',
					color: 'ff0000'
				},
				expected: null
			});
			stringifiedDiff = stringifyLabelDiff(labelDiff);
			assert.lengthEquals(stringifiedDiff, 1);
			assert.strictEqual(stringifiedDiff[0], 'Added: the "foo" label in the repo is not expected. It will be deleted.');
		});

		it('should filter out invalid entries', () => {
			labelDiff.push({
				type: 'invalid'
			});
			stringifiedDiff = stringifyLabelDiff(labelDiff);
			assert.lengthEquals(stringifiedDiff, 0);
		});

	});

});
