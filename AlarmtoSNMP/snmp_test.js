snmp = require ("net-snmp");
os = require('os');
dns = require('dns');

var session = snmp.createSession ("10.2.240.76", "public");

var hostname = os.hostname()

var ifs = os.networkInterfaces();
var agentAddrIP = Object.keys(ifs)
 .map(x => ifs[x].filter(x => x.family === 'IPv4' && !x.internal)[0])
 .filter(x => x)[0].address;

var trapOid = "1.3.6.1.4.1.9999.123.1";

var varbinds = [
    {oid: "1.3.6.1.4.1.9999.123.1.1.0",type: snmp.ObjectType.OctetString,value: "Forced Agent IP"},
    {oid: "1.3.6.1.4.1.9999.123.1.2.0",type: snmp.ObjectType.OctetString,value: "Device:574733ab-764c-e711-80d3-0050569734a9"},
    {oid: "1.3.6.1.4.1.9999.123.1.3.0",type: snmp.ObjectType.OctetString,value: "Sensor:61b2802a-5acc-e511-80c7-005056a73eab"},
    {oid: "1.3.6.1.4.1.9999.123.1.4.0",type: snmp.ObjectType.OctetString,value: "22"},
    {oid: "1.3.6.1.4.1.9999.123.1.5.0",type: snmp.ObjectType.OctetString,value: "P5"},
    {oid: "1.3.6.1.4.1.9999.123.1.6.0",type: snmp.ObjectType.OctetString,value: "Alarm"}
];

var agentAddrOptions = {
    agentAddr: agentAddrIP
}

// version 2c should have been specified when creating the session
session.trap(trapOid, varbinds, agentAddrOptions, function (error) {
    
    if (error)
        console.error (error);
});