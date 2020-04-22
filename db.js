var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/poofbook";

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    console.log("Database poofbook created!");
    db.close();
});

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.createCollection("users", function (err, res) {
        if (err) throw err;
        console.log("Collection users created!");
        db.close();
    });
});


MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    var myobj = { email: "admin@admin.com", password: "123456",user_stat:'admin' };
    dbo.collection("users").findOne({ email: "admin@admin.com", password:"123456",user_stat:'admin' }, function (err, result) {
        if (err) throw err;
        if (result == null) {
            dbo.collection("users").insertOne(myobj, function (err, res) {
                if (err) throw err;
                console.log("email admin password admin 1 document inserted");
                db.close();
            });
        } else {
            console.log("have already " + result.email);
            db.close();
        }

    });

});

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.createCollection("books", function (err, res) {
        if (err) throw err;
        console.log("Collection books created!");
        db.close();
    });
});

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.createCollection("orders", function (err, res) {
        if (err) throw err;
        console.log("Collection orders created!");
        db.close();
    });
});

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.createCollection("orders_details", function (err, res) {
        if (err) throw err;
        console.log("Collection orders_detail created!");
        db.close();
    });
});

MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.createCollection("payments", function (err, res) {
        if (err) throw err;
        console.log("Collection payment created!");
        db.close();
    });
});