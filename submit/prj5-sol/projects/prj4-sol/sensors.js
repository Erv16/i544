'use strict';

const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const querystring = require('querystring');

const Mustache = require('./mustache');
const sensorTypeFields = require('./sensor-type-fields');
const sensorFields = require('./sensor-fields');
//const sensorDataFields = require('./sensor-data-fields');
const widgetView = require('./widget-view');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

function serve(port, model, base='') {
  const app = express();
  app.locals.port = port;
  app.locals.model = model;
  app.locals.base = base;
  app.locals.mustache = new Mustache();
  process.chdir(__dirname);
  app.use('/', express.static(STATIC_DIR));
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}


module.exports = serve;

/******************************** Routes *******************************/

function setupRoutes(app) {
  const base = app.locals.base;
  for (const b of [ 'sensor-types', 'sensors' ]) {
    app.get(`${base}/${b}.html`, doSearch(app, b));
    app.get(`${base}/${b}/add.html`, doAdd(app, b, 'add'));
    app.post(`${base}/${b}/add.html`, bodyParser.urlencoded({extended: true}),
	     doAdd(app, b, 'add'));
  }
  app.use(doErrors(app)); //must be last   
}

/************************** Field Definitions **************************/

const PAGES = {
  'sensor-types': {
    title: 'Sensor Types',
    ... sensorTypeFields,
  },
  'sensors': {
    title: 'Sensors',
    ... sensorFields,
  },
};

const VIEWS = {
  search: {
    title: 'Search',
    filter: (field) => !field.views || field.views.has('search'),
  },
  add: {
    title: 'Create / Update',
    filter: (field) =>
      !field.isComputed && (!field.views || field.views.has('add')),
    method: 'POST',
  },
};

const PAGE_CLASSES = {
  'sensor-types-search': 'tst-sensor-types-search-page',
  'sensor-types-add': 'tst-sensor-types-add-page',
  'sensors-search': 'tst-sensors-search-page',
  'sensors-add': 'tst-sensors-add-page',
};

function makeWidgets(pages, views) {
  const widgets = {};
  for (const [k, f] of Object.entries(pages)) {
    widgets[k] = {};
    for (const [view, viewInfo] of Object.entries(views)) {
      widgets[k][view] = [];
      for (const [name, info] of Object.entries(f.fields)) {
	if (viewInfo.filter(info)) {
	  const widget = makeWidget(name, info);
	  widgets[k][view].push(widget);
	}
      }
    }
  }
  return widgets;
}

function makeWidget(name, info) {
  const widget = Object.assign({name}, info);
  widget.label = info.friendlyName;
  return widget;
}

const WIDGETS = makeWidgets(PAGES, VIEWS);

/*************************** Action Routines ***************************/

function doSearch(app, pageId, viewId='search') {
  const postFn = (view) => Object.assign({}, view, {isRequired: false});
  return errorWrap(async function(req, res) {
    const errors = [];
    let view = {};
    try {
      const q = nonEmptyValues(req.query || {});
      view = makeFormView(pageId, viewId, q, postFn);
      const isOk = validate(pageId, viewId, q, errors);
      if (!isOk) {
	mixErrorsIntoView({errors}, view);
      }
      else {
	const results = await app.locals.model.list(pageId, q);
	const summary = summaryView(pageId, q, results);
	view.summary = summary;
      }
    }
    catch (err) {
      mixErrorsIntoView(err, view);
    }
    res.send(app.locals.mustache.render('search', view));
  });
};

