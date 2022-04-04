'use strict';

const sinon = require('sinon');
require('sinon-as-promised');

module.exports = sinon.stub();
module.exports.mockClient = {
	createLabel: sinon.stub(),
	deleteLabel: sinon.stub(),
	getLabeledIssues: sinon.stub(),
	getLabels: sinon.stub(),
	labelIssue: sinon.stub(),
	updateLabel: sinon.stub()
};
module.exports.returns(module.exports.mockClient);
