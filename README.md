
# GitHub Label Sync [![NPM version](https://img.shields.io/npm/v/github-label-sync.svg)](https://www.npmjs.com/package/github-label-sync) [![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]

Synchronise your GitHub labels with as few destructive operations as possible – similar labels get renamed.

Table Of Contents
-----------------

- [Requirements](#requirements)
- [Command-Line Interface](#command-line-interface)
- [JavaScript Interface](#javascript-interface)
- [Label Config File](#label-config-file)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)


Requirements
------------

You'll need [Node.js][node] 12+ installed to run GitHub Label Sync. You'll also need a GitHub access token ready so that the tool will have access to your repositories. You can [generate an access token here][access-tokens], be sure to allow the "repo" scope.


Command-Line Interface
----------------------

Install GitHub Label Sync globally with [npm][npm]:

```sh
npm install -g github-label-sync
```

This installs the `github-label-sync` command-line tool:

```
Usage: github-label-sync [options] <repository>

Options:

  -h, --help                  output usage information
  -V, --version               output the version number
  -a, --access-token <token>  a GitHub access token (also settable with a GITHUB_ACCESS_TOKEN environment variable)
  -l, --labels <path>         the path or URL to look for the label configuration in. Default: labels.json
  -d, --dry-run               calculate the required label changes but do not apply them
  -A, --allow-added-labels    allow additional labels in the repo, and don't delete them
```

Run GitHub Label Sync on a repo (reading [label data](#label-config-file) from a local `labels.json`):

```sh
github-label-sync --access-token xxxxxx myname/myrepo
```

Run GitHub Label Sync using a different [label config file](#label-config-file):

```sh
github-label-sync --access-token xxxxxx --labels my-labels.json myname/myrepo
```

[Label config file](#label-config-file) can be also specified as YAML:

```sh
github-label-sync --access-token xxxxxx --labels my-labels.yml myname/myrepo
```

Perform a dry run, only making safe "read" requests to the GitHub API:

```sh
github-label-sync --access-token xxxxxx --dry-run myname/myrepo
```

Normally any additional labels found on the repo are deleted. Run GitHub label sync and _ignore_ additional labels, leaving them as-is:

```sh
github-label-sync --access-token xxxxxx --allow-added-labels myname/myrepo
```


JavaScript Interface
--------------------

Install GitHub Label Sync with [npm][npm] or add to your `package.json`:

```
npm install github-label-sync
```

Require GitHub Label Sync:

```js
var githubLabelSync = require('github-label-sync');
```

The `githubLabelSync` function returns a promise that resolves to a JSON diff between the labels found on GitHub, and the labels in your label config.

Run GitHub Label Sync on a repo ([passing in options](#configuration)):

```js
githubLabelSync({
	accessToken: 'xxxxxx',
	repo: 'myname/myrepo',
	labels: [
		// label config
	]
}).then((diff) => {
	console.log(diff);
});
```

The [available options](#configuration) are documented below.

When the promise resolves successfully, its value will be set to a diff between the labels found on GitHub, and the labels in your label config. The diff will look like this:

```js
[
	// This is a "missing" diff, it indicates that a label
	// present in your local config is not present on GitHub.
	{
		name: 'local-label-name',
		type: 'missing',
		actual: null,
		expected: {
			name: 'local-label-name',
			color: 'ff0000'
		}
	},
	// This is a "changed" diff, it indicates that a label
	// present on GitHub has diverged from your local config.
	// This could mean that either somebody has modified the
	// label manually on GitHub, or the local config has
	// been updated.
	{
		name: 'local-label-name',
		type: 'changed',
		actual: {
			name: 'remote-label-name',
			color: '00ff00'
		},
		expected: {
			name: 'local-label-name',
			color: 'ff0000'
		}
	},
	// This is an "added" diff, it indicates that a label
	// is present on GitHub but not in your local config.
	{
		name: 'remote-label-name',
		type: 'added',
		actual: {
			name: 'remote-label-name',
			color: 'ff0000'
		},
		expected: null
	}
]
```


Label Config File
----------

The labels to sync with are defined as an array in either JavaScript, JSON or YAML. The array must contain only label objects, which look like this:

As JSON:

```json
{
	"name": "mylabel",
	"color": "ff0000",
	"aliases": [],
	"description": "optional description",
	"delete": false
}
```

As YAML:

```yaml
- name: mylabel
  color: "ff0000"
  aliases: []
  description: optional description
  delete: false
```

- The `name` property refers to the label name.
- The `color` property should be a hex code, with or without the leading `#`.
- The `delete` property is optional. When set to `true`, matches for this label will _always_ be deleted. This can be used in conjunction with [allowAddedLabels](#allowaddedlabels) to flag specific labels for deletion while leaving non-specified labels intact. Defaults to `false`.

The `aliases` property is optional. When GitHub Label Sync is determining whether to update or delete/create a label it will use the aliases property to prevent used labels from being deleted.

For example, given the following config, GitHub Label Sync will look for labels on GitHub named either "feature" or "enhancement" then _update_ them to match the newer config rather than deleting them.

```json
{
	"name": "type: feature",
	"color": "00ff00",
	"aliases": [
		"enhancement",
		"feature"
	]
}
```

You can find a full example label configuration in this repository ([JSON](labels.json) / [YAML](labels.yml)).


Configuration
-------------

### `accessToken`

_String_. The [GitHub access token][access-tokens] to use when fetching/updating labels. This must be an access token that has permission to write to the repository you want to sync labels with.

```js
githubLabelSync({
	accessToken: 'xxxxxx'
});
```

On the command-line this can be set with either the `access-token` flag or the `GITHUB_ACCESS_TOKEN` environment variable:

```sh
github-label-sync --access-token xxxxxx
GITHUB_ACCESS_TOKEN=xxxxxx github-label-sync
```

### `allowAddedLabels`

_Boolean_. Whether to allow labels on GitHub which are not specified in your [label config](#label-config-file). If `true`, they are allowed and will be left alone. If `false`, they will be deleted. Default: `false`.

```js
githubLabelSync({
	allowAddedLabels: true
});
```

The command-line `allow-added-labels` flag corresponds to this option:

```
github-label-sync --allow-added-labels
```

### `dryRun`

_Boolean_. Whether to perform a dry run, only making safe "read" requests to the GitHub API. If `true`, label changes will not be executed on GitHub. If `false`, label changes will be executed. Default: `false`.

```js
githubLabelSync({
	dryRun: true
});
```

The command-line `dry-run` flag corresponds to this option:

```
github-label-sync --dry-run
```

### `labels`

_Array_. Your label configuration. See the section on [label config file](#label-config-file).

```js
githubLabelSync({
	labels: []
});
```

On the command-line this can be set with the `labels` flag which should point to a JSON or YAML file.

### `repo`

_String_. The GitHub repo to sync labels to. This should include the user and repo names, e.g. "Financial-Times/ft-origami".

```js
githubLabelSync({
	repo: 'Financial-Times/ft-origami'
});
```

The command-line accepts the repo as an argument after the options:

```
github-label-sync Financial-Times/ft-origami
```


Contributing
------------

To contribute to GitHub Label Sync, clone this repo locally and commit your code on a separate branch.

Please write unit tests for your code, and check that everything works by running the following before opening a pull-request:

```sh
npm test               # run the full test suite
npm run lint           # run the linter
npm run test-unit      # run the unit tests
npm run test-coverage  # run the unit tests with coverage reporting
```


License
-------

This software is published by the Financial Times under the [MIT licence][license].



[access-tokens]: https://github.com/settings/tokens
[license]: http://opensource.org/licenses/MIT
[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/