function doAdd(app, pageId, viewId) {
  return errorWrap(async function(req, res) {
    let view = {};
    const errors = [];
    let q = {};
    const method = req.method;
    try {
      if (req.method === 'POST') {
	q = nonEmptyValues(req.body);
	if (pageId === 'sensor-types') { //hack
	  q = Object.assign({ 'unit': UNITS[q.quantity] || 'X', }, q);
	}
	const isOk = validate(pageId, viewId, q, errors);
	if (isOk) {
	  await app.locals.model.update(pageId, q);
	  const redirectUrl =
		requestUrl(req).replace(/\/\w+\.html$/, `.html?id=${q.id}`);
	  res.redirect(redirectUrl);
	  return;
	}
      }
      view = makeFormView(pageId, viewId, q);
      mixErrorsIntoView({errors}, view);
    }
    catch (err) {
      view = makeFormView(pageId, viewId, q);
      mixErrorsIntoView(err, view);
    }
    res.send(app.locals.mustache.render('search', view));
  });
};

function makeFormView(pageId, viewId, q={}, postFn = x=>x) {
  const widgets =
	WIDGETS[pageId][viewId].
	map(w => widgetView(w, {postFn, value: q[w.name]}));
  return {
    title: `${VIEWS[viewId].title} ${PAGES[pageId].title}`,
    pageClass: PAGE_CLASSES[`${pageId}-${viewId}`],
    method: VIEWS[viewId].method || 'GET',
    widgets, viewId,
  };
}

const UNITS = {
  flow: 'gpm',
  humidity: '%',
  pressure: 'PSI',
  temperature: 'C',
};
function mixErrorsIntoView(err, view) {
  if (err.status && err.status === 404) {
    view.errors = ['No results found.'];
  }
  else if (err.errors && err.errors instanceof Array) {
    view.errors = [];
    err.errors.forEach(e => {
      let isWidgetError = false;
      if (view.widgets && e.widget && e.message) {
	const widget = view.widgets.find(w => {
	  if (w.name === e.widget) {
	    return true;
	  }
	  else {
	    assert(typeof e.widget === 'string');
	    const m = e.widget.match(/^(\w+)\./);
	    return m && m[1] === w.name;
	  }
	});
	if (widget) {
	  widget.error = e.message;
	  isWidgetError = true;
	}
      }
      if (!isWidgetError) {
	view.errors.push(e.message || e.toString());
      }
    });
  }
  else {
    view.errors = [ err.message || err.toString() ];
  }
}

function summaryView(pageId, q, results) {
  const pageInfo = PAGES[pageId];
  const fields = pageInfo.fields;
  const summaryFields = 
	Object.keys(fields).
	filter(f => fields[f].summaryOrder).
	sort((f1, f2) => fields[f1].summaryOrder - fields[f2].summaryOrder);
  const headers = makeHeaders(summaryFields, fields);
  const data = [];
  results.data.forEach(d0 => {
    const d1 = [];
    summaryFields.forEach(f => pushDataSummary(f, fields, d0, d1));
    data.push(d1);
  });
  const next = results.next ? new URL(results.next).search : '';
  const prev = results.prev ? new URL(results.prev).search : '';
  return { headers, data, next, prev };
}

function pushDataSummary(name, fields, data, results) {
  const fieldInfo = fields[name];
  const value = data[name];
  const classes = fieldInfo.classes || [];
  if (fieldInfo.type === 'interval') {
    const minClasses = classes.concat([ `tst-${name}-min` ]);
    results.push({classes: minClasses.join(' '), value: value.min});
    const maxClasses = classes.concat([ `tst-${name}-max` ]);
    results.push({classes: maxClasses.join(' '), value: value.max});
  }
  else {
    results.push({ classes: classes.join(' '), value });
  }
}

function makeHeaders(keys, fields) {
  const rows = [];
  for (let i = 0; i < 2; i++) {
    let hasInterval = false;
    const row = [];
    for (const key of keys) {
      const field = fields[key];
      if (field.type !== 'interval') {
	row.push((i === 0) ? {heading: field.friendlyName} : {});
      }
      else {
	hasInterval = true;
	if (i === 0) {
	  row.push({span: 2, heading: field.friendlyName});
	}
	else {
	  row.push({heading: 'Min'});
	  row.push({heading: 'Max'});
	}
      }
    }
    rows.push(row);
    if (!hasInterval) break;
  }
  return rows;
}




