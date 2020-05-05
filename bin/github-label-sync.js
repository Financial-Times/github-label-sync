#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const githubLabelSync = require('../lib/github-label-sync');
const path = require('path');
const pkg = require('../package.json');
const program = require('commander');

// Command-line configuration
program
	.version(pkg.version)
	.usage('[options] <repository>')
	.option(
		'-a, --access-token <token>',
		'a GitHub access token (also settable with a GITHUB_ACCESS_TOKEN environment variable)',
		process.env.GITHUB_ACCESS_TOKEN
	)
	.option(
		'-l, --labels <path>',
		'the path or URL to look for the label configuration in. Default: labels.json',
		getLabelFiles,
		[ ]
	)
	.option(
		'-d, --dry-run',
		'calculate the required label changes but do not apply them'
	)
	.option(
		'-A, --allow-added-labels',
		'allow additional labels in the repo, and don\'t delete them'
	)
	.option(
		'-e, --endpoint <url>',
		'specify a GitHub enterprise installation',
		undefined
	)
	.parse(process.argv);

// Make sure we have exactly one argument – the repo
if (program.args.length !== 1) {
	program.help();
}

function getLabelFiles(value, previous) {
	return previous.concat([value]);
}

function readLabels() {
	if (program.labels.length === 0) {
		program.labels = [ 'labels.json' ];
	}

	const files = [];

	program.labels.forEach((file) => {
		if (file.indexOf('http://') === 0 || file.indexOf('https://') === 0) {
			const got = require('got');

			files.push(got(file, { json: true }).then((response) => response.body).catch(() => {
				console.error(chalk.red(`Downloading labels from ${file} failed`));
				process.exit(1);
			}));

		} else {
			// Resolve the label configuration path
			if (!/^[\/\~]/.test(file)) {
				file = path.resolve(process.cwd(), file);
			}

			// Load the labels
			try {
				files.push(Promise.resolve(require(file)));
			} catch (error) {
				console.error(chalk.red(`No labels were found in ${file}`));
				process.exit(1);
			}
		}

	});

	return Promise.all(files);
}

// Apply some log formatting
const format = {
	diff: (message) => {
		return chalk.cyan(' > ') + message;
	},
	success: (message) => {
		return chalk.green(message);
	},
	warning: (message) => {
		return chalk.black.bgYellow(message);
	}
};

// Merge our lists together
function merge(files) {
	const data = {};
	const labels = [];

	files.forEach((file) => {
		if (!Array.isArray(file)) {
			return;
		}

		file.forEach((label) => {
			if (data[label.name] !== null && data[label.name] !== '') {
				data[label.name] = label;
			} else {
				if (JSON.stringify(data[label.name]) !== JSON.stringify(label)) {
					console.error(chalk.red(`Conflicting label names were found: ${label.name}`));
					process.exit(1);
				}
			}
		});
	});

	Object.keys(data).forEach((key) => {
		labels.push(data[key]);
	});

	return labels;
}

// Pull together all the options
function resolveOptions() {
	return readLabels().then((files) => {
		return {
			accessToken: program.accessToken,
			allowAddedLabels: program.allowAddedLabels,
			dryRun: program.dryRun,
			endpoint: program.endpoint,
			format: format,
			labels: merge(files),
			log: console,
			repo: program.args[0]
		};
	});
}

// Sync the labels!
resolveOptions().then((options) => {
	console.log(chalk.cyan.underline(`Syncing labels for "${options.repo}"`));
	return githubLabelSync(options);
}).catch((error) => {
	if (error.endpoint) {
		console.log(chalk.red(`GitHub Error:\n${error.method} ${error.endpoint}\n${error.statusCode}: ${error.message}`));
	} else {
		console.error(chalk.red(error.stack || error.message));
	}
	process.exit(1);
});
