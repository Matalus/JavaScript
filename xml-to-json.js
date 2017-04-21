var xmlstr = `
<Event>
        <EventId>10360029</EventId>
        <EventDateTime>5/14/2016 7:30:19 AM</EventDateTime>
        <EventStatus>Normal</EventStatus>
        <EventDescription>Alarm status has cleared</EventDescription>
        <AlarmType>5</AlarmType>
        <AlarmTypeDescription>Reading</AlarmTypeDescription>
        <AlarmPriority>4</AlarmPriority>
        <AlarmPriorityDescription>Medium Low</AlarmPriorityDescription>
        <SensorCurrentMeasurement>0</SensorCurrentMeasurement>
        <SensorMeasurementDescriptions>
            <Measurement Description="False" Value="0.00000" />
            <Measurement Description="True" Value="1.00000" />
        </SensorMeasurementDescriptions>
        <SensorNormalRangeHigh>0</SensorNormalRangeHigh>
        <SensorNormalRangeLow>0</SensorNormalRangeLow>
        <SensorWarningRangeHigh>1</SensorWarningRangeHigh>
        <SensorWarningRangeLow>-1</SensorWarningRangeLow>
        <SensorId>e473ab20-0b7f-e411-8a0a-005056a513d4</SensorId>
        <SensorName>RAT Station Mode Interlocked</SensorName>
        <DeviceName>Zone 2</DeviceName>
        <ModuleName>LHR.S01.D05</ModuleName>
        <PartitionName>Zone Control</PartitionName>
        <LocationName>IO LONDON</LocationName>
        <RegionName>Global Region</RegionName>
        <BadQualityPriority>0</BadQualityPriority>
        <CommFailurePriority>0</CommFailurePriority>
        <Thresholds>
            <Threshold SortOrder="1" Priority="4" MinValue="-99999999999" MaxValue="-1" />
            <Threshold SortOrder="2" Priority="6" MinValue="-1" MaxValue="0" />
            <Threshold SortOrder="3" Priority="0" MinValue="0" MaxValue="0" />
            <Threshold SortOrder="4" Priority="6" MinValue="0" MaxValue="1" />
            <Threshold SortOrder="5" Priority="4" MinValue="1" MaxValue="99999999999" />
        </Thresholds>
    </Event>
`

var options = {
    mergeAttrs: true,
    explicitArray: false,
    trim: true
};

function parseJSON(xml,options){
    var xml2json = require('xml2js').parseString;
    var util = require('util');
    this.xml = xml;
    this.options = options;
    xml2json(xml, options, function(err,result){
    console.log(util.inspect(result,false,null));
    //return result  
    });
};

//determines priority description based on alarm type CD
function priorityDescription(alarmTypeCD){
    switch(alarmTypeCD){
        case 0:
            return 'NORMAL';
            break;
        case 1:
            return 'HIGHEST';
            break;
        case 2:
            return 'HIGH';
            break;
        case 3:
            return 'MEDIUM';
            break;
        case 4:
            return 'MEDIUM_LOW';
            break;
        case 5:
            return 'LOW';
            break;
        default:
            return '';
            break
    }    
}

//console.log(priorityDescription(1))

function eventDescription(alarmTypeCD,current,previous){
    var eventDescriptionStr
    if(previous == null){
        previous = 'Normal';
    }
    if(current == 'Normal'){
        return 'Alarm Status has cleared';
    }
    else if(current == 'Alarm'){
        
        switch(alarmTypeCD){
            case 4:
                return `Status changed from ${previous} to Bad Quality`;
                break;
            case 6:
                return `Status changed from ${previous} to Communication Failure`
                break;
            default:

                if(previous == 'Alarm'){
                    return `Status changed to Alarm`;
                }
                else{
                    return `Status changed from ${previous} to Alarm`
                }
                break;
        }
    }
} 

var notificationXML = `
<State>
    <Current>Normal</Current>
    <Priority>9</Priority>
    <ThresholdID>518170</ThresholdID>
    <Value>32</Value>
    <AlarmTypeCD>5</AlarmTypeCD>
    <ReadingDate>2017-04-19T15:14:48.8317591Z</ReadingDate>
</State>`

//var priorityCD = parseJSON(notificationXML,options)
//console.log(priorityCD.alarmTypeCD)

console.log(eventDescription(6,'Alarm','Normal'))

