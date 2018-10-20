/*Script Name:bl_push_api_utility*/
'use strict';

const blQuery = require("bl_dbquery");
const xml2js = require("bl_xml2js");
const blHttp = require("bl_http");
const builder = require("bl_xmlbuilder");

module.exports = {
    performAllSteps,//This does the entire process and sends the notification.
    getDBPushNotificationsQueryResult,//gets the notifications to send from the db.
    getNotificationMessageFromQueryResult,//formats the notification so they are ready to send.
    setDBPushNotificationQuery, //update the DB once notification has been sent successfully
    sendNotificationMessage,
    enumAlarmTypeDescription,
    enumEventDescription,
    enumPriorityDescription,
    getEmptyNotification,
    getEmptyMeasurement,
    getEmptyThreshold,
};

function performAllSteps(loginID,
    applicationGuid,
    applicationTypeCD,
    maxRows,
    pushCompanyID,
    returnItemsInResult,
    callback) {
    //this has to run in 3.5 so we cannot use waterfall.

    //Gets notifications we need to send for this companyID
    getDBPushNotificationsQueryResult(
        loginID,
        applicationGuid,
        applicationTypeCD,
        maxRows,
        pushCompanyID,
        (err, data) => {
            if (err) {
                callback(err, null);

            }
            else {
                //Converts the db data which returns 5 rows into an easy to work with object.
                var notiMessage = getNotificationMessageFromQueryResult(data);
                var xmlstring = createXMLEvent(notiMessage)
                let notiCount = 0;
                if (notiMessage != null && notiMessage.notification != null && notiMessage.notification.items != null) {
                    notiCount = notiMessage.notification.items.length;
                }
                //We have to create an entry in the Push table to get an ID that we will refer to later on.
                getNewPushID(loginID,
                    applicationGuid,
                    pushCompanyID,
                    notiCount, (err, newPushID) => {
                        if (err) {
                            callback(err, null);
                            return;
                        }

                        notiMessage.notification.Push_Request_ID = newPushID;
                        
                        //Now we need to send which is either going to send the notifications or send a heart beat.
                        sendNotificationMessage(notiMessage, loginID, applicationGuid, (err, pushResult) => {
                            if (pushResult.errorMessage != null) {
                                //we have an error message and we want to see.
                                callback(new Error("Error Sending Notification:" + JSON.stringify(pushResult)), null);
                                return;
                            }
                            else {



                                //if (!pushResult.sentHeartbeat) {
                                    //we sent a heart beat and not messages....

                                //}
                                
                                let maxNotificationRequestID = pushResult.messageDetails.notification.Highest_Notification_Request_ID_Returned;
                                let pushCompanyID = pushResult.messageDetails.urlConfig.Push_Company_ID;
                                let minNotificationRequestID = pushResult.messageDetails.notification.Lowest_Notification_Request_ID_Returned;
                                let notificationCount = pushResult.notificationCountSentSuccessfully;

                                //we have sent the http message now we have to mark this complete in the db.
                                setDBPushNotificationQuery(pushResult, loginID, applicationGuid, newPushID, maxNotificationRequestID, pushCompanyID, minNotificationRequestID, notificationCount, returnItemsInResult, callback)
                            }
                        });

                    }
                );
            }
        });

}


function getNewPushID(loginID, applicationGuid, companyID, notificationCount, callback) {
    const queryParameters = {
        "Login_ID": loginID,
        "Application_GUID": applicationGuid,
        "Push_Request_ID": null,
        "Max_Notification_Request_ID": null,
        "Push_Company_ID": companyID,
        "Min_Notification_Request_ID": null,
        "Notification_Count": notificationCount,
        "Is_Complete": 0
    };//{"DBQueryParameters":"bl_push_api_last_notify_set"}

    blQuery.executeUpdateQuery(
        "bl_push_api_last_notify_set",
        queryParameters,
        (err, data) => {
            if (err) {
                callback(new Error("Error getting new Push Request ID:" + err.message), null);
                return;
            }
            else {
                if (data != null && data.tables != null && data.tables.length > 0 && data.tables[0].columns != null && data.tables[0].rows != null && data.tables[0].columns.length > 1 && data.tables[0].rows.length > 0) {
                    let newPushID = data.tables[0].rows[0][1];
                    if (newPushID == null) {
                        callback(new Error("Did not receive new Push ID. " + JSON.stringify(data)), null);
                        return;
                    }
                    else {
                        callback(null, newPushID);
                        return;
                    }

                }
                else {
                    callback(new Error("Did not receive new Push ID. " + JSON.stringify(data)), null);
                    return;
                }
            }
        }
    );
}


