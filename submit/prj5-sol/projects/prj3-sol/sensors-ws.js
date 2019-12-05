const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const AppError = require('./app-error');

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

function serve(port, sensors) {
  const app = express();
  app.locals.port = port;
  app.locals.sensors = sensors;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

module.exports = { serve };

/******************************** Routing ******************************/

function setupRoutes(app) {
  const sensors = app.locals.sensors;
  app.use(cors());
  app.use(bodyParser.json());

  const scrollOpts = {
    next: nextBatch,
    previous: previousBatch,
    itemSelf: itemSelf(['id']),
  };
  
  const idOpts = { itemSelf: itemSelf(), };
  
  app.get('/sensor-types', find(app, sensors.findSensorTypes, scrollOpts));
  app.get('/sensor-types/:id', find(app, sensors.findSensorTypes, idOpts));
  app.post('/sensor-types/', add(app, sensors.addSensorType,
				 { location: sensorLocation }));

  app.get('/sensors', find(app, sensors.findSensors, scrollOpts));
  app.get('/sensors/:id', find(app, sensors.findSensors, idOpts));
  app.post('/sensors/', add(app, sensors.addSensor,
			    { location: sensorLocation }));

  app.get('/sensor-data/:sensorId',
	  find(app, sensors.findSensorData,
	       { itemSelf: itemSelf(['timestamp']), }));
  app.get('/sensor-data/:sensorId/:timestamp',
	  find(app, sensors.findSensorData,
	       { results: sensorDataResults,
		 searchParams: dataSearchParams,
	         itemSelf: itemSelf(),}));
  app.post('/sensor-data/:sensorId',
	   add(app, sensors.addSensorData, { location: dataLocation }));

  app.use(doErrors()); //must be last   
}

/****************************** Handlers *******************************/

function find(app, sensorFn, opts={}) {
  return errorWrap(async function(req, res) {
    const q = opts.searchParams ? opts.searchParams(req)
	                        : Object.assign({}, req.params, req.query);
    if (opts.requestValidate) opts.requestValidate(req, q);
    try {
      let results = await sensorFn.call(app.locals.sensors, q);
      if (opts.results) results = opts.results(req, q, results);
      if (opts.next) opts.next(req, results);
      if (opts.previous) opts.previous(req, results);
      if (opts.itemSelf) results.data.forEach(item => opts.itemSelf(req, item));
      results.self = requestUrl(req);
      res.json(results);
    }
    catch (err) {
      const mapped = mapError(err);
      res.status(mapped.status).json({ errors: mapped.errors });
    }
  });
}

function add(app, sensorFn, opts={}) {
  return errorWrap(async function(req, res) {
    try {
      const obj = Object.assign({}, req.params, req.query, req.body);
      const results = await sensorFn.call(app.locals.sensors, obj);
      if (opts.location) {
	res.append('Location', opts.location(req, obj, results));
      }
      res.sendStatus(CREATED);
    }
    catch(err) {
      const mapped = mapError(err);
      res.status(mapped.status).json({ errors: mapped.errors });
    }
  });
}

/************************ Option Functions *****************************/

function dataSearchParams(req) {
  return Object.assign({statuses: 'all'}, req.params, req.query);
}

function nextBatch(req, results) {
  if (results.nextIndex !== undefined && results.nextIndex >= 0) {
    results.next = requestUrl(req, results.nextIndex);
  }
}

function previousBatch(req, results) {
  const index = req.query._index;
  if (results.previousIndex !== undefined && results.previousIndex >= 0 &&
      index !== undefined && index > 0) {
    results.prev = requestUrl(req, results.previousIndex);
  }
}

function itemSelf(properties=[]) {
  return (req, item) => {
    let url = requestUrl(req);
    url = url.replace(/\?.*$/, '');
    for (p of properties) { url += '/' + item[p]; }
    item.self = url;
  };
}

function sensorDataResults(req, query, results) {
  if (query.timestamp) {
    if (results.data.length === 0 ||
	results.data[0].timestamp !== Number(query.timestamp)) {
      const msg = `no data for timestamp '${query.timestamp}'`;
      throw [ new AppError('NOT_FOUND', msg) ];
    }
    results.data = results.data.slice(0, 1);
    results.nextIndex = -1;
    return results;
  }
  else {
    return results;
  }  
}

function sensorLocation(req, obj, results) {
  return requestUrl(req) + '/' + obj.id;
}

function dataLocation(req, obj, results) {
  return requestUrl(req) + '/' + obj.timestamp;
}


/*************************** Error Handling ****************************/

/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
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

const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND,
  X_ID: NOT_FOUND,
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return (typeof err === 'object' && err instanceof Array && err.length > 0) 
    ? { status: (ERROR_MAP[err[0].code] || BAD_REQUEST),
	errors: err.map(e =>
			({ code: e.code, message: e.msg, widget: e.widget })),
      }
    : { status: SERVER_ERROR,
	errors: [ { code: 'INTERNAL', message: err.toString() } ],
      };
} 

/****************************** Utilities ******************************/

/** Return original URL for req.  If index specified, then set it as
 *  _index query param */
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
  
