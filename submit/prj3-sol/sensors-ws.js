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
const sensorDataBase = '/sensor-data';

function setupRoutes(app){
  app.use(cors());
  app.use(bodyParser.json());
  app.get(sensorTypeBase,findSensorTypeList(app)); 
  app.get(`${sensorTypeBase}/:id`, findSensorType(app));
  app.post(sensorTypeBase, addSensorType(app));
  app.get(sensorBase, findSensorsList(app));
  app.get(`${sensorBase}/:id`,findSensors(app))
  app.post(sensorBase, addSensor(app));
  app.get(`${sensorDataBase}/:id`,findSensorDataList(app));
  app.get(`${sensorDataBase}/:id/:timestamp`, findSensorData(app));
  app.post(`${sensorDataBase}/:id`, addSensordData(app));
  app.get('/*', function(req,res){
    try{
      throw[
        {
          code: 'NOT_FOUND',
          msg: `${requestUrl(req)} is not a valid url`
        }
      ];
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
  app.use(doErrors());
}

function findSensorTypeList(app){
  return errorWrap(async function(req, res){
    const q = req.query || {};
    let nextObj = q;
    let prevObj = q;
    let url = requestUrl(req);
    url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url;
    
    try{
      const results = await app.locals.model.findSensorTypes(q);
      results.self = requestUrl(req);
      for(let i = 0; i < results.data.length; i++){
        results.data[i].self = url+`/${results.data[i].id}`;
      }

      if(results.nextIndex !== -1){
        let testurl = url;
          nextObj._index = results.nextIndex;
        testurl += '?';
        for(key in nextObj){
          testurl += key + '=' + nextObj[key] + '&';
        }
        testurl = testurl.slice(0,-1);
        results.next = testurl;
      }

      if(results.previousIndex > 0){
        let testurl = url;
        prevObj._index = results.previousIndex;
        testurl += '?';
        for(key in prevObj){
          testurl += key + '=' + prevObj[key] + '&';
        }
        testurl = testurl.slice(0,-1);
        results.prev = testurl;
      }

      res.json(results);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorType(app){
  return errorWrap(async function(req, res){
    try{
      const id = req.params.id;
      let url = requestUrl(req);
      url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url;
      const results = await app.locals.model.findSensorTypes({ id : id });
      results.self = requestUrl(req);
      for(let i = 0; i < results.data.length; i++){
        results.data[i].self = url;
      }
        res.json(results);
    }
    catch(err){  
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function addSensorType(app){
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
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorsList(app){
  return errorWrap(async function(req, res){
    const q = req.query || {};
    let nextObj = q;
    let prevObj = q;
    let url = requestUrl(req);
    url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url;
    try{
      const results = await app.locals.model.findSensors(q);
      results.self = requestUrl(req);
      for(let i = 0; i < results.data.length; i++){
        results.data[i].self = url+`/${results.data[i].id}`;
      }

      if(results.nextIndex !== -1){
        let testurl = url;
          nextObj._index = results.nextIndex;
        testurl += '?';
        for(key in nextObj){
          testurl += key + '=' + nextObj[key] + '&';
        }
        testurl = testurl.slice(0,-1);
        results.next = testurl;
      }

      if(results.previousIndex > 0){
        let testurl = url;
        prevObj._index = results.previousIndex;
        testurl += '?';
        for(key in prevObj){
          testurl += key + '=' + prevObj[key] + '&';
        }
        testurl = testurl.slice(0,-1);
        results.prev = testurl;
      }

      res.json(results);
    }
    catch(err){
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensors(app){
  return errorWrap(async function(req, res){
    try{
      const id = req.params.id;
      let url = requestUrl(req);
      url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url;
      const results = await app.locals.model.findSensors({ id : id });
      results.self = requestUrl(req);
      for(let i = 0; i < results.data.length; i++){
        results.data[i].self = url;
      }
        res.json(results);
    }
    catch(err){  
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function addSensor(app){
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
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorDataList(app){
  return errorWrap(async function(req, res){
    const id = req.params.id;
    let url = requestUrl(req);
    url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url
    const q = req.query || {};
    q.sensorId = id;
    try{
      const results = await app.locals.model.findSensorData(q);
      results.self = requestUrl(req);
      for(let i = 0; i < results.data.length; i++){
        results.data[i].self = url + `/${results.data[i].timestamp}`;
      }
      res.json(results);
    }
    catch(err){  
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function findSensorData(app){
  return errorWrap(async function(req,res){
    const id = req.params.id;
    const timestamp = req.params.timestamp;
    let url = requestUrl(req);
    url = (url.indexOf("?") !== -1)?url.substring(0,url.indexOf("?")):url;
    try{
      const results = await app.locals.model.findSensorData({sensorId : id, timestamp: timestamp, statuses: 'all'});
      results.data = results.data.filter(elem => elem.timestamp === Number(req.params.timestamp));
      if(results.data.length === 0){
        throw[
          {
            code: 'NOT_FOUND',
            msg: `no data for timestamp ${timestamp}`
          }
        ];
      }
      results.nextIndex = -1;
      results.self = url;
      results.data[0].self = url;
      res.json(results);
    }
    catch(err){ 
      err[0].isDomain = true;
      const mapped = mapError(err[0]);
      let errObj = {};
      errObj = {
        "errors": [
          {
            "code":mapped.code,
            "message":mapped.message
          }
        ]
      };
      res.status(mapped.status).json(errObj);
    }
  });
}

function addSensordData(app){
  return errorWrap(async function(req, res){
    try{
      const obj = req.body;
      obj.sensorId = req.params.id;
      const results = await app.locals.model.addSensorData(obj);
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
            "code":mapped.code,
            "message":mapped.message
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
  //console.log(err);
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