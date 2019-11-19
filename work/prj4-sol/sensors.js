'use strict';

const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const querystring = require('querystring');

const Mustache = require('./mustache');
const widgetView = require('./widget-view');

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

const mustache = new Mustache();

function serve(port, model, base='') {
  //@TODO
  const app = express();
  app.locals.port = port;
  app.locals.base = base;
  app.locals.model = model;
  process.chdir(__dirname);
  app.use(base, express.static(STATIC_DIR));
  setUpRoutes(app);
  app.listen(port, function(){
    console.log(`listening on port ${port}`);
  });
}


module.exports = serve;

//@TODO
function setUpRoutes(app){
  const base = app.locals.base;
  app.get(`${base}/sensor-types.html`,searchSensorTypes(app));
  app.get(`${base}/sensors.html`,searchSensors(app));
  app.get(`${base}/sensor-types/add.html`, createUpdateSensorTypeForm(app));
  app.post(`${base}/sensor-types/add.html`, bodyParser.urlencoded({extended: true}), createUpdateSensorType(app));
  app.get(`${base}/sensors/add.html`, createUpdateSensorForm(app));
  app.post(`${base}/sensors/add.html`, bodyParser.urlencoded({extended: true}), createUpdateSensors(app));
}

function searchSensorTypes(app){
  return async function(req,res){
    let errors = {};
    const sensorTypeWidgetDef = [{
      name: 'id',
      label: 'Sensor Type Id',
      type: 'text',
      val: (`${req.query.id}` === 'undefined')?'':`${req.query.id}`,
      classes: ['tst-sensor-type-id']
    },
    {
      name: 'modelNumber',
      label: 'Model Number',
      type: 'text',
      val: (`${req.query.modelNumber}` === 'undefined')?'':`${req.query.modelNumber}`,
      classes: ['tst-model-number']
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      val: (`${req.query.manufacturer}` === 'undefined')?'':`${req.query.manufacturer}`,
      classes: ['tst-manufacturer']
    },
    { 
      type: 'select',
      name: 'quantity',
      label: 'Measure',
      choices: {
        '': 'Select',
        temperature: 'Temperature',
        pressure: 'Pressure',
        flow: 'Flow Rate',
        humidity: 'Relative Humidity'
      },
      classes: [ 'tst-quantity' ], 
      val: (`${req.query.quantity}` === undefined)?'Select':`${req.query.quantity}`,
    }
    ];

    let widgetPartial = '';

    for(const widget of sensorTypeWidgetDef){
      const view = widgetView(widget, {value: widget.val});
      widgetPartial += mustache.render('widget',view);
    }

    let sensorTypeData = {};
    try{
      sensorTypeData = await app.locals.model.list('sensor-types',req.query); 
    }
    catch(err){
      console.log(err);
    }

    let next = '';
    let prev = '';
    let nextFlag = false;
    let prevFlag = false;
    if(sensorTypeData.hasOwnProperty('next')){
      nextFlag = true;
      next = sensorTypeData.next.substr(sensorTypeData.next.indexOf('?'));
    } 
    
    if(sensorTypeData.hasOwnProperty('prev')){
      prevFlag = true;
      prev = sensorTypeData.prev.substr(sensorTypeData.prev.indexOf('?'));
    }

    const model = {widget: widgetPartial, sensorTypeData : sensorTypeData.data,
      next: nextFlag ? next : false, 
      prev: prevFlag ? prev : false};
    const html = mustache.render('sensor-type',model);
    res.send(html);
  };
};

function searchSensors(app){
  return async function(req,res){
    const sensorWidgetDef = [{
      name: 'id',
      label: 'Sensor Id',
      type: 'text',
      val: (`${req.query.id}` === 'undefined')?'':`${req.query.id}`,
      classes: ['tst-sensor-id']
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      value: (`${req.query.model}` === 'undefined') ? '' : `${req.query.model}`,
      classes: ['tst-model']
    },
    {
      name: 'period',
      label: 'Period',
      type: 'text',
      value: (`${req.query.period}` === 'undefined') ? '' : `${req.query.period}`,
      classes: ['tst-period numeric']
    }];

    let widgetPartial = '';

    for(const widget of sensorWidgetDef){
      const view = widgetView(widget,{value: widget.val});
      widgetPartial += mustache.render('widget',view);
    }

    let sensorData = {};
    try{
      sensorData = await app.locals.model.list('sensors',req.query); 
    }
    catch(err){
      console.log(err);
    }

    let next = '';
    let prev = '';
    let nextFlag = false;
    let prevFlag = false;
    if(sensorData.hasOwnProperty('next')){
      nextFlag = true;
      next = sensorData.next.substr(sensorData.next.indexOf('?'));
    } 
    
    if(sensorData.hasOwnProperty('prev')){
      prevFlag = true;
      prev = sensorData.prev.substr(sensorData.prev.indexOf('?'));
    }

    const model = {widget: widgetPartial, sensorData : sensorData.data,
                  next: nextFlag ? next : false, 
                  prev: prevFlag ? prev : false};    

    const html = mustache.render('sensor',model);
    res.send(html);
  };
};

