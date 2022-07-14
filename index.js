const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil")

//set up express app
const app = express();
//enable json processing
app.use(express.json());
//enable cors
app.use(cors());

const USERS_COLLECTION_NAME = "users";
const TOOLS_COLLECTION_NAME = "tools";
const TAGS_COLLECTION_NAME = "tags";


//routes
async function main() {
    await MongoUtil.connect(process.env.MONGO_URI, "tgc-session-tools");
    const db = MongoUtil.getDB();

    app.get("/", function (req, res) {
        res.json({
            "message": "welcome to session tools api"
        })
    })

    app.get("/tags", async function (req, res) {
        let criteria = {}
        let projection = {
            projection:{
                "tags": 1
            }
        }
        // const db = MongoUtil.getDB();
        let tags = await db.collection(TOOLS_COLLECTION_NAME).find(criteria, projection).toArray();
        // console.log(criteria);
        // console.log(tools);
        res.json({
            tags
        })
    })

    app.get("/tools", async function (req, res) {
        let criteria = {};
        let projection = {
            projection:{
                "createdBy.email": 0
            }
        }

        if (req.query.name) {
            criteria["name"] = {
                //if name includes the following words
                "$regex": req.query.name, "$options": "i"
            }
        }

        if (req.query.dateCreated) {
            const now = new Date()
            const temp = new Date(now).setMonth(now.getMonth() - 1);
            const priorOne = new Date(temp)
            criteria["dateCreated"] = {
                //how to code date created is within 1 month of current date
                "$gte": priorOne
            }
        }

        if (req.query.tags) {
            criteria["tags"] = {
                //if tags includes the following strings, case insensitive
                //tags is an array of strings
                "$in": req.query.tags
            }
        }

        if (req.query.groupSize) {
            criteria["groupSize"] = {
                //if groupsize includes the following strings, small medium or large
                // groupSize is an array of strings [small, medium, large]
                "$in": req.query.groupSize
            }
        }

        if (req.query.minTimeNeeded) {
            criteria["timeNeeded"] = {
                "$gte": parseInt(req.query.minTimeNeeded),
                "$lte": parseInt(req.query.maxTimeNeeded)
            }
        }

        if (req.query.email) {
            criteria["createdBy.email"] = {
                "$eq": req.query.email
            }
        }
        // const db = MongoUtil.getDB();
        let tools = await db.collection(TOOLS_COLLECTION_NAME).find(criteria,projection).toArray();
        console.log(criteria);
        console.log(tools);
        res.json({
            tools
        })
    })

    app.post("/add-tool", async function (req, res) {
        try {
            let createdBy = req.body.createdBy;
            let name = req.body.name;
            let description = req.body.description;
            // let dateCreated = req.body.dateCreated;
            let dateCreated = new Date();
            let tags = req.body.tags;
            let groupSize = req.body.groupSize;
            let timeNeeded = req.body.timeNeeded;
            let materials = req.body.materials;
            let learningObjectives = req.body.learningObjectives;
            let instructions = req.body.instructions;
            let debrief = req.body.debrief;

            const db = MongoUtil.getDB();

            await db.collection(TOOLS_COLLECTION_NAME).insertOne({
                createdBy,
                name,
                description,
                dateCreated,
                tags,
                groupSize,
                timeNeeded,
                materials,
                learningObjectives,
                instructions,
                debrief
            });
            res.status(200);
            res.json({
                "message": "tool added"
            })
        } catch (e) {
            res.status(500);
            res.json({
                "message": "Internal server error. Please contact administrator"
            })
            console.log(e)
        }
    })

    app.delete("/delete-tool/:id", async function (req, res) {
        await MongoUtil.getDB().collection(TOOLS_COLLECTION_NAME).deleteOne({
            "_id": ObjectId(req.params.id)
        })
        res.status(200);
        res.json({
            "message": "This document has been deleted"
        })
    })

    app.get("/users", async function (req, res) {
        let criteria = {};
        // const db = MongoUtil.getDB();
        let users = await db.collection(USERS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "users": users
        })
    })

    app.post("/add-user", async function (req, res) {
        try {
            let userName = req.body.userName;
            let email = req.body.email;
            let password = req.body.password;

            const db = MongoUtil.getDB();

            await db.collection(USERS_COLLECTION_NAME).insertOne({
                userName,
                email,
                password
            });
            res.status(200);
            res.json({
                "message": "user added"
            })
        } catch (e) {
            res.status(500);
            res.json({
                "message": "Internal server error. Please contact administrator"
            })
            console.log(e)
        }
    })

    app.get("/tags", async function (req, res) {
        let criteria = {};
        // const db = MongoUtil.getDB();
        let tags = await db.collection(TAGS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "tags": tags
        })
    })

    app.post("/add-tag", async function (req, res) {
        try {
            let name = req.body.name;
            let displayName = req.body.displayName;

            const db = MongoUtil.getDB();

            await db.collection(TAGS_COLLECTION_NAME).insertOne({
                name,
                displayName
            });

            res.status(200);
            res.json({
                "message": "tag added"
            })
        } catch (e) {
            res.status(500);
            res.json({
                "message": "Internal server error. Please contact administrator"
            })
            console.log(e)
        }
    })
}
main();

//open the listening port
app.listen(process.env.PORT, function () {
    console.log("server started")
})