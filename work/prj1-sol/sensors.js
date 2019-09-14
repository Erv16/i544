'use strict';

const assert = require('assert');
// const sensor_data = require('/home/epalani1/cs544/data/sensors/sensor-data.json');
// const sensor = require('/home/epalani1/cs544/data/sensors/sensors.json');
// const sensor_type = require('/home/epalani1/cs544/data/sensors/sensor-types.json');
// const fs = require('fs');

class Sensors {


  constructor() {
    //@TODO
    this.sensor_data=[];
    this.sensor=[];
    this.sensor_type=[];
  }

  /** Clear out all data from this object. */
  async clear() {
    //@TODO
    this.sensor_type= [];
    this.sesnor = [];
    this.sensor_data=[];
  }

  /** Subject to field validation as per FN_INFOS.addSensorType,
   *  add sensor-type specified by info to this.  Replace any
   *  earlier information for a sensor-type with the same id.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensorType(info) {
    const sensorType = validate('addSensorType', info);
    //@TODO
    this.sensor_type.push(info);
  }
  
  /** Subject to field validation as per FN_INFOS.addSensor, add
   *  sensor specified by info to this.  Replace any earlier
   *  information for a sensor with the same id.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensor(info) {
    const sensor = validate('addSensor', info);
    //@TODO
    var check = false;
    for(let i = 0; i < this.sensor_type.length; i++){
      if(info.model === this.sensor_type[i].id){
        this.sensor.push(info);
        check = true;
      }
    }
    if(!check){
      throw [ `${info.model} does not contain a valid model id` ];
    }
  }

  /** Subject to field validation as per FN_INFOS.addSensorData, add
   *  reading given by info for sensor specified by info.sensorId to
   *  this. Replace any earlier reading having the same timestamp for
   *  the same sensor.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensorData(info) {
    const sensorData = validate('addSensorData', info);
    //@TODO
    var check = false;
    let data = info;
    for(let i = 0; i < this.sensor.length; i++){
      if(info.sensorId === this.sensor[i].id){
        
        var sensType = getSensorTypeProperty(this.sensor[i], this.sensor_type);
        if(parseInt(data.value,10) <= parseInt(sensType.limits.max,10) && parseInt(data.value,10) >= parseInt(sensType.limits.min,10)){
          
          if(parseInt(data.value,10) >= parseInt(this.sensor[i].expected.min,10) && parseInt(data.value,10) <= parseInt(this.sensor[i].expected.max,10)){
            
            data["status"] = 'ok';
          }
          else{
            data["status"] = 'outOfRange';
          }
        }
        else{data["status"] = 'error';
        }
        this.sensor_data.push(data);
        check = true;
      }
    }

    if(!check){
      throw [ `${info.sensorId} does not exist, data could not be recorded` ];
    }
  }

  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensorTypes, return all sensor-types which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of sensor types.  
   *
   *  The returned value should be an object containing a data
   *  property which is a list of sensor-types previously added using
   *  addSensorType().  The list should be sorted in ascending order
   *  by id.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  index property for the next search.  Note that the index (when 
   *  set to the lastIndex) and count search-spec parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensor-types which meet some filter criteria.
   *
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensorTypes(info) {
    const searchSpecs = validate('findSensorTypes', info);
    //@TODO
    var data = [];
    var nextIndex = searchSpecs.index;
    this.sensor_type.sort((a,b) => (a.id > b.id) ? 1 : -1);
    if(searchSpecs.id){
      if(!checkSensorTypeExists(searchSpecs,this.sensor_type)){
        throw [ `cannot find sensor-type for id "${searchSpecs.id}"` ];  
      }
    }
    if(Object.keys(searchSpecs).length === 3 && searchSpecs.id === null){
      for(let i = searchSpecs.index; i < ((+searchSpecs.index) + (+searchSpecs.count)); i++){
        data.push(this.sensor_type[i]);
        nextIndex++;
      }
      if(nextIndex >= this.sensor_type.length ){
        nextIndex = -1;
      }
      return {"nextIndex":nextIndex,data}; 
    }
      for(var property in searchSpecs){
        for(let i = 0; i < this.sensor_type.length; i++){
          if(this.sensor_type[i][property] === searchSpecs[property]){
           data.push(this.sensor_type[i]);
          }
          nextIndex++;
        }
      }

      if(nextIndex >= this.sensor_type.length ){
        nextIndex = -1;
      }
      return {"nextIndex":nextIndex,data}; 

  }
  
  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensors, return all sensors which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of a sensor.  
   *
   *  The returned value should be an object containing a data
   *  property which is a list of all sensors satisfying the
   *  search-spec which were previously added using addSensor().  The
   *  list should be sorted in ascending order by id.
   *
   *  If info specifies a truthy value for a doDetail property, 
   *  then each sensor S returned within the data array will have
   *  an additional S.sensorType property giving the complete 
   *  sensor-type for that sensor S.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  index property for the next search.  Note that the index (when 
   *  set to the lastIndex) and count search-spec parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensors which meet some filter criteria.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensors(info) {
    const searchSpecs = validate('findSensors', info);
    //@TODO
    var data = [];
    var nextIndex = searchSpecs.index;
    var tempIndex = searchSpecs.index;
    this.sensor.sort((a,b) => a.id > b.id ? 1 : -1);
    if(searchSpecs.id){
      if(!checkSensorExists(searchSpecs,this.sensor)){
        throw [ `cannot find sensor for id "${searchSpecs.id}"` ];
      }
    }
    
    if(Object.keys(searchSpecs).length === 4 && searchSpecs.id === null){
      for(let i = searchSpecs.index; i < ((+searchSpecs.index) + (+searchSpecs.count)); i++){
        data.push(this.sensor[i]);
        nextIndex++;
      }
      if(searchSpecs.doDetail){
        data.forEach(elem => elem.sensorType = getSensorTypeProperty(elem,this.sensor_type));
      }
      else if(!searchSpecs.doDetail){
        data.forEach(elem => delete elem.sensorType);
      }
      return {"nextIndex":(nextIndex >= this.sensor.length?-1:nextIndex),data}; 
    }

    let c = searchSpecs.count;
    for(var property in searchSpecs){
      if(searchSpecs.hasOwnProperty(property)){
        for(let i = searchSpecs.index; i < this.sensor.length; i++){
          if(c){
            if(this.sensor[i][property] === searchSpecs[property]){
              data.push(this.sensor[i]);
              nextIndex = tempIndex++;
              c--;
            }
          }
          tempIndex++;
        }
      }
      else{
        throw [ `No match found!` ];
      }
    }
    if(searchSpecs.doDetail){
      data.forEach(elem => elem.sensorType = getSensorTypeProperty(elem,this.sensor_type));
    }
    else if(!searchSpecs.doDetail){
      data.forEach(elem => delete elem.sensorType);
    }

  return {"nextIndex":(nextIndex >= this.sensor.length?-1:nextIndex),data};
  }
  
  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensorData, return all sensor reading which satisfy
   *  search specifications in info.  Note that info must specify a
   *  sensorId property giving the id of a previously added sensor
   *  whose readings are desired.  The search-specs can filter the
   *  results by specifying one or more statuses (separated by |).
   *
   *  The returned value should be an object containing a data
   *  property which is a list of objects giving readings for the
   *  sensor satisfying the search-specs.  Each object within data
   *  should contain the following properties:
   * 
   *     timestamp: an integer giving the timestamp of the reading.
   *     value: a number giving the value of the reading.
   *     status: one of "ok", "error" or "outOfRange".
   *
   *  The data objects should be sorted in reverse chronological
   *  order by timestamp (latest reading first).
   *
   *  If the search-specs specify a timestamp property with value T,
   *  then the first returned reading should be the latest one having
   *  timestamp <= T.
   * 
   *  If info specifies a truthy value for a doDetail property, 
   *  then the returned object will have additional 
   *  an additional sensorType giving the sensor-type information
   *  for the sensor and a sensor property giving the sensor
   *  information for the sensor.
   *
   *  Note that the timestamp and count search-spec parameters can be
   *  used in successive calls to allow scrolling through the
   *  collection of all readings for the specified sensor.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensorData(info) {
    const searchSpecs = validate('findSensorData', info);
    //@TODO
    var data = [];
    if(!validSensor(searchSpecs, this.sensor)){
        throw [ `unknown sensor id "${info.sensorId}"` ];
      }

      for(var property in searchSpecs){
        if(property === 'sensorId'){
          data = this.sensor_data.filter(element => element.sensorId === searchSpecs.sensorId);
         }
        else if(property === 'statuses'){
          data = data.filter(statElem => searchSpecs.statuses.has(statElem.status));
        }
        else if(property === 'timestamp'){
          data = data.filter(timeElem => timeElem.timestamp <= searchSpecs.timestamp)
        }
      }
      if(searchSpecs.doDetail){
        var sensor = getSensorProperty(searchSpecs,this.sensor);
        var sensorType = getSensorTypeProperty(sensor, this.sensor_type);
        data = data.slice(0,searchSpecs.count);
        return { data, sensorType, sensor};
      }
      data = data.slice(0,searchSpecs.count);
      return { data };    
  }
}

module.exports = Sensors;

//@TODO add auxiliary functions as necessary

function checkSensorTypeExists(info, sensorTypeArr){
  return sensorTypeArr.find(elem => elem.id === info.id);
}

function checkSensorExists(info, sensorArr){
  return sensorArr.find(elem => elem.id === info.id);
}

function getSensorProperty(elem, sensorInfo){
  return sensorInfo.find(item => elem.sensorId === item.id);
}

function getSensorTypeProperty(elem, sensorTypeInfo){
  return sensorTypeInfo.find(val => elem.model === val.id);
}

function validSensor(info, sensorArr){
  return sensorArr.find(elem => elem.id === info.sensorId);
}

const DEFAULT_COUNT = 5;    

/** Validate info parameters for function fn.  If errors are
 *  encountered, then throw array of error messages.  Otherwise return
 *  an object built from info, with type conversions performed and
 *  default values plugged in.  Note that any unknown properties in
 *  info are passed unchanged into the returned object.
 */
function validate(fn, info) {
  const errors = [];
  const values = validateLow(fn, info, errors);
  if (errors.length > 0) throw errors; 
  return values;
}

function validateLow(fn, info, errors, name='') {
  const values = Object.assign({}, info);
  for (const [k, v] of Object.entries(FN_INFOS[fn])) {
    const validator = TYPE_VALIDATORS[v.type] || validateString;
    const xname = name ? `${name}.${k}` : k;
    const value = info[k];
    const isUndef = (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    );
    values[k] =
      (isUndef)
      ? getDefaultValue(xname, v, errors)
      : validator(xname, value, v, errors);
  }
  return values;
}

function getDefaultValue(name, spec, errors) {
  if (spec.default !== undefined) {
    return spec.default;
  }
  else {
    errors.push(`missing value for ${name}`);
    return;
  }
}

function validateString(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'string') {
    errors.push(`require type String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
    return;
  }
  else {
    return value;
  }
}

function validateNumber(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  switch (typeof value) {
  case 'number':
    return value;
  case 'string':
    if (value.match(/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/)) {
      return Number(value);
    }
    else {
      errors.push(`value ${value} for ${name} is not a number`);
      return;
    }
  default:
    errors.push(`require type Number or String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
}

function validateInteger(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  switch (typeof value) {
  case 'number':
    if (Number.isInteger(value)) {
      return value;
    }
    else {
      errors.push(`value ${value} for ${name} is not an integer`);
      return;
    }
  case 'string':
    if (value.match(/^[-+]?\d+$/)) {
      return Number(value);
    }
    else {
      errors.push(`value ${value} for ${name} is not an integer`);
      return;
    }
  default:
    errors.push(`require type Number or String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
}

function validateRange(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'object') {
    errors.push(`require type Object for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
  return validateLow('_range', value, errors, name);
}

const STATUSES = new Set(['ok', 'error', 'outOfRange']);

function validateStatuses(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'string') {
    errors.push(`require type String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
  if (value === 'all') return STATUSES;
  const statuses = value.split('|');
  const badStatuses = statuses.filter(s => !STATUSES.has(s));
  if (badStatuses.length > 0) {
    errors.push(`invalid status ${badStatuses} in status ${value}`);
  }
  return new Set(statuses);
}

const TYPE_VALIDATORS = {
  'integer': validateInteger,
  'number': validateNumber,
  'range': validateRange,
  'statuses': validateStatuses,
};


/** Documents the info properties for different commands.
 *  Each property is documented by an object with the
 *  following properties:
 *     type: the type of the property.  Defaults to string.
 *     default: default value for the property.  If not
 *              specified, then the property is required.
 */
const FN_INFOS = {
  addSensorType: {
    id: { }, 
    manufacturer: { }, 
    modelNumber: { }, 
    quantity: { }, 
    unit: { },
    limits: { type: 'range' },
  },
  addSensor:   {
    id: { },
    model: { },
    period: { type: 'integer' },
    expected: { type: 'range' },
  },
  addSensorData: {
    sensorId: { },
    timestamp: { type: 'integer' },
    value: { type: 'number' },
  },
  findSensorTypes: {
    id: { default: null },  //if specified, only matching sensorType returned.
    index: {  //starting index of first result in underlying collection
      type: 'integer',
      default: 0,
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
  },
  findSensors: {
    id: { default: null }, //if specified, only matching sensor returned.
    index: {  //starting index of first result in underlying collection
      type: 'integer',
      default: 0,
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
    doDetail: { //if truthy string, then sensorType property also returned
      default: null, 
    },
  },
  findSensorData: {
    sensorId: { },
    timestamp: {
      type: 'integer',
      default: Date.now() + 999999999, //some future date
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
    statuses: { //ok, error or outOfRange, combined using '|'; returned as Set
      type: 'statuses',
      default: new Set(['ok']),
    },
    doDetail: {     //if truthy string, then sensor and sensorType properties
      default: null,//also returned
    },
  },
  _range: { //pseudo-command; used internally for validating ranges
    min: { type: 'number' },
    max: { type: 'number' },
  },
};  

