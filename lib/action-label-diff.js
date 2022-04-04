'use strict';

module.exports = actionLabelDiff;

function actionLabelDiff(options) {
	const apiClient = options.apiClient;
	const diff = options.diff;
	const repo = options.repo;

	const actions = diff.map((diffEntry) => {
		if (diffEntry.type === 'missing') {
			return apiClient.createLabel(repo, diffEntry.expected);
		}
		if (diffEntry.type === 'changed') {
			return apiClient.updateLabel(repo, diffEntry.name, diffEntry.expected);
		}
		if (diffEntry.type === 'merge') {
			return apiClient.getLabeledIssues(repo, diffEntry.name) // Get all issues and PRs that have the "actual" label
				.then((issues) => {
					const mergeIssues = issues.filter((issue) => {
						// Per-issue label application is needed where the "expected" label is not already present
						return !issue.labels.some((label) => {
							return label.name === diffEntry.expected.name;
						});
					});

					// Add the "expected" label to the issues
					const issueActions = mergeIssues.map((issue) => {
						return apiClient.labelIssue(repo, issue.number, diffEntry.expected.name);
					});

					return Promise.all(issueActions);
				})
				.then(() => {
					// Now that all issues with "actual" label have "expected" label, "actual" label can be deleted
					return apiClient.deleteLabel(repo, diffEntry.name);
				});
		}
		if (diffEntry.type === 'added') {
			return apiClient.deleteLabel(repo, diffEntry.name);
		}
	});

	return actions.filter(action => action);
}
