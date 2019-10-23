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

const base = '/sensor-types';
//@TODO routing function, handlers, utility functions
function setupRoutes(app){
  app.use(cors());
  app.use(bodyParser.json());
  app.get(base,findSensorType(app)); 
}

function findSensorType(app){
  return async function(req, res){
    const q = req.query || {};
    console.log(q);
    try{
      const results = await app.locals.model.findSensorTypes(q);
      res.json(results);
    }
    catch(err){
      console.err(err);
    }
  };
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