function getDBPushNotificationsQueryResult(loginID, applicationGuid, applicationTypeCD, maxRows, pushCompanyID, callback) {
    if (applicationGuid == null && loginID == null) {
        callback(new Error("You must pass in either loginID or applicationGuid"), null);
    }

    const queryParameters = {
        "Login_ID": null,
        "Application_GUID": applicationGuid,
        "Max_Rows": maxRows,
        "Push_Company_ID": pushCompanyID,
        "Debug": 1
    };//{"DBQueryParameters":"bl_push_api_notifications_get"}

    blQuery.executeReadQuery(
        "bl_push_api_notifications_get",
        queryParameters,
        (err, data) => {
            if (err) {
                callback(err, null);
                return;
            }
            else {
                callback(null, data);

            }
        }
    );
}

function setDBPushNotificationQuery(pushResult, loginID, applicationGuid, pushRequestID, maxNotificationRequestID, pushCompanyID, minNotificationRequestID, notificationCount, returnItemsInResult, callback) {
    if (applicationGuid == null && loginID == null) {
        callback(new Error("You must pass in either loginID or applicationGuid"), null);
    }

    const queryParameters = {
        "Login_ID": null,
        "Application_GUID": applicationGuid,
        "Push_Request_ID": pushRequestID,
        "Max_Notification_Request_ID": maxNotificationRequestID,
        "Push_Company_ID": pushCompanyID,
        "Min_Notification_Request_ID": minNotificationRequestID,
        "Notification_Count": notificationCount,
        "Is_Complete": 1
    };//{"DBQueryParameters":"bl_push_api_last_notify_set"}

    blQuery.executeUpdateQuery(
        "bl_push_api_last_notify_set",
        queryParameters,
        (err, data) => {
            if (err) {
                callback(new Error("Error setting push api last notify:" + err.message + " " + JSON.stringify(pushResult)), null);
                return;
            }
            else {
                if (data != null && data.tables != null && data.tables.length > 0 && data.tables[0].columns != null && data.tables[0].rows != null && data.tables[0].columns.length > 0 && data.tables[0].rows.length > 0) {
                    let rowsUpdated = data.tables[0].rows[0][0];
                    if (rowsUpdated > 0) {
                        pushResult.rowsUpdated = rowsUpdated;
                        pushResult.lastNotifySet = true;
                        if(!returnItemsInResult){
                            if(pushResult != null && pushResult.messageDetails != null && pushResult.messageDetails.notification != null) {
                                pushResult.messageDetails.notification.items = null;
                            }
                        }
                        callback(null, pushResult);
                        return;
                    }
                    else {
                        callback(new Error("DB Call to push api last notify returned 0 rows updated:" + JSON.stringify(pushResult)), null);
                        return;
                    }

                }
                else {
                    callback(new Error("DB Call to push api last notify returned no rows:" + JSON.stringify(pushResult)), null);
                    return;
                }
            }
        }
    );
}

