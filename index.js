const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const mongodb = require("mongodb");
const ObjectID = mongodb.ObjectID;

const PROVIDERS_COLLECTION = "providers";

const app = express();
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
let db;
let server;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/test", function (err, client) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    // Save database object from the callback for reuse.
    db = client.db();
    console.log("Database connection ready");

    // Initialize the app.
    server = app.listen(process.env.PORT || 8080, function () {
        var port = server.address().port;
        console.log("App now running on port", port);
    });
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
}

/*  "/api/providers"
 *    GET: finds a subset of providers with parameters in querystring, or all providers by default
 *    POST: inserts a new provider record
 */

app.get("/api/providers", function(req, res) {
    db.collection(PROVIDERS_COLLECTION).find({}).toArray(function(err, docs) {
        if (err) {
            handleError(res, err.message, "Failed to get providers.");
        } else {
            console.log(req.query.max_discharges);
            res.status(200).json(docs);
        }
    });
});

app.post("/api/providers", function(req, res) {
    const newProvider = req.body;
    newProvider.createDate = new Date();

    if (!req.body.provider_id) {
        handleError(res, "Invalid user input", "Must provide a provider_id.", 400);
    } else {
        db.collection(PROVIDERS_COLLECTION).insertOne(newProvider, function(err, doc) {
            if (err) {
                handleError(res, err.message, "Failed to create new provider.");
            } else {
                res.status(201).json(doc.ops[0]);
            }
        });
    }
});

/*  "/api/providers/:id"
 *    GET: find provider by id
 */

app.get("/api/providers/:id", function(req, res) {
    db.collection(PROVIDERS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
        if (err) {
            handleError(res, err.message, "Failed to get provider.");
        } else {
            res.status(200).json(doc);
        }
    });
});
