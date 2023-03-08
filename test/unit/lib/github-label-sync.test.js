'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/github-label-sync', () => {
	let actionLabelDiff;
	let calculateLabelDiff;
	let extend;
	let githubLabelApi;
	let githubLabelSync;
	let log;
	let stringifyLabelDiff;

	beforeEach(() => {
		actionLabelDiff = require('../mock/action-label-diff');
		mockery.registerMock('./action-label-diff', actionLabelDiff);

		calculateLabelDiff = require('../mock/calculate-label-diff');
		mockery.registerMock('./calculate-label-diff', calculateLabelDiff);

		extend = sinon.spy(require('node.extend'));
		mockery.registerMock('node.extend', extend);

		githubLabelApi = require('../mock/github-label-api');
		mockery.registerMock('./github-label-api', githubLabelApi);

		log = require('../mock/log');

		stringifyLabelDiff = require('../mock/stringify-label-diff');
		mockery.registerMock('./stringify-label-diff', stringifyLabelDiff);

		githubLabelSync = require('../../../lib/github-label-sync');
	});

	it('should export a function', () => {
		assert.isFunction(githubLabelSync);
	});

	it('should have a `defaults` property', () => {
		assert.isObject(githubLabelSync.defaults);
	});

	describe('.defaults', () => {
		let defaults;

		beforeEach(() => {
			defaults = githubLabelSync.defaults;
		});

		it('should have an `accessToken` property', () => {
			assert.isNull(defaults.accessToken);
		});

		it('should have an `allowAddedLabels` property', () => {
			assert.isFalse(defaults.allowAddedLabels);
		});

		it('should have a `dryRun` property', () => {
			assert.isFalse(defaults.dryRun);
		});

		it('should have a `format` property', () => {
			assert.isObject(defaults.format);
		});

		it('should have a `format.diff` method', () => {
			assert.isFunction(defaults.format.diff);
		});

		it('should have a `format.success` method', () => {
			assert.isFunction(defaults.format.success);
		});

		it('should have a `format.warning` method', () => {
			assert.isFunction(defaults.format.warning);
		});

		it('should have a `labels` property', () => {
			assert.isArray(defaults.labels);
		});

		it('should have a `log` property', () => {
			assert.isObject(defaults.log);
		});

		it('should have a `log.info` method', () => {
			assert.isFunction(defaults.log.info);
		});

		it('should have a `log.warn` method', () => {
			assert.isFunction(defaults.log.warn);
		});

		it('should have a `repo` property', () => {
			assert.isNull(defaults.repo);
		});

	});

	describe('githubLabelSync(options)', () => {
		let apiClient;
		let labelsFromApi;
		let labelDiff;
		let labelDiffActions;
		let labelDiffStringified;
		let options;
		let returnedPromise;

		beforeEach(() => {
			apiClient = githubLabelApi.mockClient;

			// Mock API response
			labelsFromApi = [
				{
					name: 'foo',
					color: 'ff0000'
				}
			];
			apiClient.getLabels.resolves(labelsFromApi);

			// Mock label diff calculation
			labelDiff = [
				{
					name: 'foo',
					type: 'missing',
					actual: null,
					expected: {
						name: 'foo',
						color: 'ff0000'
					}
				}
			];
			calculateLabelDiff.returns(labelDiff);

			// Mock label diff actions
			labelDiffActions = [
				Promise.resolve()
			];
			actionLabelDiff.returns(labelDiffActions);

			// Mock label diff stringifying
			labelDiffStringified = [
				'foo stringified',
				'bar stringified'
			];
			stringifyLabelDiff.returns(labelDiffStringified);

			// Spy on Promise.all
			sinon.spy(Promise, 'all');

			// Mock options
			options = {
				accessToken: 'mock-github-access-token',
				labels: [
					{
						name: 'bar',
						color: '00ff00'
					}
				],
				log: log,
				repo: 'foo/bar'
			};
			returnedPromise = githubLabelSync(options);
		});

		afterEach(() => {
			Promise.all.restore();
		});

		it('should default the options', () => {
			assert.calledOnce(extend);
			assert.isTrue(extend.firstCall.args[0]);
			assert.isObject(extend.firstCall.args[1]);
			assert.strictEqual(extend.firstCall.args[2], githubLabelSync.defaults);
			assert.strictEqual(extend.firstCall.args[3], options);
		});

		it('should create a githubLabelApi client with `options.accessToken`', () => {
			assert.calledOnce(githubLabelApi);
			assert.calledWithExactly(githubLabelApi.firstCall, options.accessToken, null);
		});

		it('should return a promise', function() {
			assert.instanceOf(returnedPromise, Promise);
		});

		describe('.then()', () => {
			let resolvedValue;

			beforeEach((done) => {
				returnedPromise.then((value) => {
					resolvedValue = value;
					done();
				}).catch(done);
			});

			it('should get all of the labels for the repo in `options.repo`', () => {
				assert.calledOnce(apiClient.getLabels);
				assert.calledWithExactly(apiClient.getLabels, options.repo);
			});

			it('should diff the labels returned from the API against `options.labels`', () => {
				assert.calledOnce(calculateLabelDiff);
				assert.calledWithExactly(calculateLabelDiff, labelsFromApi, options.labels, false);
			});

			it('should stringify and log the returned diff', () => {
				assert.calledOnce(stringifyLabelDiff);
				assert.calledWith(stringifyLabelDiff, labelDiff);
				assert.calledWith(log.info, 'foo stringified');
				assert.calledWith(log.info, 'bar stringified');
			});

			it('should convert the returned diff to promises', () => {
				assert.calledOnce(actionLabelDiff);
				assert.isObject(actionLabelDiff.firstCall.args[0]);
				assert.strictEqual(actionLabelDiff.firstCall.args[0].apiClient, apiClient);
				assert.deepEqual(actionLabelDiff.firstCall.args[0].diff, labelDiff);
				assert.strictEqual(actionLabelDiff.firstCall.args[0].repo, options.repo);
			});

			it('should execute all of the diff promises', () => {
				assert.calledWith(Promise.all, labelDiffActions);
			});

			it('should log success', () => {
				assert.calledWith(log.info, 'Labels updated');
				assert.neverCalledWith(log.info, 'Labels are already up to date');
			});

			it('should resolve with the label diff', () => {
				assert.deepEqual(resolvedValue, labelDiff);
			});

		});

		describe('when no labels need to be updated', () => {

			beforeEach(() => {
				log.info.reset();
				calculateLabelDiff.returns([]);
				actionLabelDiff.returns([]);
				returnedPromise = githubLabelSync(options);
			});

			describe('.then()', () => {

				beforeEach((done) => {
					returnedPromise.then(() => {
						done();
					}).catch(done);
				});

				it('should log that labels were up to date', () => {
					assert.calledWith(log.info, 'Labels are already up to date');
					assert.neverCalledWith(log.info, 'Labels updated');
				});

			});

		});

		describe('when the `dryRun` option is `true`', () => {

			beforeEach(() => {
				options.dryRun = true;
				actionLabelDiff.reset();
				Promise.all.reset();
				returnedPromise = githubLabelSync(options);
			});

			describe('.then()', () => {

				beforeEach((done) => {
					returnedPromise.then(() => {
						done();
					}).catch(done);
				});

				it('should not convert the returned diff to promises', () => {
					assert.notCalled(actionLabelDiff);
				});

				it('should not execute any diff promises', () => {
					assert.neverCalledWith(Promise.all, labelDiffActions);
				});

			});

		});

		describe('when the `allowAddedLabels` option is `true`', () => {

			beforeEach(() => {
				options.allowAddedLabels = true;
				calculateLabelDiff.reset();
				returnedPromise = githubLabelSync(options);
			});

			describe('.then()', () => {

				beforeEach((done) => {
					returnedPromise.then(() => {
						done();
					}).catch(done);
				});
			
				it('should call calculateLabelDiff with the `allowAddedLabels` flag set to true', () => {
					assert.calledOnce(calculateLabelDiff);
					assert.calledWithExactly(calculateLabelDiff, labelsFromApi, options.labels, true);
				});

			});

		});

	});

});