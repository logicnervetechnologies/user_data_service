const { orgCol } = require('../resources')
const { logAction } = require('../log')
/* ROLE FUNCTIONS */

const getOrganizationData = async (orgId) => {
    const organization = await orgCol.findOne({ orgId })
    return organization
}

const getRolesInOrganization = async (orgId) => {
    const org = await getOrganizationData(orgId);
    let roles = []
    org.roles.forEach(roleObj => {
        roles.push(roleObj.role)
    })    
    return roles
}
const isRole = async (orgId, role) => {
    const roles = await getRolesInOrganization(orgId)
    return roles.some((roleObj) => {return roleObj.role === role})
}

const addRoleToOrganization = async (orgId, newrole) => {
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

const deleteRoleFromOrganization = async (orgId, role) => {
    const existingRoles = await getRolesInOrganization(orgId);
    if (!existingRoles.some(roleArray => roleArray.length > 0)) return false;
    if (!existingRoles.includes(role)) return false;
    await orgCol.updateOne({ orgId }, { $pull: { roles: { role: role } } }, logAction);
    return true;
}

const addMemberToRole = async (orgId, uid, role) => {
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
const removeMemberFromRole = async (orgId, uid, role) => {
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

module.exports = {getRolesInOrganization, isRole, addRoleToOrganization, deleteRoleFromOrganization, addMemberToRole, removeMemberFromRole}