'use strict';

const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

const addFormats = require('./label-formats');

addFormats(ajv);

const schema = {
	type: 'object',
	properties: {
		name: { type: 'string', maxLength: 50, format: 'must contain more than native emoji' },
		color: { type: 'string', pattern: '^[a-fA-F0-9]{6}$' },
		description: { type: 'string', maxLength: 100, format: 'doesn\'t accept 4-byte Unicode' },
		delete: { type: 'boolean', default: false },
		aliases: {
			type: 'array',
			items: { type: 'string', maxLength: 50, format: 'must contain more than native emoji' }
		},
	},
	required: ['name'],
	additionalProperties: false
};

const validate = ajv.compile(schema);

module.exports = validate;