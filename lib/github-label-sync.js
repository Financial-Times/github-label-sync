'use strict';

const actionLabelDiff = require('./action-label-diff');
const calculateLabelDiff = require('./calculate-label-diff');
const extend = require('node.extend');
const githubLabelApi = require('./github-label-api');
const stringifyLabelDiff = require('./stringify-label-diff');
const validateLabelFormat = require('./validate-label-format');

module.exports = githubLabelSync;

module.exports.defaults = {
	accessToken: null,
	allowAddedLabels: false,
	dryRun: false,
	endpoint: null,
	format: {
		diff: echo,
		success: echo,
		warning: echo
	},
	labels: [],
	log: {
		info: noop,
		warn: noop
	},
	repo: null
};

function githubLabelSync(options) {
	options = extend(true, {}, module.exports.defaults, options);

	const apiClient = githubLabelApi(options.accessToken, options.endpoint);
	const format = options.format;
	const log = options.log;
	let labelDiff;

	if (options.labels.length) {
		const validationErrors = [];

		log.info('Validating provided labels');
		for (const label of options.labels) {
			if (!validateLabelFormat(label)) {
				validationErrors.push({ label: label, errors: validateLabelFormat.errors });
			}
		}

		if (validationErrors.length) {
			const messages = validationErrors.map(({label, errors}) => {
				const lines = [];
				lines.push('Invalid label:');
				lines.push(`  ${JSON.stringify(label)}`);
				for (const error of errors) {
					const message = `${error.instancePath} ${error.message}`.trim().replace(/^\//, '');
					lines.push(`  - ${message}`);
				}
				return lines.join('\n');
			});

			return Promise.reject({ message: messages.join('\n\n') });
		}
	}

	log.info('Fetching labels from GitHub');

	return apiClient.getLabels(options.repo)
		.then((currentLabels) => {
			labelDiff = calculateLabelDiff(currentLabels, options.labels, options.allowAddedLabels);
			stringifyLabelDiff(labelDiff).forEach((diffLine) => {
				log.info(format.diff(diffLine));
			});
			return labelDiff;
		})
		.then((labelDiff) => {
			if (options.dryRun) {
				return labelDiff;
			}
			if (labelDiff.length) {
				log.info('Applying label changes, please wait…');
			}
			const diffActions = actionLabelDiff({
				apiClient: apiClient,
				diff: labelDiff,
				repo: options.repo
			});
			return Promise.all(diffActions);
		})
		.then((results) => {
			if (results.length === 0) {
				log.info(format.success('Labels are already up to date'));
			} else if (options.dryRun) {
				log.warn(format.warning('This is a dry run. No changes have been made on GitHub'));
			} else {
				log.info(format.success('Labels updated'));
			}
			return labelDiff;
		});
}

/* istanbul ignore next */
function noop() {}

/* istanbul ignore next */
function echo(arg) {
	return arg;
}