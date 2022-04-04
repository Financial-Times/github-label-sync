'use strict';

const github = require('octonode');

module.exports = createApiClient;

class ApiClient {

	constructor (accessToken, apiEndpoint) {
		const urlOptions = apiEndpoint === undefined ? {} : { hostname: apiEndpoint };
		this.apiClient = github.client(accessToken, urlOptions);
		this.apiClient.requestDefaults.headers.Accept = 'application/vnd.github.symmetra-preview+json';
	}

	getLabels (repo) {
		return new Promise((resolve, reject) => {
			const allLabels = [];
			const endpoint = `/repos/${repo}/labels`;
			const params = {
				page: 1,
				per_page: 100
			};
			const getCallback = (error, status, labels) => {
				if (error) {
					error.method = 'GET';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 200) {
					return reject(new Error(`API responded with ${status} status`));
				}
				allLabels.push.apply(allLabels, labels);
				if (labels.length === params.per_page) {
					params.page += 1;
					this.apiClient.get(endpoint, params, getCallback);
				} else {
					resolve(allLabels);
				}
			};
			this.apiClient.get(endpoint, params, getCallback);
		});
	}

	createLabel (repo, label) {
		return new Promise((resolve, reject) => {
			const endpoint = `/repos/${repo}/labels`;
			this.apiClient.post(endpoint, label, (error, status, createdLabel) => {
				if (error) {
					error.method = 'POST';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 201) {
					return reject(new Error(`API responded with ${status} status`));
				}
				resolve(createdLabel);
			});
		});
	}

	updateLabel (repo, labelName, label) {
		labelName = encodeURIComponent(labelName);
		return new Promise((resolve, reject) => {
			const endpoint = `/repos/${repo}/labels/${labelName}`;

			const newLabel = Object.assign({}, label);
			// the github api now expects name changes to be sent as new_name not name
			// (a new label is created if name is used)
			// Have reported the possible regression to github, but it feels like a conscious
			// change to the labels model by github, and they've perhaps been a bit careless
			// about the breaking nature of the change
			if (newLabel.name) {
				newLabel.new_name = newLabel.name;
				delete newLabel.name;
			}
			this.apiClient.patch(endpoint, newLabel, (error, status, updatedLabel) => {
				if (error) {
					error.method = 'PATCH';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 200) {
					return reject(new Error(`API responded with ${status} status`));
				}
				resolve(updatedLabel);
			});
		});
	}

	getLabeledIssues (repo, labelName) {
		return new Promise((resolve, reject) => {
			const allIssues = [];
			const endpoint = `/repos/${repo}/issues`;
			const params = {
				labels: labelName,
				page: 1,
				per_page: 100,
				state: 'all'
			};
			const getCallback = (error, status, issues) => {
				if (error) {
					error.method = 'GET';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 200) {
					return reject(new Error(`API responded with ${status} status`));
				}
				allIssues.push.apply(allIssues, issues);
				if (issues.length === params.per_page) {
					params.page += 1;
					this.apiClient.get(endpoint, params, getCallback);
				} else {
					resolve(allIssues);
				}
			};
			this.apiClient.get(endpoint, params, getCallback);
		});
	}

	labelIssue (repo, issueNumber, labelName) {
		return new Promise((resolve, reject) => {
			const endpoint = `/repos/${repo}/issues/${issueNumber}/labels`;
			this.apiClient.post(endpoint, {labels: [labelName]}, (error, status) => {
				if (error) {
					error.method = 'POST';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 200) {
					return reject(new Error(`API responded with ${status} status`));
				}
				resolve();
			});
		});
	}

	deleteLabel (repo, labelName) {
		labelName = encodeURIComponent(labelName);
		return new Promise((resolve, reject) => {
			const endpoint = `/repos/${repo}/labels/${labelName}`;
			this.apiClient.del(endpoint, {}, (error, status) => {
				if (error) {
					error.method = 'DELETE';
					error.endpoint = endpoint;
					return reject(error);
				}
				if (status !== 204) {
					return reject(new Error(`API responded with ${status} status`));
				}
				resolve();
			});
		});
	}

}

function createApiClient(accessToken, apiEndpoint) {
	return new ApiClient(accessToken, apiEndpoint);
}
