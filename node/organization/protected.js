const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')
const { v4 : uuidv4 } = require('uuid')
const { addOrganizationToUser, removeOrganizationFromUser } = require('../user.js')
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

/* MEMBER FUNCTIONS */

getMembersOfOrganization = async (orgId) => {
    const org = await getOrganizationData(orgId)
    if (org === null) return null;
    console.log('members of organization')
    return org.members 
}
isMemberOfOrganization = async (orgId, uid) => {
    const members = await getMembersOfOrganization(orgId);
    return members.some((member) => {return member.uid === uid})
}
getMember = async (orgId, uid) => {
    const members = await (getMembersOfOrganization(orgId))
    return members.find(member => member.uid === uid)
}
addMemberToOrganization = async (orgId, uid) => {
    if (await isMemberOfOrganization(orgId, uid)) return false;
    await orgCol.updateOne({ orgId }, { $push: { members: {uid,roles:[]} }}, logAction)
    return true
}
addRoleToMember = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, member] of org.members.entries()) {
        if (member.uid === uid) {
            // if user is already found, terminate
            if (member.roles.includes(role)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $push: {
                    [`members.${index}.roles`]: role
                },
                logAction}
            )
            return true
        }
    }
    return false
}
removeRoleFromMember = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, member] of org.members.entries()) {
        if (member.uid === uid) {
            // if user is already found, terminate
            if (!member.roles.includes(role)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $pull: {
                    [`members.${index}.roles`]: role
                },
                logAction}
            )
            return true
        }
    }
    return false
}
removeMemberFromOrganization = async (orgId, uid) => {
    if (!(await isMemberOfOrganization(orgId, uid))) return false,
    await orgCol.updateOne({ orgId }, { $pull: { members: { uid } } }, logAction);
    return true
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


/* ROLE FUNCTIONS */

getRolesInOrganization = async (orgId) => {
    const org = await getOrganizationData(orgId);
    let roles = []
    org.roles.forEach(roleObj => {
        roles.push(roleObj.role)
    })    
    return roles
}
isRole = async (orgId, role) => {
    const roles = await getRolesInOrganization(orgId)
    return roles.some((roleObj) => {return roleObj.role === role})
}

addRoleToOrganization = async (orgId, newrole) => {
    const role = newrole.toUpperCase()
    const existingRoles = await getRolesInOrganization(orgId)
    if (existingRoles.includes(role)) return false
    else {
        const newRole = {
            role,
            users: []
        }
        await orgCol.updateOne({ orgId }, { $push: { roles: newRole} }, logAction)
        console.log(`Role '${role}' added to organization '${orgId}'`)
        return true
    }
}

deleteRoleFromOrganization = async (orgId, role) => {
    const existingRoles = await getRolesInOrganization(orgId);
    if (!existingRoles.some(roleArray => roleArray.length > 0)) return false;
    if (!existingRoles.includes(role)) return false;
    await orgCol.updateOne({ orgId }, { $pull: { roles: { role: role } } }, logAction);
    return true;
}

addMemberToRole = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, roleObj] of org.roles.entries()) {
        if (roleObj.role === role) {
            // if user is already found, terminate
            if (roleObj.users.includes(uid)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $push: {
                    [`roles.${index}.users`]: uid
                },
                logAction}
            )
            return true
        }
    }
    return false
}
// remove a member from a certain role
removeMemberFromRole = async (orgId, uid, role) => {
    const org = await getOrganizationData(orgId)
    for (const [index, roleObj] of org.roles.entries()) {
        if (roleObj.role === role) {
            // if user is not found, terminate
            if (!roleObj.users.includes(uid)) return false
            // this requires a precomputed key, since we need to specify the
            // array, which we do by iterating over indices as well
            await orgCol.updateOne(
                { orgId },
                { $pull: {
                    [`roles.${index}.users`]: uid
                },
                logAction}
            )
            return true
        }
    }
    return false
}



/* user organization functions */
// add a user to a organization as a memeber, admin action
addUserToOrganization = async (orgId, role, userUid) => {
    console.log("Adding User to Organization")
    // check if org exists
    const org = await getOrganizationData(orgId)
    if (org === null) return false
    // if member already return false
    if (await isMemberOfOrganization(orgId, userUid)) return false
    // add user to organization memebers
    await addMemberToOrganization(orgId, userUid)
    await addOrganizationToUser(userUid, orgId)
    // role is empty or null -> no role
    if (!role) {
        return true
    }
     // add role to user and put user in role arr
    if (!(await isRole(orgId, role))) return false
    await addRoleToMember(orgId, uid, role)
    await addMemberToRole(orgId, uid, role)
    return true
}

// remove the user from the organization, admin action
removeUserFromOrganization = async (orgId, userUid) => {
    // check org exists
    const org = await getOrganizationData(orgId);
    if (org === null) return false
    // if not member of org return false
    const member = await getMember(orgId, userUid)
    if (!member) return false
    // if user is admin or owner, return false
    if (org.admins.includes(userUid) || org.owner.includes(userUid)) return false;
    // for all roles user is in, remove him/her from role
    member.roles.forEach(async (role) => {
        await removeMemberFromRole(orgId, userUid, role)
    })
    // remove organization from user and pull user from organization
    if ((await removeOrganizationFromUser(userUid, orgId)) && (await removeMemberFromOrganization(orgId, userUid))) return true
    return false
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

logAction = (err, object) => {
    // if (err) console.error(err)
    // if (object) console.log(object)
}

const adminAction = async (req, res) => {
    const requester = req.user.uid
    const { action, orgId } = req.body // basic args
    // ensure requester is admin in organization
    let orgAdmins = await getAdminsOfOrganization(orgId)
    console.log(`Admin Action: ${action} on organization: ${orgId}`)
    //console.log(orgAdmins)
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
    } else if (action === 'addUserToOrganization') {
        // add a new user to the organization
        const { newUser, role } = req.body
        console.log(newUser)
        if (newUser == null) res.sendStatus(400)
        if (await addUserToOrganization(orgId, role, newUser)) res.sendStatus(200)
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
        if ((await addMemberToRole(orgId, userUid, role))
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
    }

}

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
}

const getOrganizationInformation = async (req, res) => {
    //Authentication check needs to be implmemented
    //TODO: check if user is in org, give extended info, else basic info
    const orgId = req.body.orgId;
    console.log(`Requesting org: ${orgId}`)
    console.log(orgId)
    const organization = await getOrganizationData(orgId)
    res.json(organization)
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

module.exports = { createOrganization, getOrganizationInformation, getBasicOrganizationInfo, adminAction, getOrganizationData, orgCol }
