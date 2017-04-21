var notificiation = {
  "Notification_Request_ID": 1306898,
  "Creation_date": "2017-04-19T15:14:59.0286764",
  "Loc_Region_Name": "Import Export Testing",
  "Location_Name": "ImportTestingLocation",
  "Partition_Name": "Tech Space",
  "Module_Name": "AZP.S02.D14",
  "Device_Name": "B Side Temp",
  "Sensor_Name": "Relative Humidity",
  "Sensor_Type_CD": 14,
  "Device_Sensor_ID": "36d4a8ce-309a-e611-80c6-00155d6e0c04",
  "Notification_XML": "<State><Previous>Normal</Previous><Current>Alarm</Current><Priority>9</Priority><ThresholdID>518175</ThresholdID><Value>65</Value><AlarmTypeCD>5</AlarmTypeCD><ReadingDate>2017-04-19T15:14:48.8161450Z</ReadingDate></State>",
  "Bad_Quality_Priority_CD": 0,
  "Comm_Failure_Priority_CD": 0,
  "Normal_Min_Point": 12.1,
  "Normal_Max_Point": 64.77,
  "Warn_Min_Point": 5.81,
  "Warn_Max_Point": 72.06,
  "messageMetadata": {
    "createdOn": "2017-04-20T21:41:36.697Z",
    "createdBy": {
      "service": {
        "name": "@bl-library/gs_notification_push",
        "version": null
      },
      "hostname": "BL-P37-Web-01"
    },
    "publicationAddress": "queue://__gs_test"
  }
}

var parseString = require('xml2js').parseString;
var xml = notificiation.Notification_XML
parseString(xml, function(err,result){
    console.dir(result)
})
