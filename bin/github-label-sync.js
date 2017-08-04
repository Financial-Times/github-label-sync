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
		'labels.json'
	)
	.option(
		'-d, --dry-run',
		'calculate the required label changes but do not apply them'
	)
	.option(
		'-A, --allow-added-labels',
		'allow additional labels in the repo, and don\'t delete them'
	)
	.parse(process.argv);

// Make sure we have exactly one argument – the repo
if (program.args.length !== 1) {
	program.help();
}

function readLabels() {
	if (program.labels.indexOf('http://') === 0 || program.labels.indexOf('https://') === 0) {
		const got = require('got');

		return got(program.labels, { json: true }).then((response) => response.body).catch(() => {
			console.error(chalk.red(`Downloading labels from ${program.labels} failed`));
			process.exit(1);
		});

	} else {
		// Resolve the label configuration path
		if (!/^[\/\~]/.test(program.labels)) {
			program.labels = path.resolve(process.cwd(), program.labels);
		}

		// Load the labels
		try {
			return Promise.resolve(require(program.labels));
		} catch (error) {
			console.error(chalk.red(`No labels were found in ${program.labels}`));
			process.exit(1);
		}
	}
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

// Pull together all the options
function resolveOptions() {
	return readLabels().then((labels) => {
		return {
			accessToken: program.accessToken,
			allowAddedLabels: program.allowAddedLabels,
			dryRun: program.dryRun,
			format: format,
			labels: labels,
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
