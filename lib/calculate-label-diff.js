'use strict';

module.exports = calculateLabelDiff;

function calculateLabelDiff(currentLabels, configuredLabels) {
	const diff = [];
	const resolvedLabels = [];
	configuredLabels.forEach((configuredLabel) => {

		// Get current labels which match the configured label
		const matches = currentLabels.filter((currentLabel) => {
			if (currentLabel.name.toLowerCase() === configuredLabel.name.toLowerCase()) {
				return true;
			}
			if (configuredLabel.aliases && configuredLabel.aliases.map(label => label.toLowerCase()).indexOf(currentLabel.name.toLowerCase()) !== -1) {
				return true;
			}
		});

		// If we have no matches, the configured label is missing
		if (matches.length === 0) {
			return diff.push(createMissingEntry(configuredLabel));
		}

		// Always take the first match
		const matchedLabel = matches[0];
		resolvedLabels.push(matchedLabel);

		const matchedDescription = getLabelDescription(matchedLabel);
		const configuredDescription = getLabelDescription(configuredLabel, matchedDescription);

		// If we have a match, but properties are not equal
		if (configuredLabel.name !== matchedLabel.name ||
			configuredLabel.color !== matchedLabel.color ||
			configuredDescription !== matchedDescription
		) {
			return diff.push(createChangedEntry(matchedLabel, configuredLabel));
		}

	});
	currentLabels.filter(label => resolvedLabels.indexOf(label) === -1).forEach((currentLabel) => {
		diff.push(createAddedEntry(currentLabel));
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
