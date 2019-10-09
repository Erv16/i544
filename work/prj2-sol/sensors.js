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
    if(/([a-z:]+)\/\/([a-z:]+[0-9]+)\/([a-z]+)/.test(mongoDbUrl)){
      let mongo_url = mongoDbUrl.slice(0,mongoDbUrl.lastIndexOf('/'));
      let db_name = mongoDbUrl.slice(mongoDbUrl.lastIndexOf('/')+1,mongoDbUrl.length);
      //console.log(mongo_url);
      // console.log(db_name);
      client = await mongo.connect(mongo_url,MONGO_OPTIONS);
      db = client.db(db_name);
    }
    else{
      const err = `${mongoDbUrl} is not a valid url. Please provide a valid url to proceed`;
      throw [ new AppError('URL',err) ];
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
    this.db.dropDatabase();
  }

  /** Subject to field validation as per validate('addSensorType',
   *  info), add sensor-type specified by info to this.  Replace any
   *  earlier information for a sensor-type with the same id.
   *
   *  All user errors must be thrown as an array of AppError's.
   */

   /**
    * Add in sensorType validation that checks if a sensorType exists
    * before inserting a new value else it should update an existing 
    * value
    */
  async addSensorType(info) {
    const sensorType = validate('addSensorType', info);
    //@TODO
    let dbSensorType = await toSensorType(sensorType);
    const dbSensorTypeTable = this.db.collection(SENSORTYPES_TABLE);
    try{
      let ret = await dbSensorTypeTable.insertOne(dbSensorType);
      assert(ret.insertedId = dbSensorType.id);
    }
    catch(err){
      throw err;
    }
    //console.log(sensorType);
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
    if(this.db.collection(SENSORTYPES_TABLE).find(info.model)){
      let dbSensor = await toSensor(sensor);
      const dbSensorTable = this.db.collection(SENSOR_TABLE);
      try{
        let ret = await dbSensorTable.insertOne(dbSensor);
        assert(ret.insertedId === dbSensor.id);
      }
      catch(err){
        throw err;
      }
    }
    else{
      throw 'Cannot insert sensor as type not found';
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
    if(this.db.collection(SENSOR_TABLE).find(info.sensorId)){
      let dbSensorData = await toSensorData(sensorData);
      const dbSensorDataTable = this.db.collection(SENSOR_DATA_TABLE);
      try{
        let ret = await dbSensorDataTable.insertOne(dbSensorData);
      }
      catch(err){
        throw err;
      }
    }
    else{
      console.log('not found');
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
    return { data: [], nextIndex: -1 };
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
    return { data: [], nextIndex: -1 };
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
    return { data: [], };
  }
} //class Sensors

const SENSORTYPES_TABLE = 'sensorTypes';
const SENSOR_TABLE = 'sensor';
const SENSOR_DATA_TABLE = 'sensorData';

async function toSensor(sensorInfo){
  try{
    let sensor = await _toDb(sensorInfo);
    return sensor;
  }
  catch(err){
    console.log('failed in sensor',err);
  }
}

async function toSensorType(sensorTypesInfo){
  try{
    let sensorType = await _toDb(sensorTypesInfo);
    return sensorType;
  }
  catch(err){
    console.log('failed',err);
  }
}

async function toSensorData(sensorDataInfo){
  try{
    let sensorData = await _toDb(sensorDataInfo);
    return sensorData;
  }
  catch(err){
    console.log('failed in sensorData',err);
  }
}

async function _toDb(data){
  let dbData = Object.assign({},data);
  if(dbData.id){
    dbData._id = dbData.id;
  }
  return dbData;
}

module.exports = Sensors.newSensors;

//Options for creating a mongo client
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};


function inRange(value, range) {
  return Number(range.min) <= value && value <= Number(range.max);
}
