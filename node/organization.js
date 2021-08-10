const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
const { v4 : uuidv4 } = require('uuid')
const { addOrganizationToUser } = require('./user.js')
require("dotenv").config()

const client = new MongoClient(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true })

mongoose.connect(process.env.MONGOUSERSURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const connection = mongoose.connection;
const orgCol = connection.collection('organizations') 
connection.once("open", function() {
    console.log("MongoDB database connection established successfully - orgs");
  });

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
    const org = await getOrganizationData(orgId)
    if (org === null ) return null;
    console.log(`Admins requested from org ${orgId}`)
    return org.admins;
}

addAdminToOrganization = async (orgId, newAdminUid) => {
    // TODO add new admin to organization with orgid
    const currentAdmins = await getAdminsOfOrganization(orgId);
    if (currentAdmins.includes(newAdminUid)) return false
    else { 
        orgCol.updateOne({ orgId }, { $push: { admins: newAdminUid} }, logAction)
        console.log(`User '${newAdminUid}' added as admin to organization '${orgId}'`)
        return true
    }

}

removeAdminFromOrganization = async (orgId, adminUid) => {
    // TODO remove new admin to organization with orgid
    // must make sure there is at least one admin within organization post-removal
}

getRolesInOrganization = async (orgId) => {
    const org = getOrganizationData(orgId);
    var roles = []
    org.roles.forEach(roleObj => {
        roles.push(roleObj.role)
    })    
    return roles
}

addRoleToOrganization = async (orgId, role) => {
    // TODO, create role object with no users to be added to organization
    const existingRoles = await getRolesInOrganization(orgId)
    if (existingRoles.includes(role)) return false
    else {
        const newRole = {
            role,
            users: []
        }
        orgCol.updateOne({ orgId }, { $push: { roles: newRole} }, logAction)
        console.log(`Role '${role}' added to organization '${orgId}'`)
        return true
    }
    
}

deleteRoleFromOrganization = async (orgId, role) => {
    // TODO, remove role from org ONLY IF no user array in org is empty
}

addUserToOrganization = async (orgId, role, userUid) => {
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

logAction = (err, object) => {
    if (err) console.error(err)
    if (object) console.log(object)
}

const adminAction = async (req, res) => {
    const requester = req.user.uid
    const { action, orgId } = req.body
    const orgAdmins = getAdminsOfOrganization(orgId)
    if (!(requester in orgAdmins)) {
        res.sendStatus(401);
        return
    }
    if (action === 'addAdminToOrg') {
        const { newAdmin } = req.body
        addAdminToOrganization(orgId, newAdmin)
    }
}

const getOrganizationData = async (orgId) => {
    var organization = await orgCol.findOne({ orgId })
    return organization
}

const getOrganizationInformation = async (req, res) => {
    //Authentication check needs to be implmemented
    const orgId = req.body.orgId;
    console.log(`Requesting org: ${orgId}`)
    console.log(orgId)
    const organization = await getOrganizationData(orgId)
    res.json(organization)
}

module.exports = { createOrganization, getOrganizationInformation, adminAction, getOrganizationData, orgCol }
