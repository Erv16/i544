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

const sensorTypeField = {
  id:{
    regex: /^[a-zA-Z0-9\-\_]+$/,
    error: "Sensor Type ID field can contain only alphanumerics, '-' or '_' characters",
    requiredError: "A value for 'Sensor Type ID' must be provided"
  },
  modelNumber:{
    regex: /^[a-zA-Z0-9\-\' ]+$/,
    error: "Model Number field can contain only alphanumerics, '-',' or space",
    requiredError: "A value for 'Model Number' must be provided"
  },
  manufacturer:{
    regex: /^[a-zA-Z\-\' ]+$/,
    error: "The Manufacturer field can contain only alphabetics, '-',' or space",
    requiredError: "A value for 'Manufacturer' must be provided"
  },
  quantity:{
    regex: /\b(?:temperature|flow|pressure|humidity)\b/,
    error: "The Measure field must be one of Select, Temperature, Pressure, Flow Rate, Relative Humidity",
    requiredError: "A value for 'Quantity' must be provided"
  },
  limits:{
    min:{
      regex: /[0-9]/,
      error: "Min for 'Limits' must be a number",
    },
    max:{
      regex:/[0-9]/,
      error: "Max for 'Limits' must be a number",
    },
    requiredError: "Both Min and Max values must be specified for 'Limits'"
  }
};

const sensorField = {
  id:{
    regex: /^[a-zA-Z0-9\-\_]+$/,
    error: "Sensor ID field can contain only alphanumerics, '-' or '_' characters"
  },
  model:{
    regex: /^[a-zA-Z0-9\-\_]+$/,
    error: "Model field can contain only alphanumerics, '-' or '_' characters"
  },
  period:{
    regex: /^([+-]?[1-9]\d*|0)$/,
    error: "The Period field must be an integer"
  }
};

let errorValidation = [];
let addSensorTypeWidgetDef = [];

function searchSensorTypes(app){
  return async function(req,res){
    let sensorTypeError = '';
    let displaySummary = true;
    const sensorTypeWidgetDef = [{
      name: 'id',
      label: 'Sensor Type Id',
      type: 'text',
      val: (`${req.query.id}` === 'undefined')?'':`${req.query.id}`,
      classes: ['tst-sensor-type-id'],
      errors: errorModel('sensor-types','id',req.query.id) || ''
    },
    {
      name: 'modelNumber',
      label: 'Model Number',
      type: 'text',
      val: (`${req.query.modelNumber}` === 'undefined')?'':`${req.query.modelNumber}`,
      classes: ['tst-model-number'],
      errors: errorModel('sensor-types','modelNumber',req.query.modelNumber) || ''
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      val: (`${req.query.manufacturer}` === 'undefined')?'':`${req.query.manufacturer}`,
      classes: ['tst-manufacturer'],
      errors: errorModel('sensor-types','manufacturer',req.query.manufacturer) || ''
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
      errors: errorModel('sensor-types', 'quantity', req.query.quantity)
    }
    ];

    for(let i = 0; i < sensorTypeWidgetDef.length; i++){
     if(sensorTypeWidgetDef[i].errors !== '')
      {
        displaySummary = false;
      }
    }

    let widgetPartial = '';

    for(const widget of sensorTypeWidgetDef){
      const view = widgetView(widget, {value: widget.val, error: widget.errors});
      widgetPartial += mustache.render('widget',view);
    }

    let sensorTypeData = {};
    if(displaySummary){
    try{
      sensorTypeData = await app.locals.model.list('sensor-types',req.query); 
    }
    catch(err){
      console.error(err);
      sensorTypeError = wsErrors(err);
    }

    if(Object.keys(sensorTypeData).length === 0 && sensorTypeData.constructor === Object){
      sensorTypeError = 'No results found.'
      displaySummary = false;
    }
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
      prev: prevFlag ? prev : false,
      sensorTypeError: sensorTypeError,
      displaySummary: displaySummary};
    const html = mustache.render('sensor-type',model);
    res.send(html);
  };
};

function searchSensors(app){
  return async function(req,res){
    let sensorError = '';
    let displaySummary = true;
    const sensorWidgetDef = [{
      name: 'id',
      label: 'Sensor ID',
      type: 'text',
      val: (`${req.query.id}` === 'undefined')?'':`${req.query.id}`,
      classes: ['tst-sensor-id'],
      errors: errorModel('sensors','id',req.query.id) || ''
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      val: (`${req.query.model}` === 'undefined') ? '' : `${req.query.model}`,
      classes: ['tst-model'],
      errors: errorModel('sensors','model',req.query.model) || ''
    },
    {
      name: 'period',
      label: 'Period',
      type: 'text',
      val: (`${req.query.period}` === 'undefined') ? '' : `${req.query.period}`,
      classes: ['tst-period numeric'],
      errors: errorModel('sensors','period',req.query.period) || ''
    }];

    for(let i = 0; i < sensorWidgetDef.length; i++){
      if(sensorWidgetDef[i].errors !== '')
       {
         displaySummary = false;
       }
     }

    let widgetPartial = '';

    for(const widget of sensorWidgetDef){
      const view = widgetView(widget,{value: widget.val, error: widget.errors});
      widgetPartial += mustache.render('widget',view);
    }

    let sensorData = {};

    if(displaySummary){
    try{
      sensorData = await app.locals.model.list('sensors',req.query); 
    }
    catch(err){
      console.error(err);
      sensorError = wsErrors(err);
    }
    if(Object.keys(sensorData).length === 0 && sensorData.constructor === Object){
      sensorError = 'No results found.'
      displaySummary = false;
    }
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
                  prev: prevFlag ? prev : false,
                  sensorError: sensorError,
                  displaySummary: displaySummary};    

    const html = mustache.render('sensor',model);
    res.send(html);
  };
};

function createUpdateSensorTypeForm(app){
  return async function(req, res){
    addSensorTypeWidgetDef = [{
      name: 'id',
      label: 'Sensor Type ID *',
      type: 'text',
      value: '',
      classes: ['tst-sensor-type-id'],
      errors : ''
    },
    {
      name: 'modelNumber',
      label: 'Model Number *',
      type: 'text',
      value: '',
      classes: ['tst-model-number'],
      errors: ''
    },
    {
      name: 'manufacturer',
      label: 'Manufacturer *',
      type: 'text',
      value: '',
      classes: ['tst-manufacturer'],
      errors: ''
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
      value: '',
      errors: ''
    },
    {
      type: 'interval',
      name: 'limits',
      label: 'Limits *',
      value: { min: '', max: ''},
      classes: [ 'numeric interval' ],
      errors: ''
    }];    

    let addSensorTypeWidgetPartial = '';

    for(const widget of addSensorTypeWidgetDef){
      const view = widgetView(widget, {error: widget.errors});
      addSensorTypeWidgetPartial += mustache.render('widget',view);
    }

    let model = {sensorType: true, sensorTypeWidget: addSensorTypeWidgetPartial};
    const html = mustache.render('add', model);
    res.send(html);
  };
};

function createUpdateSensorType(app){
  return async function(req,res){
    //console.log(req.body);
    const sensorTypeContent = req.body;
    let errors = validate('sensor-types',sensorTypeContent);
   //console.log('SCT',sensorTypeContent.limits.min);
    if(!errors){
      switch(sensorTypeContent.quantity){
        case 'temperature':
            sensorTypeContent.unit = 'C';
            break;
        case 'pressure':
            sensorTypeContent.unit = 'PSI';
            break;
        case 'flow':
            sensorTypeContent.unit = 'gpm';
            break;
        case 'humidity':
            sensorTypeContent.unit = '%';
            break;
      }
      try{
        await app.locals.model.update('sensor-types',sensorTypeContent);
        res.redirect(`${app.locals.base}/sensor-types.html?id=${sensorTypeContent.id}`)
      }
      catch(err){
        console.error(err);
      }
    }
    if(errors){
      const addSensorTypeErrorWidgetDef = [{
        name: 'id',
        label: 'Sensor Type ID *',
        type: 'text',
        value: (`${sensorTypeContent.id}` === undefined)?'':`${sensorTypeContent.id}`,
        classes: ['tst-sensor-type-id'],
        errors : ''
      },
      {
        name: 'modelNumber',
        label: 'Model Number *',
        type: 'text',
        value: (`${sensorTypeContent.modelNumber}` === undefined)?'':`${sensorTypeContent.modelNumber}`,
        classes: ['tst-model-number'],
        errors: ''
      },
      {
        name: 'manufacturer',
        label: 'Manufacturer *',
        type: 'text',
        value: (`${sensorTypeContent.manufacturer}` === undefined)?'':`${sensorTypeContent.manufacturer}`,
        classes: ['tst-manufacturer'],
        errors: ''
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
        value: (`${sensorTypeContent.quantity}` === undefined)?'':`${sensorTypeContent.quantity}`,
        errors: ''
      },
      {
        type: 'interval',
        name: 'limits',
        label: 'Limits *',
        value: { min: (`${sensorTypeContent.limits.min}` === undefined)?'':`${sensorTypeContent.limits.min}`, 
                 max: (`${sensorTypeContent.limits.max}` === undefined)?'':`${sensorTypeContent.limits.max}`},
        classes: [ 'numeric interval' ],
        errors: ''
      }];

      for(let i = 0; i < addSensorTypeErrorWidgetDef.length; i++){
        addSensorTypeErrorWidgetDef[i].errors = errorValidation[addSensorTypeErrorWidgetDef[i].name];
      }
      let addSensorTypeWidgetPartial = '';

    for(const widget of addSensorTypeErrorWidgetDef){
      const view = widgetView(widget, {value: widget.value, error: widget.errors});
      addSensorTypeWidgetPartial += mustache.render('widget',view);
    }

    let model = {sensorType: true, sensorTypeWidget: addSensorTypeWidgetPartial};
    const html = mustache.render('add', model);
    res.send(html);
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

function errorModel(type, name, value){
  let errorMsg = '';
  let field_info = {};
  if(value === undefined || value === '') {
    return errorMsg;
  }
  switch(type){
    case 'sensor-types':
      field_info = sensorTypeField[name];
      //console.log(field_info);
      if(!value.match(field_info.regex)){
        errorMsg = field_info.error;
      }
      break;
    case 'sensors':
      field_info = sensorField[name];
      if(!value.match(field_info.regex)){
        errorMsg = field_info.error;
      }
      break;
  }
  return errorMsg;
}

function validate(type, value){
  switch(type){
    case 'sensor-types':
      let field_info;
      for(let prop in value){
        field_info = sensorTypeField[prop];
        if(prop !== 'limits'){
          if(value[prop] === ''){
            errorValidation[prop] = field_info.requiredError;
          }
          else{
            delete errorValidation[prop];
          }
        }
        else if(prop === 'limits'){
          if(value[prop].min === '' || value[prop].max === ''){
            errorValidation[prop] = field_info.requiredError;
          }
          else{
            delete errorValidation[prop];
          }
        }
      }
      console.log(errorValidation);
      break;
  }
  return Object.keys(errorValidation).length > 0 && errorValidation;
}

