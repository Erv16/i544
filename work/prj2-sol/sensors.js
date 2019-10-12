'use strict';

const AppError = require('./app-error');
const validate = require('./validate');

const assert = require('assert');
const mongo = require('mongodb').MongoClient;

class Sensors {

  constructor(client,db){
    this.client = client;
    this.db = db;
  }

  /** Return a new instance of this class with database as
   *  per mongoDbUrl.  Note that mongoDbUrl is expected to
   *  be of the form mongodb://HOST:PORT/DB.
   */
  static async newSensors(mongoDbUrl) {
    //@TODO
    let client;
    let db;
    if(/(mongodb:)\/\/([a-z:]+[0-9]+)\/([a-z]+)/.test(mongoDbUrl)){
      let mongo_url = mongoDbUrl.slice(0,mongoDbUrl.lastIndexOf('/'));
      let db_name = mongoDbUrl.slice(mongoDbUrl.lastIndexOf('/')+1,mongoDbUrl.length);
      client = await mongo.connect(mongo_url,MONGO_OPTIONS);
      db = client.db(db_name);
    }
    else{
      const err = `${mongoDbUrl} is not a valid url. Please provide a valid url to proceed.`;
      throw [ new AppError('INVALID_URL',err) ];
    }    
    return new Sensors(client, db);    
  }

  /** Release all resources held by this Sensors instance.
   *  Specifically, close any database connections.
   */
  async close() {
    //@TODO
    await this.client.close();
  }

  /** Clear database */
  async clear() {
    //@TODO
    this.db.collection(SENSORTYPES_TABLE).deleteMany({});
    this.db.collection(SENSOR_TABLE).deleteMany({});
    this.db.collection(SENSOR_DATA_TABLE).deleteMany({});
  }

  /** Subject to field validation as per validate('addSensorType',
   *  info), add sensor-type specified by info to this.  Replace any
   *  earlier information for a sensor-type with the same id.
   *
   *  All user errors must be thrown as an array of AppError's.
   */

  async addSensorType(info) {
    const sensorType = validate('addSensorType', info);
    //@TODO
    let dbSensorType = await _toSensorType(sensorType);
    const dbSensorTypeTable = this.db.collection(SENSORTYPES_TABLE);
    let existingObject = await this.db.collection(SENSORTYPES_TABLE).findOne({_id:dbSensorType.id});
    if(existingObject){
      let ret = await this.db.collection(SENSORTYPES_TABLE).replaceOne({_id:dbSensorType.id},dbSensorType,{upsert:true});
    }
    else{
      try{
        let ret = await dbSensorTypeTable.insertOne(dbSensorType);
      }
      catch(err){
        throw [ new AppError('DATABASE',err) ];
      }
    }
  }
  
