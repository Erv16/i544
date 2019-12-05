'use strict';

module.exports = {
  fields: {
    id: {
      friendlyName: 'Sensor Type ID',
      summaryOrder: 2,
      isId: true,
      isRequired: true,
      classes: [ 'tst-sensor-type-id', ],
      regex: /^[\w\-]+$/,
      error: (info) => {
	return `${info.friendlyName} field can contain only ` +
	  `alphanumerics, '-' or '_'`;
      },
    },
    modelNumber: {
      friendlyName: 'Model Number',
      summaryOrder: 3,
      isId: true,
      isRequired: true,
      classes: [ 'tst-model-number', ],
      regex: /^[\w\-]+$/,
      error: (info) => {
	return `${info.friendlyName} field can contain only ` +
	  `alphanumerics, '-' or '_'`;
      },
    },
    manufacturer: {
      friendlyName: 'Manufacturer',
      summaryOrder: 1,
      isRequired: true,
      classes: [ 'tst-manufacturer', ],
      regex: /^[a-zA-Z\-\' ]+$/,
      error: (info) => {
	return `The ${info.friendlyName} field can contain only ` +
	  `alphabetics, -, ' or space`;
      },
    },
    quantity: {
      friendlyName: 'Measure',
      summaryOrder: 4,
      isRequired: true,
      classes: [ 'tst-quantity', ],
      type: 'select',
      choices: {
	'': 'Select',
	temperature: 'Temperature',
	pressure: 'Pressure',
	flow: 'Flow Rate',
	humidity: 'Relative Humidity',
      },
      error: (info) => {
	return `The ${info.friendlyName} field must be one of ` +
	  Object.values(info.choices).filter(v => v).join(', ');
      },
    },
    limits: {
      friendlyName: 'Limits',
      summaryOrder: 5,
      type: 'interval',
      isRequired: true,
      views: new Set(['add']),
      classes: [ 'numeric', 'interval' ],
    },
  },
  validators: [
    { checkFn: ({limits}) => Number(limits.min) <= Number(limits.max),
      error: ({limits: interval}, {limits: fieldInfo}) => {
	return `The ${fieldInfo.friendlyName} Min value ${interval.min} is ` +
	  `greater than its Max value ${interval.max}`;
      },
      widget: 'limits',
      views: new Set(['add']),
    },
  ]
}; 
