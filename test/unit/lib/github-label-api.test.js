'use strict';

const assert = require('proclaim');
const mockery = require('mockery');

describe('lib/github-label-api', () => {
	let octonode;
	let githubLabelApi;

	beforeEach(() => {
		octonode = require('../mock/octonode');
		mockery.registerMock('octonode', octonode);
		githubLabelApi = require('../../../lib/github-label-api');
	});

	it('should export a function', () => {
		assert.isFunction(githubLabelApi);
	});

	describe('githubLabelApi(accessToken)', () => {
		const accessToken = 'mock-github-access-token';
		let instance;

		beforeEach(() => {
			instance = githubLabelApi(accessToken);
		});

		it('should set the Accept header', () => {
			assert.deepEqual(instance.apiClient.requestDefaults.headers.Accept,
				'application/vnd.github.symmetra-preview+json');
		});

		it('should create an API client with `accessToken` and no overridden endpoint', () => {
			assert.calledOnce(octonode.client);
			assert.calledWithExactly(octonode.client.firstCall, accessToken, {});
		});

		it('should return an object', () => {
			assert.isObject(instance);
		});

		describe('returned object', () => {

			it('should have an `apiClient` property', () => {
				assert.isDefined(instance.apiClient);
			});

			describe('.apiClient', () => {

				it('should be set to the created octonode API client', () => {
					assert.strictEqual(instance.apiClient, octonode.client.firstCall.returnValue);
				});

			});

			it('should have a `getLabels` method', () => {
				assert.isFunction(instance.getLabels);
			});

			describe('.getLabels(repo)', () => {
				const labels = ['foo', 'bar', 'baz'];
				const repo = 'foo/bar';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.get.yieldsAsync(null, 200, labels);
					returnedPromise = instance.getLabels(repo);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a GET request to the repo labels endpoint', () => {
					assert.calledOnce(instance.apiClient.get);
					assert.calledWith(instance.apiClient.get, `/repos/${repo}/labels`, {page: 1, per_page: 100});
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with the repo labels', () => {
						assert.deepEqual(resolvedValue, labels);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.get.yieldsAsync(apiClientError);
						returnedPromise = instance.getLabels(repo);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'GET');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/labels`);
						});

					});

				});

				describe('when the API response with a non-200 status', () => {

					beforeEach(() => {
						instance.apiClient.get.yieldsAsync(null, 404);
						returnedPromise = instance.getLabels(repo);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 404 status');
						});

					});

				});

			});

			it('should have a `createLabel` method', () => {
				assert.isFunction(instance.createLabel);
			});

			describe('.createLabel(repo, label)', () => {
				const createdLabel = {name: 'foo', color: 'ff0000', url: 'bar'};
				const label = {name: 'foo', color: 'ff0000'};
				const repo = 'foo/bar';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.post.yieldsAsync(null, 201, createdLabel);
					returnedPromise = instance.createLabel(repo, label);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a POST request to the repo labels endpoint', () => {
					assert.calledOnce(instance.apiClient.post);
					assert.calledWith(instance.apiClient.post, `/repos/${repo}/labels`, label);
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with the created label', () => {
						assert.strictEqual(resolvedValue, createdLabel);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.post.yieldsAsync(apiClientError);
						returnedPromise = instance.createLabel(repo, label);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'POST');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/labels`);
						});

					});

				});

				describe('when the API response with a non-201 status', () => {

					beforeEach(() => {
						instance.apiClient.post.yieldsAsync(null, 404);
						returnedPromise = instance.createLabel(repo, label);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 404 status');
						});

					});

				});

			});

			it('should have an `updateLabel` method', () => {
				assert.isFunction(instance.updateLabel);
			});

			describe('.updateLabel(repo, labelName, label)', () => {
				const label = {name: 'foo', color: 'ff0000'};
				const labelName = 'baz qux';
				const updatedLabel = {name: 'foo', color: 'ff0000', url: 'bar'};
				const repo = 'foo/bar';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.patch.yieldsAsync(null, 200, updatedLabel);
					returnedPromise = instance.updateLabel(repo, labelName, label);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a PATCH request to the repo labels endpoint (encoding `labelName`)', () => {
					assert.calledOnce(instance.apiClient.patch);
					assert.calledWith(instance.apiClient.patch, `/repos/${repo}/labels/baz%20qux`, {new_name: 'foo', color: 'ff0000'});
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with the updated label', () => {
						assert.strictEqual(resolvedValue, updatedLabel);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.patch.yieldsAsync(apiClientError);
						returnedPromise = instance.updateLabel(repo, labelName, label);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'PATCH');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/labels/baz%20qux`);
						});

					});

				});

				describe('when the API response with a non-200 status', () => {

					beforeEach(() => {
						instance.apiClient.patch.yieldsAsync(null, 404);
						returnedPromise = instance.updateLabel(repo, labelName, label);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 404 status');
						});

					});

				});

			});

			it('should have a `getLabeledIssues` method', () => {
				assert.isFunction(instance.getLabeledIssues);
			});

			describe('.getLabeledIssues(repo, labelName)', () => {
				const issues = ['foo', 'bar', 'baz'];
				const repo = 'foo/bar';
				const labelName = 'baz qux';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.get.yieldsAsync(null, 200, issues);
					returnedPromise = instance.getLabeledIssues(repo, labelName);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a GET request to the repo issues endpoint', () => {
					assert.calledOnce(instance.apiClient.get);
					assert.calledWith(instance.apiClient.get, `/repos/${repo}/issues`, {labels: labelName, page: 1, per_page: 100, state: 'all'});
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with the repo issues', () => {
						assert.deepEqual(resolvedValue, issues);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.get.yieldsAsync(apiClientError);
						returnedPromise = instance.getLabeledIssues(repo, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'GET');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/issues`);
						});

					});

				});

				describe('when the API response with a non-200 status', () => {

					beforeEach(() => {
						instance.apiClient.get.yieldsAsync(null, 404);
						returnedPromise = instance.getLabeledIssues(repo, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 404 status');
						});

					});

				});

			});

			it('should have a `labelIssue` method', () => {
				assert.isFunction(instance.labelIssue);
			});

			describe('.labelIssue(repo, issueNumber, labelName)', () => {
				const issueNumber = '42';
				const labelName = 'baz qux';
				const repo = 'foo/bar';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.post.yieldsAsync(null, 200);
					returnedPromise = instance.labelIssue(repo, issueNumber, labelName);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a POST request to the repo issue labels endpoint (encoding `issueNumber`)', () => {
					assert.calledOnce(instance.apiClient.post);
					assert.calledWith(instance.apiClient.post, `/repos/${repo}/issues/${issueNumber}/labels`, {labels: [labelName]});
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with no value', () => {
						assert.isUndefined(resolvedValue);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.post.yieldsAsync(apiClientError);
						returnedPromise = instance.labelIssue(repo, issueNumber, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'POST');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/issues/${issueNumber}/labels`);
						});

					});

				});

				describe('when the API response with a non-200 status', () => {

					beforeEach(() => {
						instance.apiClient.post.yieldsAsync(null, 422);
						returnedPromise = instance.labelIssue(repo, issueNumber, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 422 status');
						});

					});

				});

			});

			it('should have a `deleteLabel` method', () => {
				assert.isFunction(instance.deleteLabel);
			});

			describe('.deleteLabel(repo, labelName)', () => {
				const labelName = 'baz qux';
				const repo = 'foo/bar';
				let returnedPromise;

				beforeEach(() => {
					instance.apiClient.del.yieldsAsync(null, 204);
					returnedPromise = instance.deleteLabel(repo, labelName);
				});

				it('should return a promise', () => {
					assert.instanceOf(returnedPromise, Promise);
				});

				it('should make a DELETE request to the repo labels endpoint (encoding `labelName`)', () => {
					assert.calledOnce(instance.apiClient.del);
					assert.calledWith(instance.apiClient.del, `/repos/${repo}/labels/baz%20qux`, {});
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach((done) => {
						returnedPromise.then((value) => {
							resolvedValue = value;
							done();
						}).catch(done);
					});

					it('should resolve with no value', () => {
						assert.isUndefined(resolvedValue);
					});

				});

				describe('when the API client errors', () => {
					const apiClientError = new Error('API client error');

					beforeEach(() => {
						instance.apiClient.del.yieldsAsync(apiClientError);
						returnedPromise = instance.deleteLabel(repo, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with the API client error', () => {
							assert.strictEqual(caughtError, apiClientError);
						});

						it('should augment the API client error with request information', () => {
							assert.strictEqual(caughtError.method, 'DELETE');
							assert.strictEqual(caughtError.endpoint, `/repos/${repo}/labels/baz%20qux`);
						});

					});

				});

				describe('when the API response with a non-204 status', () => {

					beforeEach(() => {
						instance.apiClient.del.yieldsAsync(null, 404);
						returnedPromise = instance.deleteLabel(repo, labelName);
					});

					describe('.catch()', () => {
						let caughtError;

						beforeEach((done) => {
							returnedPromise.then(done).catch((error) => {
								caughtError = error;
								done();
							});
						});

						it('should fail with a status error', () => {
							assert.instanceOf(caughtError, Error);
							assert.strictEqual(caughtError.message, 'API responded with 404 status');
						});

					});

				});

			});

		});

	});

	describe('githubLabelApi(accessToken, apiEndpoint)', () => {
		it('should create an API client with `accessToken` and `apiEndpoint` as hostname', () => {
			const accessToken = 'mock-github-access-token';
			const endpoint = 'github.example.com';

			githubLabelApi(accessToken, endpoint);
			assert.calledOnce(octonode.client);
			assert.calledWithExactly(octonode.client.firstCall, accessToken, {
				hostname: endpoint
			});

		});

	});

});
