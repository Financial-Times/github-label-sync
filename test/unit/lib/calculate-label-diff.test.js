'use strict';

const assert = require('proclaim');

describe('lib/calculate-label-diff', () => {
	let calculateLabelDiff;

	beforeEach(() => {
		calculateLabelDiff = require('../../../lib/calculate-label-diff');
	});

	it('should export a function', () => {
		assert.isFunction(calculateLabelDiff);
	});

	describe('calculateLabelDiff(currentLabels, configuredLabels)', () => {
		let configuredLabels;
		let currentLabels;
		let allowAddedLabels;
		let diff;

		it('should return an array', function() {
			assert.isArray(calculateLabelDiff([], []));
		});

		describe('when a configured label does not exist in the current labels', () => {

			beforeEach(() => {
				currentLabels = [];
				configuredLabels = [
					{
						name: 'bar',
						color: '00ff00'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "missing" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'bar',
					type: 'missing',
					actual: null,
					expected: {
						name: 'bar',
						color: '00ff00'
					}
				});
			});
		});

		describe('when a configured label set to delete does not exist in the current labels', () => {

			beforeEach(() => {
				currentLabels = [];
				configuredLabels = [
					{
						name: 'bar',
						color: '00ff00',
						delete: true
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should not add a "missing" entry to the returned diff', () => {
				assert.lengthEquals(diff, 0);
			});
		});

		describe('when a configured label with description does not exist in the current labels', () => {

			beforeEach(() => {
				currentLabels = [];
				configuredLabels = [
					{
						name: 'bar',
						color: '00ff00',
						description: 'foo'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "missing" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'bar',
					type: 'missing',
					actual: null,
					expected: {
						name: 'bar',
						color: '00ff00',
						description: 'foo'
					}
				});
			});

		});

		describe('when a configured label exists in the current labels with no changes', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should not add an entry to the returned diff', () => {
				assert.lengthEquals(diff, 0);
			});

		});

		describe('when a configured label exists in the current labels but has changes', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: '00ff00'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'foo',
					type: 'changed',
					actual: {
						name: 'foo',
						color: 'ff0000'
					},
					expected: {
						name: 'foo',
						color: '00ff00'
					}
				});
			});

		});

		describe('when a configured label exists in the current labels and is marked for deletion', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000',
					},
					{
						name: 'bar',
						color: '00ff00',
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						delete: true,
						aliases: ['bar']
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add an "added" entry to the returned diff for each match', () => {
				assert.lengthEquals(diff, 2);
				assert.deepEqual(diff[0], {
					name: 'foo',
					type: 'added',
					actual: {
						name: 'foo',
						color: 'ff0000',
					},
					expected: null
				});
				assert.deepEqual(diff[1], {
					name: 'bar',
					type: 'added',
					actual: {
						name: 'bar',
						color: '00ff00',
					},
					expected: null
				});
			});

		});

		describe('when a configured label with description exists in the current labels without description', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'foo',
					type: 'changed',
					actual: {
						name: 'foo',
						color: 'ff0000',
						description: ''
					},
					expected: {
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				});
			});

		});

		describe('when a configured label without description exists in the current labels with description', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should not add an entry to the returned diff', () => {
				assert.lengthEquals(diff, 0);
			});

		});

		describe('when a configured label with empty description exists in the current labels with description', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000',
						description: ''
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'foo',
					type: 'changed',
					actual: {
						name: 'foo',
						color: 'ff0000',
						description: 'bar'
					},
					expected: {
						name: 'foo',
						color: 'ff0000',
						description: ''
					}
				});
			});

		});

		describe('when a configured label exists in the current labels but has case changes only', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'FOO',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
					name: 'FOO',
					type: 'changed',
					actual: {
						name: 'FOO',
						color: 'ff0000'
					},
					expected: {
						name: 'foo',
						color: 'ff0000'
					}
				});
			});

		});

		describe('when a configured label alias exists in the current labels', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'bar',
						color: '00ff00',
						aliases: [
							'foo'
						]
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry to the returned diff', () => {
				assert.lengthEquals(diff, 1);
				assert.deepEqual(diff[0], {
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
			});

		});

		describe('when a configured label exists in the current labels but has changes, and the configured label\'s alias exists in the current labels', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'bar',
						color: '00ff00'
					},
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: '0000ff',
						aliases: [
							'bar'
						]
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry for the configured label and a "merge" entry for the alias to the returned diff', () => {
				assert.lengthEquals(diff, 2);
				assert.deepEqual(diff, [
					{
						name: 'foo',
						type: 'changed',
						actual: {
							name: 'foo',
							color: 'ff0000'
						},
						expected: {
							name: 'foo',
							color: '0000ff'
						}
					},
					{
						name: 'bar',
						type: 'merge',
						actual: {
							name: 'bar',
							color: '00ff00'
						},
						expected: {
							name: 'foo',
							color: '0000ff'
						},
					}
				]);
			});

		});

		describe('when multiple aliases of a configured label exist in the current labels', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'bar',
						color: '00ff00'
					},
					{
						name: 'foo',
						color: 'ff0000'
					}
				];
				configuredLabels = [
					{
						name: 'baz',
						color: '0000ff',
						aliases: [
							'foo',
							'bar'
						]
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add a "changed" entry for one alias and a "merge" entry for the other alias to the returned diff', () => {
				assert.lengthEquals(diff, 2);
				assert.deepEqual(diff, [
					{
						name: 'bar',
						type: 'changed',
						actual: {
							name: 'bar',
							color: '00ff00'
						},
						expected: {
							name: 'baz',
							color: '0000ff'
						}
					},
					{
						name: 'foo',
						type: 'merge',
						actual: {
							name: 'foo',
							color: 'ff0000'
						},
						expected: {
							name: 'baz',
							color: '0000ff'
						}
					}
				]);
			});

		});

		describe('when allowAddedLabels is false', () => {
			beforeEach(() => {
				allowAddedLabels = false;
			});

			describe('when a current label does not exist in the configured labels', () => {

				beforeEach(() => {
					currentLabels = [
						{
							name: 'foo',
							color: 'ff0000'
						}
					];
					configuredLabels = [];
					diff = calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels);
				});
	
				it('should add an "added" entry to the returned diff', () => {
					assert.lengthEquals(diff, 1);
					assert.deepEqual(diff[0], {
						name: 'foo',
						type: 'added',
						actual: {
							name: 'foo',
							color: 'ff0000'
						},
						expected: null
					});
				});
	
			});
	
			describe('when a current label with description does not exist in the configured labels', () => {
	
				beforeEach(() => {
					currentLabels = [
						{
							name: 'foo',
							color: 'ff0000',
							description: 'bar'
						}
					];
					configuredLabels = [];
					diff = calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels);
				});
	
				it('should add an "added" entry to the returned diff', () => {
					assert.lengthEquals(diff, 1);
					assert.deepEqual(diff[0], {
						name: 'foo',
						type: 'added',
						actual: {
							name: 'foo',
							color: 'ff0000',
							description: 'bar'
						},
						expected: null
					});
				});
	
			});
		});

		describe('when allowAddedLabels is true', () => {
			beforeEach(() => {
				allowAddedLabels = true;
			});

			describe('when a current label does not exist in the configured labels', () => {
				beforeEach(() => {
					currentLabels = [
						{
							name: 'foo',
							color: 'ff0000'
						}
					];
					configuredLabels = [];
					diff = calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels);
				});
	
				it('should not add an "added" entry to the returned diff', () => {
					assert.lengthEquals(diff, 0);
				});
			});

			describe('when a current label is marked for deletion in the configured labels', () => {
				beforeEach(() => {
					currentLabels = [
						{
							name: 'foo',
							color: 'ff0000',
						}
					];
					configuredLabels = [
						{
							name: 'foo',
							delete: true,
						}
					];
					diff = calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels);
				});
	
				it('should add an "added" entry to the returned diff', () => {
					assert.lengthEquals(diff, 1);
					assert.deepEqual(diff[0], {
						name: 'foo',
						type: 'added',
						actual: {
							name: 'foo',
							color: 'ff0000'
						},
						expected: null
					});
				});
			});

			describe('when a current label with description is marked for deletion in the configured labels', () => {
	
				beforeEach(() => {
					currentLabels = [
						{
							name: 'foo',
							color: 'ff0000',
							description: 'bar',
							delete: true
						}
					];
					configuredLabels = [
						{
							name: 'foo',
							delete: true,
						}
					];
					diff = calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels);
				});
	
				it('should add an "added" entry to the returned diff', () => {
					assert.lengthEquals(diff, 1);
					assert.deepEqual(diff[0], {
						name: 'foo',
						type: 'added',
						actual: {
							name: 'foo',
							color: 'ff0000',
							description: 'bar'
						},
						expected: null
					});
				});
	
			});
		});

		describe('when a range of diffs are expected', () => {

			beforeEach(() => {
				currentLabels = [
					{
						name: 'pub',
						color: '00ff00'
					},
					{
						name: 'baz',
						color: 'ffffff'
					},
					{
						name: 'qux',
						color: '000000'
					}
				];
				configuredLabels = [
					{
						name: 'foo',
						color: 'ff0000'
					},
					{
						name: 'bar',
						color: '00ff00',
						aliases: [
							'pub'
						]
					},
					{
						name: 'baz',
						color: '0000ff'
					}
				];
				diff = calculateLabelDiff(currentLabels, configuredLabels);
			});

			it('should add all of the expected entries to the returned diff', () => {
				assert.lengthEquals(diff, 4);
				assert.deepEqual(diff, [
					{
						name: 'foo',
						type: 'missing',
						actual: null,
						expected: {
							name: 'foo',
							color: 'ff0000'
						}
					},
					{
						name: 'pub',
						type: 'changed',
						actual: {
							name: 'pub',
							color: '00ff00'
						},
						expected: {
							name: 'bar',
							color: '00ff00'
						}
					},
					{
						name: 'baz',
						type: 'changed',
						actual: {
							name: 'baz',
							color: 'ffffff'
						},
						expected: {
							name: 'baz',
							color: '0000ff'
						}
					},
					{
						name: 'qux',
						type: 'added',
						actual: {
							name: 'qux',
							color: '000000'
						},
						expected: null
					}
				]);
			});

		});

	});

});