function sendNotificationMessage(
    notificationMessage,
    loginID,
    applicationGuid,
    callback) {
    if (notificationMessage == null) {
        callback(new Error("notification Message is null"));
        return;
    }
    else if (notificationMessage.urlConfig == null) {
        callback(new Error("notificationMessage.urlConfig cannot be null"));
        return;
    }
    else if (notificationMessage.urlConfig.Http_Post_URL == null) {
        callback(new Error("notificationMessage.urlConfig.Http_Post_URL cannot be null"));
        return;
    }
    else if (!notificationMessage.urlConfig.Is_Active) {
        callback(new Error("The request company url is not active."));
        return;
    }

    let pushResult = getEmptyPushResult();
    pushResult.errorMessage = null;
    pushResult.notificationCountSentSuccessfully = 0;
    pushResult.notificationCountToSend = notificationMessage.notification.items == null ? 0 : notificationMessage.notification.items.length;
    pushResult.messageDetails = notificationMessage;

    if (notificationMessage.notification.items != null && notificationMessage.notification.items.length > 0) {
        
        let apiEndpoint = notificationMessage.urlConfig.Http_Post_URL;
        const transmitWrapper = {
            notificationRequest: {
                notificationId: notificationMessage.notification.Push_Request_ID,
                event: notificationMessage.notification.items
            }
        };

        const transmitBody = JSON.stringify(transmitWrapper, null, 2);

        blHttp.post(
            apiEndpoint,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            transmitBody,
            (err, result) => {
                if (err) {
                    pushResult.errorMessage = err.message;
                }
                else if (result.statusCode !== 200) {
                    let message = `Bad status code: ${result.statusCode}: ${result.statusMessage}`;
                    pushResult.errorMessage = message;
                }
                else {
                    pushResult.notificationCountSentSuccessfully = pushResult.notificationCountToSend
                }
                callback(null, pushResult);
            }
        );
    }
    else {
        //send heartbeat instead......

        
        let apiEndpoint = notificationMessage.urlConfig.Http_Post_URL;
        let currentTime = (new Date()).toISOString();
        let eventInterval = 60;
        const transmitWrapper = createHeartbeatXML(notificationMessage.notification.Push_Request_ID, currentTime, eventInterval);
            
        //transmitWrapper.notificationRequest.notificationId = notificationMessage.notification.Push_Request_ID;
        //transmitWrapper.notificationRequest.event.eventInterval = 60;
        //transmitWrapper.notificationRequest.event.eventDateTime = (new Date()).toISOString();
        const transmitBody = transmitWrapper
        blHttp.post(
            apiEndpoint,
            {
                headers: {
                    'Content-Type': 'application/xml'
                }
            },
            transmitBody,
            (err, result) => {
                if (err) {
                    pushResult.errorMessage = "Heartbeat Send Error:" + err.message;
                }
                else if (result.statusCode !== 200) {
                    let message = `Heartbeat Send Error - Bad status code: ${result.statusCode}: ${result.statusMessage}`;
                    pushResult.errorMessage = message;
                }
                else {
                    pushResult.sentHeartbeat = true;
                }
                callback(null, pushResult);
            }
        );

    }
}