/************************** Field Utilities ****************************/


/** Given a pageId and a map of field values validate values using the
 *  fields info for pageId.  Add any detected errors to errors.
 */
function validate(pageId, viewId, values={}, errors=[]) {
  const pageFieldsInfo = PAGES[pageId].fields;
  assert(pageFieldsInfo);
  const viewInfo = VIEWS[viewId];
  assert(viewInfo);
  const fieldsInfo = {};
  Object.entries(pageFieldsInfo).forEach(([k, v]) => {
    if (viewInfo.filter(v)) fieldsInfo[k] = v;
  });
  if (viewId !== 'search') { //bit of a hack; search has no required fields
    Object.keys(fieldsInfo).
      filter(name => fieldsInfo[name].isRequired).
      forEach(function (name) {
	const fieldInfo = fieldsInfo[name];
	const friendly = fieldInfo.friendlyName;
	if (values[name] === undefined) {
	  errors.push( {
	    message: `A value for '${friendly}' must be provided.`,
	    widget: name,
	  });
	}
	else if (fieldInfo.type === 'interval') {
	  const val = values[name];
	  if (isEmpty(val.min) || isEmpty(val.max)) {
	    errors.push({
	      message:
  	        `Both Min and Max values must be specified for '${friendly}'.`,
	      widget: name,
	    });
	  }
	}
      }); //forEach
  }
  for (const name of Object.keys(values)) {
    const fieldInfo = fieldsInfo[name];
    const value = values[name];
    if (!fieldInfo || isEmpty(value)) continue; //no validation possible
    if (fieldInfo.regex &&
	(typeof value !== 'string' || !value.match(fieldInfo.regex))) {
      errors.push({ message: fieldInfo.error(fieldInfo), widget: name, });
    }
    else if (fieldInfo.choices &&
	     Object.keys(fieldInfo.choices).indexOf(value) < 0) {
      errors.push({ message: fieldInfo.error(fieldInfo), widget: name, });
    }
    else if (fieldInfo.type === 'interval' && value) {
      if (!isEmpty(value.min) && !value.min.match(/^\d+(\.\d*)?$/)) {
	const msg = `Min for '${fieldInfo.friendlyName}' must be a number.`;
	errors.push({ message: msg, widget: name });
      }
      if (!isEmpty(value.max) && !value.max.match(/^\d+(\.\d*)?$/)) {
	const msg = `Max for '${fieldInfo.friendlyName}' must be a number.`;
	errors.push({ message: msg, widget: name });
      }
    }
  }
  if (errors.length === 0) {
    for (const v of PAGES[pageId].validators || []) {
      if ((!v.views || v.views.has(viewId)) && !v.checkFn(values)) {
	errors.push({ message: v.error(values, fieldsInfo),
		      widget: v.widget,
		    });
      }
    }
  }
  return errors.length === 0;
}

function nonEmptyValues(values) {
  const out = {};
  Object.entries(values).forEach(([k, v]) => {
    const isDef = !isEmpty(v);
    if (isDef) out[k] = (typeof v === 'string') ? v.trim() : v;
  });
  return out;
}


/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

/** Ensures a server error results in an error page sent back to
 *  client with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.send(app.locals.mustache.render('errors', { msg: err.message, }));
    console.error(err);
  };
}

/************************ General Utilities ****************************/



function isEmpty(v) {
  return (v === undefined) || v === null ||
    (typeof v === 'string' && v.trim().length === 0);
}

/** Return original URL for req.  If index specified, then set it as
 *  _index query param 
 */
function requestUrl(req, index) {
  const port = req.app.locals.port;
  let url = `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
  if (index !== undefined) {
    if (url.match(/_index=\d+/)) {
      url = url.replace(/_index=\d+/, `_index=${index}`);
    }
    else {
      url += url.indexOf('?') < 0 ? '?' : '&';
      url += `_index=${index}`;
    }
  }
  return url;
}
