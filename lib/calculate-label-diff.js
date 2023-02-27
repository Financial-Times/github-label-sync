'use strict';

module.exports = calculateLabelDiff;

function calculateLabelDiff(currentLabels, configuredLabels, allowAddedLabels) {
	const diff = [];
	const resolvedLabels = [];
	configuredLabels.forEach((configuredLabel) => {

		// Get current labels which match the configured label name
		const matches = currentLabels.filter((currentLabel) => {
			if (currentLabel.name.toLowerCase() === configuredLabel.name.toLowerCase()) {
				return true;
			}
		});
		// Get current labels which match an alias of the configured label
		const aliasMatches=currentLabels.filter((currentLabel) => {
			if (configuredLabel.aliases && configuredLabel.aliases.map(label => label.toLowerCase()).indexOf(currentLabel.name.toLowerCase()) !== -1) {
				return true;
			}
		});
		// Alias matches must be processed after a name match in order to determine when a "merge" entry is appropriate
		matches.push(...aliasMatches);

		resolvedLabels.push(...matches);

		// If we have no matches, the configured label is missing
		// Do not create label if set to delete
		if (matches.length === 0 && !configuredLabel.delete) {
			return diff.push(createMissingEntry(configuredLabel));
		}

		matches.forEach((matchedLabel, index) => {

			if (configuredLabel.delete) {
				return diff.push(createAddedEntry(matchedLabel));
			}

			const matchedDescription = getLabelDescription(matchedLabel);
			const configuredDescription = getLabelDescription(configuredLabel, matchedDescription);

			// If we have a match, but properties are not equal
			if (configuredLabel.name !== matchedLabel.name ||
				configuredLabel.color !== matchedLabel.color ||
				configuredDescription !== matchedDescription
			) {
				if (index === 0) {
					// The first match can be handled as a simple change
					return diff.push(createChangedEntry(matchedLabel, configuredLabel));
				}

				// Additional matches require a merge operation
				return diff.push(createMergeEntry(matchedLabel, configuredLabel));
			}

		});

	});
	currentLabels.filter(label => resolvedLabels.indexOf(label) === -1).forEach((currentLabel) => {
		if (!allowAddedLabels) {
			diff.push(createAddedEntry(currentLabel));
		}
	});
	return diff;
}

function getLabelDescription(label, fallback = '') {
	if (label.description === undefined) {
		return fallback;
	}
	return (label.description && label.description.trim()) || '';
}

function createMissingEntry(expectedLabel) {
	const missingEntry = {
		name: expectedLabel.name,
		type: 'missing',
		actual: null,
		expected: {
			name: expectedLabel.name,
			color: expectedLabel.color
		}
	};
	const expectedDescription = getLabelDescription(expectedLabel);
	if (expectedDescription) {
		missingEntry.expected.description = expectedDescription;
	}
	return missingEntry;
}

function createChangedEntry(actualLabel, expectedLabel) {
	const changedEntry = {
		name: actualLabel.name,
		type: 'changed',
		actual: {
			name: actualLabel.name,
			color: actualLabel.color
		},
		expected: {
			name: expectedLabel.name,
			color: expectedLabel.color
		}
	};

	const actualDescription = getLabelDescription(actualLabel);
	const expectedDescription = getLabelDescription(expectedLabel, actualDescription);
	if (actualDescription === expectedDescription && !actualDescription) {
		return changedEntry;
	}

	changedEntry.actual.description = actualDescription;
	changedEntry.expected.description = expectedDescription;
	return changedEntry;
}

function createMergeEntry(actualLabel, expectedLabel) {
	const mergeEntry = createChangedEntry(actualLabel, expectedLabel);
	mergeEntry.type = 'merge';
	return mergeEntry;
}

function createAddedEntry(actualLabel) {
	const addedEntry = {
		name: actualLabel.name,
		type: 'added',
		actual: {
			name: actualLabel.name,
			color: actualLabel.color
		},
		expected: null
	};
	const actualDescription = getLabelDescription(actualLabel);
	if (actualDescription) {
		addedEntry.actual.description = actualDescription;
	}
	return addedEntry;
}