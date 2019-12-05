'use strict';

module.exports = {
  fields: {
    id: {
      friendlyName: 'Sensor ID',
      summaryOrder: 1,
      isId: true,
      isRequired: true,
      classes: [ 'tst-sensor-id', ],
      regex: /^[\w\-]+$/,
      error: (info) => {
	return `${info.friendlyName} field can contain only ` +
	  `alphanumerics, '-' or '_'`;
      },
    },
    model: {
      friendlyName: 'Model',
      summaryOrder: 2,
      isRequired: true,
      classes: [ 'tst-model', ],
      regex: /^[\w\-]+$/,
      error: (info) => {
	return `${info.friendlyName} field can contain only ` +
	  `alphanumerics, '-' or '_'`;
      },
    },
    period: {
      friendlyName: 'Period',
      summaryOrder: 3,
      classes: [ 'tst-period', 'numeric' ],
      isRequired: true,
      regex: /^\d+$/,
      error: (info) => `The ${info.friendlyName} field must be an integer`,
    },
    expected: {
      friendlyName: 'Expected Range',
      summaryOrder: 4,
      type: 'interval',
      classes: [ 'numeric', 'interval' ],
      isRequired: true,
      views: new Set(['add']),
    },
  },
  validators: [
    { checkFn: ({expected}) => Number(expected.min) <= Number(expected.max),
      error: ({expected: interval}, {expected: fieldInfo}) => {
	return `The ${fieldInfo.friendlyName} Min value ${interval.min} is ` +
	  `greater than its Max value ${interval.max}`;
      },
      widget: 'expected.max',
      views: new Set(['add']),
    },
  ]
};
