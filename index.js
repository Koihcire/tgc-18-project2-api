const express = require("express");
const cors = require("cors");
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const MongoUtil = require("./MongoUtil")
const {getPriorOne} = require("./PriorOne")

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
            projection: {
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
            projection: {
                "createdBy.email": 0,
                "comments.email": 0
            }
        }
        let sortCriteria = {};

        if(req.query.sortBy){
            if(req.query.sortBy == "popularity"){
                sortCriteria = {
                    "likes": -1
                }
            } else if (req.query.sortBy == "recentlyAdded"){
                sortCriteria = {
                    "dateCreated": -1
                }
            }
        }

        if (req.query.name) {
            criteria["name"] = {
                //if name includes the following words
                "$regex": req.query.name, "$options": "i"
            }
        }

        if (req.query.dateCreated) {
            // const now = new Date()
            // const temp = new Date(now).setMonth(now.getMonth() - 1);
            // const priorOne = new Date(temp)
            
            criteria["dateCreated"] = {
                //how to code date created is within 1 month of current date
                "$gte": getPriorOne()
            }
        }

        if (req.query.tags) {
            criteria["tags"] = {
                //if tags includes the following strings, case insensitive
                //tags is an array of strings
                "$in": req.query.tags
            }
        }

        if (req.query.difficulty){
            criteria["difficulty"] = {
                "$eq": req.query.difficulty
            }
        }

        if (req.query.groupSize) {
            criteria["groupSize"] = {
                //if groupsize includes the following strings, small medium or large
                // groupSize is an array of strings [small, medium, large]
                "$in": req.query.groupSize
            }
        }

        if (req.query.minTimeNeeded || req.query.maxTimeNeeded) {
            let minTime = ''
            let maxTime = ''

            if (!req.query.minTimeNeeded){
                minTime = '0'
            } else {
                minTime = req.query.minTimeNeeded
            }

            if (!req.query.maxTimeNeeded){
                maxTime = '999'
            } else {
                maxTime = req.query.maxTimeNeeded
            }
            
            // criteria["timeNeeded"] = {
            //     "$gte": parseInt(req.query.minTimeNeeded),
            //     "$lte": parseInt(req.query.maxTimeNeeded)
            // }

            criteria["timeNeeded"] = {
                "$gte": parseInt(minTime),
                "$lte": parseInt(maxTime)
            }
        }

        if (req.query.email) {
            criteria["createdBy.email"] = {
                "$eq": req.query.email
            }
        }
        // const db = MongoUtil.getDB();
        let tools = await db.collection(TOOLS_COLLECTION_NAME).find(criteria, projection).sort(sortCriteria).toArray();
        console.log(criteria);
        console.log(tools);
        res.json({
            tools
        })
    })

    app.get("/tool/:id", async function (req, res) {
        try {
            let criteria = {};
            let projection = {
                projection: {
                    "createdBy.email": 0,
                    "comments.email": 0
                }
            }

            if (req.params.id) {
                criteria["_id"] = {
                    "$eq": ObjectId(req.params.id)
                }
            }

            let tool = await db.collection(TOOLS_COLLECTION_NAME).findOne(criteria, projection);
            console.log(criteria);
            console.log(tool);
            res.json({
                tool
            })
        } catch (e) {
            res.status(500);
            res.json({
                "message": "Internal server error. Please contact administrator"
            })
            console.log(e)
        }
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
            let timeNeeded = parseint(req.body.timeNeeded);
            let difficulty = req.body.difficulty;
            let materials = req.body.materials;
            let learningObjectives = req.body.learningObjectives;
            let instructions = req.body.instructions;
            let debrief = req.body.debrief;
            let likes = 0;

            const db = MongoUtil.getDB();
            await db.collection(TOOLS_COLLECTION_NAME).insertOne({
                createdBy,
                name,
                description,
                dateCreated,
                tags,
                groupSize,
                timeNeeded,
                difficulty,
                materials,
                learningObjectives,
                instructions,
                debrief,
                likes
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

    app.put("/update-tool/:id", async function (req,res){
        try {
            let name = req.body.name;
            let description = req.body.description;
            let groupSize = req.body.groupSize;
            let timeNeeded = parseInt(req.body.timeNeeded);
            let difficulty = req.body.difficulty;
            let materials = req.body.materials;
            let learningObjectives = req.body.learningObjectives;
            let instructions = req.body.instructions;
            let debrief = req.body.debrief;

            await MongoUtil.getDB().collection(TOOLS_COLLECTION_NAME).updateOne({
                "_id": ObjectId(req.params.id)
            },{
                "$set": {
                    "name": name,
                    "description" : description,
                    "groupSize" : groupSize,
                    "timeNeeded" : timeNeeded,
                    "difficulty" : difficulty,
                    "materials" : materials,
                    "learningObjectives" : learningObjectives,
                    "instructions" : instructions,
                    "debrief" : req.body.debrief,
                    "tags": req.body.tags
                }
            })

            res.status(200);
            res.json({
                "message": "tool updated"
            })
        } catch (e) {
            res.status (500);
            res.json({
                "message" : "Internal server error. Please contact administrator"
            }) 
            console.log(e)
        }
    })

    app.put("/update-likes/:id", async function(req,res){
        try{
            let likes = parseInt(req.body.likes)

            await MongoUtil.getDB().collection(TOOLS_COLLECTION_NAME).updateOne({
                "_id": ObjectId(req.params.id)
            },{
                "$set": {
                    "likes" : likes
                }
            })
            res.status(200);
            res.json({
                "message": "tool updated"
            })
        } catch (e) {
            res.status (500);
            res.json({
                "message" : "Internal server error. Please contact administrator"
            }) 
            console.log(e)
        }
    })

    app.put("/add-comment/:id", async function(req,res){
        try{
            let comment_id = new ObjectId()
            let email = req.body.email
            let userName = req.body.userName
            let comments = req.body.comments

            await MongoUtil.getDB().collection(TOOLS_COLLECTION_NAME).updateOne({
                "_id": ObjectId(req.params.id)
            },{
                $push : {
                    comments: {comment_id, userName, email, comments}
                }
            })
            res.status(200);
            res.json({
                "message": "Comment added"
            })
        } catch (e) {
            res.status (500);
            res.json({
                "message" : "Internal server error. Please contact administrator"
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

    app.get("/get-comment", async function(req,res){
        let comment_id = req.query.comment_id
        let email = req.query.email
        try{
            let response = await db.collection(TOOLS_COLLECTION_NAME).aggregate([
                {
                    "$unwind": "$comments"
                },
                {
                    "$match": {
                        "comments.comment_id" : ObjectId(comment_id),
                        "comments.email": email
                    }
                },
                {
                    "$project": {
                        "comment_id": "$comments.comment_id",
                        "email" : "$comments.email",
                        "_id": 0
                    }
                }
            ]).toArray()
            res.status(200);
            res.json(response)
        }catch(e){
            res.status(500)
            res.json({
                "message" : "Internal server error"
            })
            console.log(e)
            console.log("Internal server error")
        }
    })

    app.put("/delete-comment/", async function(req,res){
        let comment_id = req.body.comment_id

        try{
            await MongoUtil.getDB().collection(TOOLS_COLLECTION_NAME).updateOne({
                "comments.comment_id": ObjectId(comment_id)
            },{
                "$pull" : {
                    comments: {"comment_id" : ObjectId(comment_id)}
                }
    
            })
            res.status(200);
            res.json({
                "message": "Comment deleted"
            })
        } catch (e){
            res.status (500);
            res.json({
                "message" : "Internal server error. Please contact administrator"
            })
            console.log(e)
        }  
    })

    app.get("/users", async function (req, res) {
        let criteria = {};
        // const db = MongoUtil.getDB();
        let users = await db.collection(USERS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "users": users
        })
    })

    app.get("/tags", async function (req, res) {
        let criteria = {};
        // const db = MongoUtil.getDB();
        let tags = await db.collection(TAGS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "tags": tags
        })
    })

}
main();

//open the listening port
app.listen(process.env.PORT, function () {
    console.log("server started")
})