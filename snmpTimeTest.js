const timeString = '2017-09-21T17:09:41.4844918'
//const timeString = 'Not A Valid Date String'

let newTime = new Date(timeString);

console.log(`raw  time: ${timeString}`);
console.log(`js   time: ${newTime}`)

function snmpDateConvert(date) {
    if (date) {
        let newTime = new Date(date);
        if (newTime == 'Invalid Date') {
            err = 'Error Parsing ' + timeString + ' to new Date ' + date
            return err;
        }
        let year = newTime.getFullYear();
        let month = newTime.getMonth();
        let day = newTime.getDate();
        let hour = newTime.getHours();
        let min = newTime.getMinutes();
        let sec = newTime.getSeconds();
        let mil = newTime.getMilliseconds().toString().substring(0, 1);
        let snmpDate = `${year}-${month + 1}-${day},${hour}:${min}:${sec}.${mil}`
        return snmpDate;

    }
    else {
        err = 'Error Parsing ' + timeString + ' to new Date ' + date
        return err;
    };
};

console.log(`snmp time: ${snmpDateConvert(newTime)}`)