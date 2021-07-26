const { MongoClient } = require('mongodb')
const { v4 : uuidv4 } = require('uuid')
const { addOrganizationToUser } = require('./user.js')
require("dotenv").config()
//mongodb://user_data_service_dev:VOwsBhCcMaidtMJJ@

const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })

const createOrganization = async (req, res) => {
    const creatorUser = req.user
    const new_organization = {
        orgName: req.body.orgName,
        orgId: uuidv4(),
        address: req.body.orgAddress,
        alwaysAskAddingProvider: true,
        alwaysAskAddingPatient: true,
        admins: [creatorUser.uid],
        owner: [creatorUser.uid],
        roles: [],
        noRole:[]
    }
    created = null;
    try {
        await client.connect()
        const orgs = client.db(process.env.USERDB).collection(process.env.ORGCOLLECTION)
        await orgs.insertOne(new_organization)
        // TODO add organization ID to user
        created = new_organization.orgId;
        await addOrganizationToUser(creatorUser.uid, new_organization.orgId);
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    } finally {
        await client.close()
    }
    res.json({ orgId: created })

    //console.log(req.user)
}

getAdminsOfOrganization = async (orgId) => {
    //TODO get admins of org
}

addAdminToOrganization = async (orgId, newAdminUid) => {
    // TODO add new admin to organization with orgid
}

removeAdminFromOrganization = async (orgId, adminUid) => {
    // TODO remove new admin to organization with orgid
    // must make sure there is at least one admin within organization post-removal
}

addUserToOrganization = async (orgId, userUid) => {
    // TODO add user to role within organization
}

shiftUserRoleInOrganization = async (orgId, userUid) => {
    // TODO shift user to role within organization
}

removeUserFromOrganization = async (orgId, userUid) => {
    // TODO remove user from organization
    // check to ensure user is not admin or owner
}

changeOwnerOfOrganization = async (orgId, userUid) => {
    // TODO change owner of organization
    // Check to ensure uid of requester is owner
    // TODO implement some form of verification via email or something to complete this action
}

const adminAction = async (req, res) => {
    const requester = req.user.uid
    const { action, orgId, newAdmin } = req.body
    const orgAdmins = getAdminsOfOrganization(orgId)
    if (!(requester in orgAdmins)) {
        res.sendStatus(401);
        return
    }
    if (action === 'addAdminToOrg') {
        addAdminToOrganization(orgId, newAdmin)
    }
}




const getOrganizationData = async (orgId) => {
    var organization = null;
    try {
        await client.connect()
        const orgs = client.db(process.env.USERDB).collection(process.env.ORGCOLLECTION)
        const findOrg = await orgs.findOne({ orgId: orgId });
        organization = findOrg;
        console.log(organization)
    } catch (err) {
        console.log(err)
    } finally {
        await client.close()
        
    }
    return organization
}

const getOrganizationInformation = async (req, res) => {
    //Authentication check needs to be implmemented
    const orgId = req.body.orgId;
    const organization = await getOrganizationData(orgId)
    res.json(organization)
}

module.exports = { createOrganization, getOrganizationInformation, adminAction }