function getNotificationMessageFromQueryResult(data) {
    let expectedTableLength = 5;
    if (data == null || data.tables == null || data.tables.length != expectedTableLength) {
        throw new Error("data passed should not be null and the length of tables should be exactly" + expectedTableLength + ".");
    }
    let messageToSend = {
        "urlConfig": {
            "Http_Post_TimeOut": null
            , "Is_Active": false
            , "Push_Company_ID": null
            , "Push_Company_Name": null
            , "Http_Post_URL": null
        },
        "notification": {
            "Highest_Notification_Request_ID_Returned": null,
            "Lowest_Notification_Request_ID_Returned": null,
            "Push_Request_ID": null,//This is created every time we run.
            "items": [getEmptyNotification()]//put this in here to help intellisense but clear it out.
        }
    };

    messageToSend.notification.items = [];


    //Build the thresholds
    let threshDict = {};//same sensor may be in notifications multiple times - build a dictionary of thresholds.
    if (data.tables[1].rows != null && data.tables[1].rows.length > 0 && data.tables[1].columns != null && data.tables[1].columns.length > 0) {
        const columnIndexes = { "Device_Sensor_ID": 0, "Sort_Order": 1, "Priority_CD": 2, "Min_Point": 3, "Max_Point": 4, "Threshold_Description": 5 };//{"DBQueryTable":"bl_push_api_notifications_get","TableIndex":1}
        let table = data.tables[1];
        for (let i = 0; i < table.rows.length; i++) {
            let row = table.rows[i];
            let sensorID = row[columnIndexes.Device_Sensor_ID];
            let threshold = getEmptyThreshold();
            threshold.maxPoint = row[columnIndexes.Max_Point];
            threshold.minPoint = row[columnIndexes.Min_Point];
            threshold.priorityCD = row[columnIndexes.Priority_CD];
            threshold.sortOrder = row[columnIndexes.Sort_Order];
            threshold.thresholdDescription = row[columnIndexes.Threshold_Description];
            if (threshDict[sensorID] == null) {
                threshDict[sensorID] = [threshold];
            }
            else {
                threshDict[sensorID].push(threshold);
            }
        }

    }

    //build measurements
    let measurementDict = {};
    if (data.tables[2].rows != null && data.tables[2].rows.length > 0 && data.tables[2].columns != null && data.tables[2].columns.length > 0) {
        const columnIndexes = { "Sensor_Type_CD": 0, "Measurement_Value_Text": 1, "Measurement_Value": 2 } //{"DBQueryTable":"bl_push_api_notifications_get","TableIndex":2}
        let table = data.tables[2];
        for (let i = 0; i < table.rows.length; i++) {
            let row = table.rows[i];
            let sensorTypeCD = row[columnIndexes.Sensor_Type_CD];
            let measurement = getEmptyMeasurement();
            measurement.measurementValueText = row[columnIndexes.Measurement_Value_Text];
            measurement.measurementValue = row[columnIndexes.Measurement_Value];
            if (measurementDict[sensorTypeCD] == null) {
                measurementDict[sensorTypeCD] = [measurement];
            }
            else {
                measurementDict[sensorTypeCD].push(measurement);
            }
        }

    }

    if (data.tables[0].rows != null && data.tables[0].rows.length > 0 && data.tables[0].columns != null && data.tables[0].columns.length > 0) {
        const columnIndexes = {
            "Notification_Request_ID": 0,
            "Creation_Date": 1,
            "Loc_Region_Name": 2,
            "Location_Name": 3,
            "Partition_Name": 4,
            "Module_Name": 5,
            "Device_Name": 6,
            "Sensor_Name": 7,
            "Sensor_Type_CD": 8,
            "Device_Sensor_ID": 9,
            "Notification_XML": 10,
            "Bad_Quality_Priority_CD": 11,
            "Comm_Failure_Priority_CD": 12,
            "Normal_Min_Point": 13,
            "Normal_Max_Point": 14,
            "Warn_Min_Point": 15,
            "Warn_Max_Point": 16
        };//{"DBQueryTable":"bl_push_api_notifications_get","TableIndex":0}
        let table = data.tables[0];

        for (let i = 0; i < table.rows.length; i++) {
            let row = table.rows[i];
            let xml = row[columnIndexes.Notification_XML];
            let parser = new xml2js.Parser();
            let extractedData
            parser.parseString(xml, function (err, result) {
                //console.dir(result)
                extractedData = result;
            });


            if (extractedData == null) {
                throw new Error("Cannot parse xml in " + row[columnIndexes.Notification_Request_ID] + ". Remove the item from the table or fix the xml. Notification_XML " + xml);
            }

            let now = new Date();
            let currentTime = now.toISOString();
            let previous = extractedData.State.Previous ? extractedData.State.Previous[0] : null
            let current = extractedData.State.Current[0]
            let alarmPriorityCD = parseInt(extractedData.State.Priority[0]);
            let sensorTypeCD = row[columnIndexes.Sensor_Type_CD]
            let alarmTypeCD = parseInt(extractedData.State.AlarmTypeCD[0]);
            let noti = getEmptyNotification();
            noti.eventID = row[columnIndexes.Notification_Request_ID];
            noti.eventDateTime = currentTime;
            noti.eventStatus = current;
            noti.eventDescription = enumEventDescription(alarmTypeCD, current, previous);
            noti.alarmType = alarmTypeCD;
            noti.alarmTypeDescription = enumAlarmTypeDescription(alarmTypeCD);
            noti.alarmPriority = alarmPriorityCD;
            noti.alarmPriorityDescription = enumPriorityDescription(alarmPriorityCD);
            noti.sensorCurrentMeasurement = parseInt(extractedData.State.Value[0]);
            let measurements = measurementDict[sensorTypeCD]
            noti.sensorCurrentMeasurementDescription = measurements == null ? null : measurements;
            noti.sensorNormalRangeHigh = row[columnIndexes.Normal_Max_Point] || null;
            noti.sensorNormalRangeLow = row[columnIndexes.Normal_Min_Point] || null;
            noti.sensorWarningRangeHigh = row[columnIndexes.Warn_Max_Point] || null;
            noti.sensorWarningRangeLow = row[columnIndexes.Warn_Min_Point] || null;
            noti.sensorID = row[columnIndexes.Device_Sensor_ID];
            noti.sensorName = row[columnIndexes.Sensor_Name];
            noti.deviceName = row[columnIndexes.Device_Name];
            noti.moduleName = row[columnIndexes.Module_Name];
            noti.partitionName = row[columnIndexes.Partition_Name];
            noti.locationName = row[columnIndexes.Location_Name];
            noti.regionName = row[columnIndexes.Loc_Region_Name];
            noti.badQualityPriority = row[columnIndexes.Bad_Quality_Priority_CD];
            noti.commFailurePriority = row[columnIndexes.Comm_Failure_Priority_CD];
            let thresholds = threshDict[noti.sensorID]
            noti.thresholds = thresholds == null ? null : thresholds;//maybe they would like an empty array here if undefined or null?
            messageToSend.notification.items.push(noti);
        }
    }


    if (data.tables[3].rows != null && data.tables[3].rows.length > 0 && data.tables[3].columns != null && data.tables[3].columns.length > 0) {
        const columnIndexes = { "Highest_Notification_Request_ID_Returned": 0, "Lowest_Notification_Request_ID_Returned": 1 };//{"DBQueryTable":"bl_push_api_notifications_get","TableIndex":3} 
        let table = data.tables[3];
        let rows = table.rows[0];
        messageToSend.notification.Highest_Notification_Request_ID_Returned = rows[columnIndexes.Highest_Notification_Request_ID_Returned];
        messageToSend.notification.Lowest_Notification_Request_ID_Returned = rows[columnIndexes.Lowest_Notification_Request_ID_Returned];
    }

    if (data.tables[4].rows != null && data.tables[4].rows.length > 0 && data.tables[4].columns != null && data.tables[4].columns.length > 0) {
        const columnIndexes = { "Http_Post_TimeOut": 0, "Is_Active": 1, "Push_Company_ID": 2, "Push_Company_Name": 3, "Http_Post_URL": 4 };//{"DBQueryTable":"bl_push_api_notifications_get","TableIndex":4} 
        let table = data.tables[4];
        let rows = table.rows[0];
        messageToSend.urlConfig.Http_Post_TimeOut = rows[columnIndexes.Http_Post_TimeOut];
        messageToSend.urlConfig.Is_Active = rows[columnIndexes.Is_Active] == 1;
        messageToSend.urlConfig.Push_Company_ID = rows[columnIndexes.Push_Company_ID];
        messageToSend.urlConfig.Push_Company_Name = rows[columnIndexes.Push_Company_Name];
        messageToSend.urlConfig.Http_Post_URL = rows[columnIndexes.Http_Post_URL];
    }

    //if (messsageToSend.notification.items.length == 0) {
    //   messageToSend.heartBeat = emptyHeartbeat();
    //}

    return messageToSend;
}




