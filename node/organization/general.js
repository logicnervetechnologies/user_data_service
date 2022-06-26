const { getOrganizationData } = require('./protected.js')

// Get names of organizations and return in object mapping
const getGeneralInfoOrganization = async (req, res) => {
    const orgIds = req.body.orgIds;
    console.log(orgIds);
    var orgsBasic = [];
    await Promise.all(orgIds.map(async orgId => {
        console.log(orgId)
        const org = await getOrganizationData(orgId)
        console.log(org.orgName)
        orgsBasic.append({orgId, orgName})
    }));
    res.json({orgs:orgsBasic});
    
}

module.exports = { getGeneralInfoOrganization }