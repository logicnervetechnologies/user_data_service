const { v4 : uuidv4 } = require('uuid')
const { orgCol } = require('../resources')
const { addOrganizationToUser } = require('../user.js')
const {getMembersOfOrganization, isMemberOfOrganization, addRoleToMember,
     removeRoleFromMember} = require('./member')
const {addRoleToOrganization, deleteRoleFromOrganization, addMemberToRole,
    removeMemberFromRole} = require('./role')
const { removeUserFromOrganization } = require('./orgUser')
const { createInvite } = require('./invitations')
const { logAction } = require('../log')
require("dotenv").config()



// create an organization, technically admin action 
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
        invitations:[],
        members: [{
            uid: creatorUser.uid,
            roles:[]
        }],
        noRole:[]
    }
    let created = null;
    try {
        await orgCol.insertOne(new_organization)
        await addOrganizationToUser(creatorUser.uid, new_organization.orgId);
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    } 
    res.json({ orgId: created })

    //console.log(req.user)
}



/* ADMIN FUNCTIONS */

getAdminsOfOrganization = async (orgId) => {
    //TODO get admins of org
    const org = await getOrganizationData(orgId)
    if (org === null ) { 
        console.log("org not found")
        return null;
    }
    console.log(`Admins requested from org ${orgId}`)
    return org.admins;
}


addAdminToOrganization = async (orgId, newAdminUid) => {
    // TODO add new admin to organization with orgid
    // check if admin is already listed as admin
    console.log("adding admin intro function")
    console.log(`add user: ${newAdminUid} as admin in ${orgId}`)
    const currentAdmins = await getAdminsOfOrganization(orgId);
    if (currentAdmins.includes(newAdminUid)) return false
    // if not member of org, return false
    if (!(await isMemberOfOrganization(orgId, newAdminUid))) return false
    await orgCol.updateOne({ orgId }, { $push: { admins: newAdminUid} }, logAction)
    console.log(`User '${newAdminUid}' added as admin to organization '${orgId}'`)
    return true

}

removeAdminFromOrganization = async (orgId, adminUid) => {
    const currentAdmins = await getAdminsOfOrganization(orgId);
    // If there is only a single admin, removal is ill-defined.
    if (currentAdmins.length === 1) {
        return false;
    } else if (currentAdmins.includes(adminUid)) { // if admin in list, remove
        await orgCol.updateOne({ orgId }, { $pull: { admins: adminUid } }, logAction);
        return true;
    } else { // missing!
        return false;
    }
}



/*
shiftUserRoleInOrganization = async (orgId, role, userUid) => {
    const org = await getOrganizationData(orgId);
    console.log(org.roles);
    if (org.roles.every(roleObj => roleObj.role !== role)) return false;

    // attempt to remove user from any role, as well as the norole list
    let found = false;
    for (const roleObj of org.roles) {
        if (roleObj.users.includes(userUid)) {
            await orgCol.updateOne({ orgId }, { $pull: {roles: {role: userUid }}}, logAction);
            found = true;
        }
    }
    
    if (!found) {
        if (org.noRole.includes(userUid)) {
            await orgCol.updateOne({ orgId }, { $pull: { noRole: userUid } }, logAction);
            return true;
        }
    }
    if (!found) return false;

    // this also calls a part of user.js, fyi
    return await addUserToOrganization(orgId, role, userUid);
}
*/

//admin action, change the owner of the organization 
changeOwnerOfOrganization = async (orgId, userUid, newUserUid) => {
    // check new owner is member
    if (!(await isMemberOfOrganization(orgId, newUserUid))) return false
    // make changes
    const org = await getOrganizationData(orgId);
    if (!org.owner.includes(userUid)) return false;
    await orgCol.updateOne({ orgId }, { $pull: { owner: userUid } }, logAction);
    await orgCol.updateOne( { orgId }, { $push: {owner: newUserUid } }, logAction);
    return true;
}