  /** Subject to field validation as per validate('addSensor', info)
   *  add sensor specified by info to this.  Note that info.model must
   *  specify the id of an existing sensor-type.  Replace any earlier
   *  information for a sensor with the same id.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async addSensor(info) {
    const sensor = validate('addSensor', info);
    //@TODO
    let check = await this.db.collection(SENSORTYPES_TABLE).findOne({_id:sensor.model});
    if(check){
      let dbSensor = await _toSensor(sensor);
      const dbSensorTable = this.db.collection(SENSOR_TABLE);
      let existingObject = await this.db.collection(SENSOR_TABLE).findOne({_id:dbSensor.id});
      if(existingObject){
        let ret = await this.db.collection(SENSOR_TABLE).replaceOne({_id:dbSensor.id},dbSensor,{upsert:true});
      }
      else{
        try{
          let ret = await dbSensorTable.insertOne(dbSensor);
        }
        catch(err){
          throw [ new AppError('DATABASE',err) ];
        }
      }
    }
    else{
      const err = `Cannot insert sensor ${sensor.model} as it does not have an existing Sensor Type`
      throw [ new AppError('TYPE',err) ];
    }
  }

  /** Subject to field validation as per validate('addSensorData',
   *  info), add reading given by info for sensor specified by
   *  info.sensorId to this. Note that info.sensorId must specify the
   *  id of an existing sensor.  Replace any earlier reading having
   *  the same timestamp for the same sensor.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async addSensorData(info) {
    const sensorData = validate('addSensorData', info);
    //@TODO
    let check = await this.db.collection(SENSOR_TABLE).findOne({_id:sensorData.sensorId});
    if(check){
      let sensor = await this.db.collection(SENSOR_TABLE).find({_id:sensorData.sensorId}).toArray();
      let sensorType = await this.db.collection(SENSORTYPES_TABLE).find({_id:sensor[0].model}).toArray();
      let dbSensorData = await _toSensorData(sensorData,sensor[0],sensorType[0]);
      const dbSensorDataTable = this.db.collection(SENSOR_DATA_TABLE);
      let existingObject = await this.db.collection(SENSOR_DATA_TABLE).findOne({sensorId:dbSensorData.sensorId,timestamp:dbSensorData.timestamp});
      if(existingObject){
        let ret = await this.db.collection(SENSOR_DATA_TABLE).replaceOne({sensorId:dbSensorData.sensorId,timestamp:dbSensorData.timestamp},dbSensorData,{upsert:true});
      }
      else{
         try{
          let ret = await dbSensorDataTable.insertOne(dbSensorData);
        }
        catch(err){
          throw [ new AppError('DATABASE',err) ];
        }
      }
    }  
    else{
      const err = `Cannot insert sensor data ${sensorData.sensorId} as it does not have an existing Sensor`
      throw [ new AppError('TYPE',err) ];
    } 
  }

  /** Subject to validation of search-parameters in info as per
   *  validate('findSensorTypes', info), return all sensor-types which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of sensor types (except for meta-properties starting
   *  with '_').
   *
   *  The returned value should be an object containing a data
   *  property which is a list of sensor-types previously added using
   *  addSensorType().  The list should be sorted in ascending order
   *  by id.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  _index meta-property for the next search.  Note that the _index
   *  (when set to the lastIndex) and _count search-spec
   *  meta-parameters can be used in successive calls to allow
   *  scrolling through the collection of all sensor-types which meet
   *  some filter criteria.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensorTypes(info) {
    //@TODO
    const searchSpecs = validate('findSensorTypes', info);
    let data = {};
    let nextIndex = -1;
    let index = searchSpecs['_index'];
    let count = searchSpecs['_count'];
    let sensorTypeObj = await _reformatSensorTypeObject(searchSpecs);
    let ret = await this.db.collection(SENSORTYPES_TABLE).find(sensorTypeObj).sort({"_id":1}).skip(index).limit(count+1).toArray();
    if(ret.length === (count+1)){
      ret.pop();
      nextIndex = index + count;
    } 

    ret.forEach(elem => {
      delete elem['_id'];
    })
    data = ret;    
    return {data, nextIndex};
  }
  
  /** Subject to validation of search-parameters in info as per
   *  validate('findSensors', info), return all sensors which satisfy
   *  search specifications in info.  Note that the search-specs can
   *  filter the results by any of the primitive properties of a
   *  sensor (except for meta-properties starting with '_').
   *
   *  The returned value should be an object containing a data
   *  property which is a list of all sensors satisfying the
   *  search-spec which were previously added using addSensor().  The
   *  list should be sorted in ascending order by id.
   *
   *  If info specifies a truthy value for a _doDetail meta-property,
   *  then each sensor S returned within the data array will have an
   *  additional S.sensorType property giving the complete sensor-type
   *  for that sensor S.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  _index meta-property for the next search.  Note that the _index (when 
   *  set to the lastIndex) and _count search-spec meta-parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensors which meet some filter criteria.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensors(info) {
    //@TODO
    const searchSpecs = validate('findSensors', info);
    let data = {};
    let index = searchSpecs['_index'];
    let count = searchSpecs['_count'];
    let nextIndex = -1;
    let doDetail = searchSpecs['_doDetail'];
    let sensorObj = await _reformatSensorTypeObject(searchSpecs);
    let ret = await this.db.collection(SENSOR_TABLE).find(sensorObj).sort({"_id":1}).skip(index).limit(count+1).toArray(); 
    if(ret.length === (count+1)){
      ret.pop();
      nextIndex = index + count;
    } 
    ret.forEach(elem => {
      delete elem['_id'];
    })
    data = ret;
    if(doDetail){
      for(let i = 0; i < data.length; i++){
        let temp = await this.db.collection(SENSORTYPES_TABLE).findOne({_id:data[i].model});
          delete temp['_id'];
          data[i].sensorType = temp;
      }
      return {data, nextIndex};
    }
    else{
      return { data:data, nextIndex};
    }
  }
  
  /** Subject to validation of search-parameters in info as per
   *  validate('findSensorData', info), return all sensor readings
   *  which satisfy search specifications in info.  Note that info
   *  must specify a sensorId property giving the id of a previously
   *  added sensor whose readings are desired.  The search-specs can
   *  filter the results by specifying one or more statuses (separated
   *  by |).
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
   *  Note that the timestamp search-spec parameter and _count
   *  search-spec meta-parameters can be used in successive calls to
   *  allow scrolling through the collection of all readings for the
   *  specified sensor.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensorData(info) {
    //@TODO
    const searchSpecs = validate('findSensorData', info);
    let data = [];
    let index = searchSpecs['_index'];
    let count = searchSpecs['_count'];
    let doDetail = searchSpecs['_doDetail'];
    let statuses = searchSpecs['statuses'];
    if(!(await this.db.collection(SENSOR_DATA_TABLE).findOne({sensorId:searchSpecs.sensorId}))){
      const err = `unknown sensor id ${searchSpecs.sensorId}`;
      throw [ new AppError('X_ID', err) ];
    }
    let ret = await this.db.collection(SENSOR_DATA_TABLE).find({sensorId:searchSpecs.sensorId}).sort({"timestamp":-1}).toArray();
    
    ret.forEach(elem => {
      delete elem['_id'];
    })
    
    for(let property in searchSpecs){
      if(property === 'timestamp'){
        ret = ret.filter(timeElem => timeElem.timestamp <= searchSpecs.timestamp);
      }
      if(property === 'statuses'){
        ret = ret.filter(statusElem => searchSpecs.statuses.has(statusElem.status));
      }
      
    }
    for(let i = 0; i < count; i++){
      data.push(ret[i]);
  }
  if(doDetail){
    let sensor = await this.db.collection(SENSOR_TABLE).findOne({_id:ret[0].sensorId});
    let sensorType = await this.db.collection(SENSORTYPES_TABLE).findOne({_id:sensor.model});
    delete sensor['_id'];
    delete sensorType['_id'];
    data.forEach(elem => delete elem['sensorId']);
    return {data, sensorType, sensor}
  }
    data.forEach(elem => delete elem['sensorId']);
    return { data };
  }
} //class Sensors

const SENSORTYPES_TABLE = 'sensorTypes';
const SENSOR_TABLE = 'sensor';
const SENSOR_DATA_TABLE = 'sensorData';

//helper functions
async function _toSensor(sensorInfo){
  try{
    let sensor = await _toDb(sensorInfo);
    return sensor;
  }
  catch(err){
    throw [ new AppError('PROMISE',err) ];
  }
}

async function _toSensorType(sensorTypesInfo){
  try{
    let sensorType = await _toDb(sensorTypesInfo);
    return sensorType;
  }
  catch(err){
    throw [ new AppError('PROMISE',err) ];
  }
}

async function _toSensorData(sensorDataObj, sensor, sensorType){
    let dbData = Object.assign({}, sensorDataObj);
    dbData.status = (!inRange(dbData.value, sensorType.limits) ? 'error' : 
    (!inRange(dbData.value, sensor.expected) ? 'outOfRange' : 'ok'));
    return dbData;
}

async function _toDb(data){
  let dbData = Object.assign({},data);
  if(dbData.id){
    dbData._id = dbData.id;
  }
  return dbData;
}

async function _reformatSensorTypeObject(searchSpecs){
  let obj = searchSpecs;
  for(let val in obj){
    if(obj[val] === null || obj[val] === undefined || val === '_index' || val === '_count' || val === '_doDetail'){
      delete obj[val];
    }
  }
    return obj;
}

module.exports = Sensors.newSensors;

//Options for creating a mongo client
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};


function inRange(value, range) {
  return Number(range.min) <= Number(value) && Number(value) <= Number(range.max);
}