function createUpdateSensorTypeForm(app){
  return async function(req, res){

    const addSensorTypeWidgetDef = [{
      name: 'id',
      label: 'Sensor Type ID *',
      type: 'text',
      value: '',
      classes: ['tst-sensor-type-id']
    },
    {
      name: 'modelNumber',
      label: 'Model Number *',
      type: 'text',
      value: '',
      classes: ['tst-model-number']
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer *',
      type: 'text',
      value: '',
      classes: ['tst-manufacturer']
    },
    {
      type: 'select',
      name: 'quantity',
      label: 'Measure',
      choices: {
        '': 'Select',
        temperature: 'Temperature',
        pressure: 'Pressure',
        flow: 'Flow Rate',
        humidity: 'Relative Humidity'
      },
      classes: [ 'tst-quantity' ], 
      value: ''
    },
    {
      type: 'interval',
      name: 'limits',
      label: 'Limits *',
      value: { min: '', max: ''},
      classes: [ 'numeric interval' ],
    }];

    let addSensorTypeWidgetPartial = '';

    for(const widget of addSensorTypeWidgetDef){
      const view = widgetView(widget);
      addSensorTypeWidgetPartial += mustache.render('widget',view);
    }

    let model = {sensorType: true, sensorTypeWidget: addSensorTypeWidgetPartial};
    const html = mustache.render('add', model);
    res.send(html);
  };
};

function createUpdateSensorType(app){
  return async function(req,res){
    const sensorTypeContent = clean(req.body);
    if(sensorTypeContent.quantity === 'temperature'){
      sensorTypeContent.unit = 'C';
    }
    if(sensorTypeContent.quantity === 'pressure'){
      sensorTypeContent.unit = 'PSI';
    }
    if(sensorTypeContent.quantity === 'flow'){
      sensorTypeContent.unit = 'gpm';
    }
    if(sensorTypeContent.quantity === 'humidity'){
      sensorTypeContent.unit = '%';
    }
    try{
      await app.locals.model.update('sensor-types',sensorTypeContent);
      res.redirect(`${app.locals.base}/sensor-types.html?id=${sensorTypeContent.id}`)
    }
    catch(err){
      console.error(err);
    }
  };
};

function createUpdateSensorForm(app){
  return async function(req, res){
    const addSensorWidgetDef = [{
      name: 'id',
      label: 'Sensor ID *',
      type: 'text',
      value: '',
      classes: ['tst-sensor-id']
    },
    {
      name: 'model',
      label: 'Model *',
      type: 'text',
      value: '',
      classes: ['tst-model']
    },
    {
      name: 'period',
      label: 'Period *',
      type: 'text',
      value: '',
      classes: ['tst-period numeric']
    },
    {
      type: 'interval',
      name: 'expected',
      label: 'Expected Range *',
      value: { min: '', max: '', },
      classes: [ 'numeric interval' ],
    }];

    let addSensorWidgetPartial = '';

    for(const widget of addSensorWidgetDef){
      const view = widgetView(widget);
      addSensorWidgetPartial += mustache.render('widget',view);
    }

    let model = {sensor: true, sensorWidget:addSensorWidgetPartial};
    const html = mustache.render('add', model);
    res.send(html);
  };
};

function createUpdateSensors(app){
  return async function(req,res){
    const sensorContent = clean(req.body);
    try{
      await app.locals.model.update('sensors',sensorContent);
      res.redirect(`${app.locals.base}/sensors.html?id=${sensorContent.id}`)
    }
    catch(err){
      console.error(err);
    }
  };
};

function wsErrors(err){
  const msg = (err.message) ? err.message : 'web service error';
  console.error(msg);
  return { _: [ msg ] };
}

function clean(value){
  let out = {};
  for(let propName in value){
    if(value[propName] === null || value[propName] === undefined || value[propName] === ''){
      delete value[propName];
    }
  }
  out = Object.assign(out,value);
  return out;
}

