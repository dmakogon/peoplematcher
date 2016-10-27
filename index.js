var mongo = require('mongodb').MongoClient,
assert = require('assert'),
config = require('./config'),
host = config.connection.host,
username = config.connection.username,
password = config.connection.password,
db = config.database.dbname;

if (process.argv.length <= 2) {
    console.log("Usage: index <username>");
    process.exit(-1);
}
var username = process.argv[2];
var connectionString = host;

mongo.connect(connectionString, function(err, db) {
  assert.equal(null, err);
  var col = db.collection('_User');
  col.find({username: username},{Interests:1,_id:0}).toArray(function(err, docs) {
      var userInterests = docs[0].Interests;
      console.log(userInterests);
      col.aggregate( [
        { $match: { Interests: { $in: userInterests }}},
    { $project: { 
       "username":1,
       "screenName":1,
       "matches":
          { $setIntersection: [ userInterests, "$Interests"] },
           "matchSize": {$size: { $setIntersection: [ userInterests, "$Interests"] }}    

}},
    { $sort: { matchSize:-1}},
    { $limit: 2}   
] ).toArray(function(err, matchdocs) {
    console.log(matchdocs);
    db.close();
    });

    });
  
});
