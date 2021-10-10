const { getOrganizationInfo } = require('./protected.js')

// Get names of organizations and return in object mapping
const getGeneralInfoOrganization = async (req, res) => {
    const orgIds = req.body.orgIds;
    console.log(orgIds);
    res.send({"test":"bingus"});
}

module.exports = { getGeneralInfoOrganization }