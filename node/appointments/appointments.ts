const { v4 : uuidv4 } = require('uuid')
const { orgCol, userCol } = require('../resources')

const createAppointment = (name: string, date: Date, length: number, attendees: Array<string>, creator: string) => {
    var atds = {}
    attendees.forEach(attendee => atds[attendee] = 0);
    const appt = {
        id: uuidv4(),
        name,
        date,
        length,
        attendees: atds,
        numAttendees: attendees.length,
        creator
    }; 

}