// determines alarm type description based on alarm type cd
//{ UNKNOWN = 1, OK = 2, WARNING = 3, BAD_QUALITY = 4, READING = 5, COMMUNICATION_FAILURE = 6 }
function enumAlarmTypeDescription(alarmTypeCD) {
    let AlarmTypeDescription;
    switch (alarmTypeCD) {
        case 1:
            AlarmTypeDescription = 'Unknown';
            break;
        case 2:
            AlarmTypeDescription = 'Ok';
            break;
        case 3:
            AlarmTypeDescription = 'Warning';
            break;
        case 4:
            AlarmTypeDescription = 'Bad_Quality';
            break;
        case 5:
            AlarmTypeDescription = 'Reading';
            break;
        case 6:
            AlarmTypeDescription = 'Communication_Failure';
            break;
        default:
            AlarmTypeDescription = '';
            break
    }
    return AlarmTypeDescription;
}

//determines event description based on alarm type cd
function enumEventDescription(alarmTypeCD, current, previous) {
    let eventDescriptionStr;
    if (previous == null) {
        previous = 'Normal';
    }
    if (current == 'Normal') {
        eventDescriptionStr = 'Alarm Status has cleared';
    }
    else if (current == 'Alarm') {

        switch (alarmTypeCD) {
            case 4:
                eventDescriptionStr = `Status changed from ${previous} to Bad Quality`;
                break;
            case 6:
                eventDescriptionStr = `Status changed from ${previous} to Communication Failure`
                break;
            default:

                if (previous == 'Alarm') {
                    eventDescriptionStr = `Status changed to Alarm`;
                }
                else {
                    eventDescriptionStr = `Status changed from ${previous} to Alarm`
                }
                break;
        }
    }
    return eventDescriptionStr;
};


