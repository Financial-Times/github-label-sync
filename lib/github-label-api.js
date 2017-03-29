'use strict';

const github = require('octonode');

module.exports = createApiClient;

class ApiClient {

	constructor (accessToken) {
		this.apiClient = github.client(accessToken);
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
			this.apiClient.patch(endpoint, label, (error, status, updatedLabel) => {
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

function createApiClient(accessToken) {
	return new ApiClient(accessToken);
}
