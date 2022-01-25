const {orgCol, userCol} = require('../resources')
const { v4 : uuidv4 } = require('uuid')

const notifyUser = async (uid, notifData, notifHyperlink = null) => {
    // create notification object
    console.log("notifying " + uid);
    newNotif = {
        notifData,
        notifHyperlink,
        nid: uuidv4(),
        date: Date()
    };
    try {
        await userCol.updateOne({ uid }, { $push: { notifications: newNotif} }); //push to mongo user obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}

const notifyOrganization = async (orgId, notifData, notifHyperlink = null) => {
    // create notification object
    console.log("notifying " + orgId);
    newNotif = {
        notifData,
        notifHyperlink,
        nid: uuidv4(),
        date: Date()
    };
    try {
        await orgCol.updateOne({ orgId }, { $push: { notifications: newNotif} }); //push to mongo organization obj
    } catch (err) {
        console.error(err)
        return false;
    } finally {
        return true;
    }
}

module.exports = { notifyUser, notifyOrganization}