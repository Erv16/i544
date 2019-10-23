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
  //@TODO set up express app, routing and listen
  const app = express();
  app.locals.port = port;
  app.locals.model = sensors;
  setupRoutes(app);
  app.listen(port,function(){
    console.log(`listening on port ${port}`);
  });
}

module.exports = { serve };


//@TODO routing function, handlers, utility functions

const sensorTypeBase = '/sensor-types';
const sensorBase = '/sensors';

function setupRoutes(app){
  app.use(cors());
  app.use(bodyParser.json());
  app.get(sensorTypeBase,findSensorTypeListWs(app)); 
  app.get(`${sensorTypeBase}/:id`, findSensorTypeWs(app));
  app.post(sensorTypeBase, addSensorTypeWs(app));
  app.get(sensorBase, findSensorsListWs(app));
  app.get(`${sensorBase}/:id`,findSensorsWs(app))
  app.post(sensorBase, addSensorWs(app));
  app.use(doErrors());
}

function findSensorTypeListWs(app){
  return errorWrap(async function(req, res){
    const q = req.query || {};
    try{
      const results = await app.locals.model.findSensorTypes(q);
      res.json(results);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorTypeWs(app){
  return errorWrap(async function(req, res){
    try{
      const id = req.params.id;
      const results = await app.locals.model.findSensorTypes({ id : id });
        res.json(results);
    }
    catch(err){  
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function addSensorTypeWs(app){
  return errorWrap(async function(req, res){
    try{
      const obj = req.body;
      const results = await app.locals.model.addSensorType(obj);
      res.append('Location', requestUrl(req) + '/' + obj.id);
      res.sendStatus(CREATED);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorsListWs(app){
  return errorWrap(async function(req, res){
    const q = req.query || {};
    try{
      const results = await app.locals.model.findSensors(q);
      res.json(results);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorsWs(app){
  return errorWrap(async function(req, res){
    try{
      const id = req.params.id;
      const results = await app.locals.model.findSensors({ id : id });
        res.json(results);
    }
    catch(err){  
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function addSensorWs(app){
  return errorWrap(async function(req, res){
    try{
      const obj = req.body;
      const results = await app.locals.model.addSensor(obj);
      res.append('Location', requestUrl(req) + '/' + obj.id);
      res.sendStatus(CREATED);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "message":mapped.message,
            "code":mapped.code
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function doErrors(app){
  return async function(err, req, res, next){
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  }
}

function errorWrap(handler){
  return async (req, res, next) => {
    try{
      await handler(req, res, next);
    }
    catch(err){
      next(err);
    }
  };
}

/**************** Mapping Errors ****************/

const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND,
  SERVER_ERROR: SERVER_ERROR
};

function mapError(err){
  console.log(err);
  return err.isDomain
    ? {
      status: (ERROR_MAP[err.code] || BAD_REQUEST),
      code: err.code,
      message: err.msg
    }
    :{
      status: SERVER_ERROR,
      code: 'INTERNAL',
      message: err.toString()
    };
}

/**************** Utilities ****************/
function requestUrl(req){
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}