//determines priority description based on alarm priority CD
function enumPriorityDescription(alarmPriorityCD) {
    let priorityDescription;
    switch (alarmPriorityCD) {
        case 0:
            priorityDescription = 'Normal';
            break;
        case 1:
            priorityDescription = 'Highest';
            break;
        case 2:
            priorityDescription = 'High';
            break;
        case 3:
            priorityDescription = 'Medium';
            break;
        case 4:
            priorityDescription = 'Medium_Low';
            break;
        case 5:
            priorityDescription = 'Low';
            break;
        default:
            priorityDescription = null;
            break
    }
    return priorityDescription;
};


//returns an empty notifcation object. works great for intellisense.
function getEmptyNotification() {
    let emptyNotifaction = {
        eventID: null,
        eventDateTime: null,
        eventStatus: null,
        eventDescription: null,
        alarmType: null,
        alarmTypeDescription: null,
        alarmPriority: null,
        alarmPriorityDescription: null,
        sensorCurrentMeasurement: null,
        sensorCurrentMeasurementDescription: null,
        sensorNormalRangeHigh: null,
        sensorNormalRangeLow: null,
        sensorWarningRangeHigh: null,
        sensorWarningRangeLow: null,
        sensorID: null,
        sensorName: null,
        deviceName: null,
        moduleName: null,
        partitionName: null,
        locationName: null,
        regionName: null,
        badQualityPriority: null,
        commFailurePriority: null,
        thresholds: null
    };
    return emptyNotifaction;
}

//returns an empty notifcation object. works great for intellisense.
function getEmptyThreshold() {
    let emptyThresh = {
        sortOrder: null,
        priorityCD: null,
        minPoint: null,
        maxPoint: null,
        thresholdDescription: null
    };
    return emptyThresh;
}

function getEmptyMeasurement() {
    let emptyMeasurement = {
        measurementValueText: null,
        measurementValue: null
    };
    return emptyMeasurement;
}

function getEmptyPushResult() {
    let pushResult = {
        errorMessage: null,
        notificationCountToSend: 0,
        notificationCountSentSuccessfully: 0,
        messageDetails: null,
        rowsUpdated: null,
        sentHeartbeat: false,
        lastNotifySet: false
    }
    return pushResult;

}

function getEmptyHeartbeat() {
    let emptyHeartbeat = {
        notificationRequest: {
            notificationId: null,
            event: {
                eventDateTime: null,
                eventStatus: "Heartbeat",
                eventInterval: null
            }
        }
    };
    return emptyHeartbeat;
}

function createHeartbeatXML(pushRequestID, currentTime, eventInterval){
    let heartbeatXML = `
<NotificationRequest>    
     <NotificationId>${pushRequestID}</NotificationId>
     <Event>
         <EventDateTime>${currentTime}</EventDateTime>
         <EventStatus>Heartbeat</EventStatus>
         <EventInterval>${eventInterval}</EventInterval>
      </Event>
  </NotificationRequest>`
  return heartbeatXML
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