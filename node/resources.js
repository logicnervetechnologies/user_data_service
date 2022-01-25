const mongoose = require('mongoose')

mongoose.connect(process.env.MONGOUSERSURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const connection = mongoose.connection;
const orgCol = connection.collection('organizations') 
const userCol = connection.collection('users')
connection.once("open", function() {
    console.log("MongoDB database connection established successfully - orgs");
  });


module.exports = { orgCol, userCol }