const adminAction = async (req, res) => {
    const requester = req.user.uid
    const { action, orgId } = req.body // basic args
    // ensure requester is admin in organization
    let orgAdmins = await getAdminsOfOrganization(orgId)
    console.log(`Admin Action: ${action} on organization: ${orgId}`)
    //console.log(orgAdmins)
    try {
    if (!(orgAdmins.includes(requester))) {
        console.log(`requester is not an admin`)
        console.log(orgAdmins)
        console.log(requester)
        res.sendStatus(401);
        return
    }
    if (action === 'addAdminToOrganization') {
        //console.log(`add user: ${newAdmin} as admin in ${orgId}`)
        const { newAdmin } = req.body
        if (newAdmin == null) res.sendStatus(400);
        if (await addAdminToOrganization(orgId, newAdmin)) {
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    } else if (action === 'removeAdminFromOrganization') {
        const { adminUid } = req.body;
        if (await removeAdminFromOrganization(orgId, adminUid)) res.sendStatus(200);
        else res.sendStatus(403);
    } else if (action === 'inviteUserToOrganization') {
        // add a new user to the organization
        const { newUser } = req.body
        console.log(newUser)
        if (newUser == null) res.sendStatus(400)
        if (await createInvite(requester, newUser, orgId, orgCol)) res.sendStatus(200)
        else res.sendStatus(403)
    } else if (action === 'removeUserFromOrganization') {
        // add a new user to the organization
        const { userUid } = req.body
        if (userUid == null) res.sendStatus(400)
        if (await removeUserFromOrganization(orgId, userUid)) res.sendStatus(200)
        else res.sendStatus(403)
    } else if (action === 'addRoleToOrganization') {
        // add a new role to the organization
        const { role } = req.body
        if (await addRoleToOrganization(orgId, role)) {
            res.sendStatus(200)
        } else {
            res.sendStatus(403)
        }
    } else if (action === 'deleteRoleFromOrganization') {
        // delete a certain role from the organziation 
        const { role } = req.body;
        if (await deleteRoleFromOrganization(orgId, role)) res.sendStatus(200);
        else res.sendStatus(403);
    } else if (action === 'addUserToRole') {
        // add a user to a role within org
        const { role, userUid } = req.body;
        if (!(await isMemberOfOrganization(orgId, userUid))) res.sendStatus(400)
        else if ((await addMemberToRole(orgId, userUid, role))
        && (await addRoleToMember(orgId, userUid, role))) res.sendStatus(200);
        else res.sendStatus(403);
    } else if (action === 'removeUserFromRole') {
        // remove user from role within org
        const { role, userUid } = req.body;
        if ((await removeMemberFromRole(orgId, userUid, role))
        && (await removeRoleFromMember(orgId, userUid, role))) res.sendStatus(200);
        else res.sendStatus(403);
    } else if (action === 'changeOwnerOfOrganization') {
        // change owner of org
        const { userUid, newUserUid } = req.body;
        if (await changeOwnerOfOrganization(orgId, userUid, newUserUid)) res.sendStatus(200);
        else res.sendStatus(403);
    } else {
        res.sendStatus(400)
    }
    } catch (error) {
        console.log(error)
        res.sendStatus(403)
    }

}

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
}

const getOrganizationInformation = async (req, res) => {
    //Authentication check needs to be implmemented
    try {
        const uid = req.user.uid
        const orgId = req.body.orgId;
        console.log(`Requesting org: ${orgId}`)
        console.log(orgId)
        if (await isMemberOfOrganization(orgId, uid)) {
            const organization = await getOrganizationData(orgId)
            res.json(organization)
        } else {
            res.sendStatus(401)
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(403)
    }
}

const getBasicOrganizationInfo = async (req, res) => {
    const orgId = req.body.orgId
    const organization = await getOrganizationData(orgId);
    const basic = {
        orgName: organization.orgName,
        orgId: organization.orgId
    }
    res.json(basic)
}


module.exports = { createOrganization, getOrganizationInformation, getBasicOrganizationInfo, adminAction, getOrganizationData }
