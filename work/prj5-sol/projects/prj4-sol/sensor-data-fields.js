'use strict';

module.exports = {
  fields: {
    sensorId: {
      friendlyName: 'Sensor ID',
      isSearch: true,
      isId: true,
      isRequired: true,
      regex: /^[\w\-]+$/,
      error: (info) => {
	return `${info.friendlyName} field can contain only ` +
	  `alphanumerics, '-' or _`;
      },
    },
    timestamp: {
      friendlyName: 'Reading Timestamp',
      isSearch: true,
      isRequired: true,
      regex: /^\d+$/,
      error: (info) => `The ${info.friendlyName} field should an integer`,
    },
    value: {
      friendlyName: 'Reading Value',
      isSearch: true,
      isRequired: true,
      regex: /^\d+\.\d*$/,
      error: (info) => `The ${info.friendlyName} field should a number`,
    },
    statuses: {
      friendlyName: 'Reading Status',
      isSearch: true,
      isComputed: true,
      type: 'checkbox',
      choices: {
	ok: 'OK',
	outOfRange: 'Out of Range',
	error: 'Error',
      },
      error: (info) => {
	return `The ${info.friendlyName} field must be one of ` +
	  Object.keys(info.values).join(', ');
      },
    },
  },
};
