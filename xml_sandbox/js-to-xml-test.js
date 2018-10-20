const builder = require("xmlbuilder");

inputData = {
"eventID": 4485461,
"eventDateTime": "2017-04-25T22:16:00.671Z",
"eventStatus": "Normal",
"eventDescription": "Alarm Status has cleared",
"alarmType": 5,
"alarmTypeDescription": "Reading",
"alarmPriority": 3,
"alarmPriorityDescription": "Medium",
"sensorCurrentMeasurement": 0,
"sensorCurrentMeasurementDescription": [
    {
    "measurementValueText": "False",
    "measurementValue": 0
    },
    {
    "measurementValueText": "True",
    "measurementValue": 1
    }
],
"sensorNormalRangeHigh": 1,
"sensorNormalRangeLow": 1,
"sensorWarningRangeHigh": 99999999999,
"sensorWarningRangeLow": -99999999999,
"sensorID": "1099004b-4d29-e711-80c7-b82a72db462d",
"sensorName": "Intel Comm OK",
"deviceName": "GS test server",
"moduleName": "GSTEST Part",
"partitionName": "GSTEST Part",
"locationName": "GS Push Test",
"regionName": "Testing",
"badQualityPriority": 0,
"commFailurePriority": 0,
"thresholds": [
    {
    "sortOrder": 1,
    "priorityCD": 3,
    "minPoint": -99999999999,
    "maxPoint": 1,
    "thresholdDescription": null
    },
    {
    "sortOrder": 2,
    "priorityCD": 0,
    "minPoint": 1,
    "maxPoint": 1,
    "thresholdDescription": null
    },
    {
    "sortOrder": 3,
    "priorityCD": 3,
    "minPoint": 1,
    "maxPoint": 99999999999,
    "thresholdDescription": null
    }
]
}   

function createXMLEvent(data){
    let eventId = data.eventID;
    
    // timestamp options
    let options = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'UTC'
    }

    let now = new Date();
    let thresholds = data.thresholds
    let measurements = data.sensorCurrentMeasurementDescription
    let currentTime = now.toLocaleDateString('en-us', options).replace(",","")
    let eventStatus = "Normal";
    let eventDescription = "Alarm status has cleared";
    let alarmType = 5;
    let alarmTypeDescription = "Reading";
    let alarmPriority = 5;
    let alarmPriorityDescription = "Medium Low"
    let sensorCurrentMeasurement = 10;
    let sensorNormalRangeHigh = data.sensorNormalRangeHigh
    let sensorNormalRangeLow = data.sensorNormalRangeLow
    let sensorWarningRangeHigh = data.sensorWarningRangeHigh
    let sensorWarningRangeLow = data.sensorWarningRangeLow
    let sensorId = data.sensorID
    let sensorName = data.sensorName
    let deviceName = data.deviceName
    let moduleName = data.moduleName
    let partitionName = data.partitionName
    let locationName = data.locationName
    let regionName = data.regionName
    let badQualityPriority = data.badQualityPriority
    let commFailurePriority = data.commFailurePriority

    let xml = builder.create("Event")
            .ele("EventId", eventId).up()
            .ele("EventDateTime", currentTime).up()
            .ele("EventStatus", eventStatus).up()
            .ele("EventDescription", eventDescription).up()
            .ele("AlarmType", alarmType).up()
            .ele("AlarmTypeDescription", alarmTypeDescription).up()
            .ele("AlarmPriority", alarmPriority).up()
            .ele("AlarmPriorityDescription", alarmPriorityDescription).up()
            .ele("SensorCurrentMeasurement", sensorCurrentMeasurement).up()

                //creates xml fragment to import to main body
    let measurementXML = builder.create("SensorCurrentMeasurementDescriptions")

    //loops through measurements array and maps them as attribute nodes to SensorCurrentMeasurements node        
    if (measurements !== null){measurements.map(measurement =>{
            measurementAttrib = builder.create("Measurement")
                .att("Description", measurement.measurementValueText)
                .att("Value", measurement.measurementValue)
                measurementXML.importDocument(measurementAttrib);
        })
    }
    
    //appends node to main body of XML
    xml.importDocument(measurementXML)
        .ele("SensorNormalRangeHigh" , sensorNormalRangeHigh).up()
        .ele("SensorNormalRangeLow", sensorNormalRangeLow).up()
        .ele("SensorWarningRangeHigh", sensorWarningRangeHigh).up()
        .ele("SensorWarningRangeLow", sensorWarningRangeLow).up()
        .ele("SensorId", sensorId).up()
        .ele("SensorName", sensorName).up()
        .ele("DeviceName", deviceName).up()
        .ele("ModuleName", moduleName).up()
        .ele("PartitionName", partitionName).up()
        .ele("LocationName", locationName).up()
        .ele("RegionName", regionName).up()
        .ele("BadQualityPriority", badQualityPriority).up()
        .ele("CommFailurePriority", commFailurePriority).up()

    //creates xml fragment to import to main body
    let thresholdXML = builder.create("Thresholds")

    //loops through thresholds array and maps them as attribute nodes to Thresholds node        
    thresholds.map(threshold =>{
        threshAttrib = builder.create("Threshold")
            .att("SortOrder", threshold.sortOrder)
            .att("Priority", threshold.priorityCD)
            .att("MinValue", threshold.minPoint)
            .att("MaxValue", threshold.maxPoint)
            
            thresholdXML.importDocument(threshAttrib)

    })

    //appends node to main body of XML
    xml.importDocument(thresholdXML)

    //testing : must add .end({pretty:true}) to get Stringication
    return xml.end({pretty:true})   
}
//console.log(createXMLEvent(inputData))



sqlDate = '2017-04-28 00:13:57.8193587'

let options = {hour: 'numeric',minute: 'numeric',second: 'numeric',timeZone: 'UTC'}

let date = new Date(sqlDate).toLocaleDateString('en-us', options).replace(",","");

console.log(date)
console.log(sqlDate)
console.log(new Date('1/25/1982').toLocaleDateString('en-us', options).replace(",",""))