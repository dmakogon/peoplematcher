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
var usernameParam = process.argv[2];
var connectionString = host;

mongo.connect(connectionString, function (err, db) {
    assert.equal(null, err);
    var col = db.collection('_User');
    col.find({ username: usernameParam }, { Interests: 1, matchHistory:1, _id: 0 }).toArray(function (err, docs) {
        var userInterests = docs[0].Interests;
        var userMatchHistory = docs[0].matchHistory;

        col.aggregate([
            { $match: { $and: [
                {username: { $ne: usernameParam }},
                {username: {$not: {$in: userMatchHistory}}},
                {Interests: { $in: userInterests }}
            ] } },
            {
                $project: {
                    "username": 1,
                    "screenName": 1,
                    "matches":
                    { $setIntersection: [userInterests, "$Interests"] },
                    "matchSize": { $size: { $setIntersection: [userInterests, "$Interests"] } }

                }
            },
            { $match: { matchSize: {$gte: 2}}}, // only allow chance encounters with multiple matching interests
            { $sort: { matchSize: -1 } },
            { $limit: 2 }
        ]).toArray(function (err, matchdocs) {
            if(err) {
                console.log(err);
            }
            var usernames = []
            matchdocs.forEach(function (item) {
                usernames.push(item.username);
            });
            col.update(
                { username: usernameParam },
                { $push: { matchHistory: { $each: usernames } } }
            )
            matchdocs.forEach(function(element) {
                console.log(`${element.username}: ${element.matches}`);
            });

            db.close();
        });

    });

});
