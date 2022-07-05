const express = require ("express");
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

const USERS_COLLECTION_NAME="users";
const TOOLS_COLLECTION_NAME="tools";
const TAGS_COLLECTION_NAME="tags";


//routes
async function main(){
    await MongoUtil.connect(process.env.MONGO_URI, "tgc-session-tools");
    const db = MongoUtil.getDB();

    app.get("/", function(req,res){
        res.json({
            "message": "welcome to session tools api"
        })
    })

    app.get("/tools", async function(req,res){
        let criteria = {};
        // const db = MongoUtil.getDB();
        let tools = await db.collection(TOOLS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "tools": tools
        })
    })

    app.get("/users", async function(req,res){
        let criteria = {};
        // const db = MongoUtil.getDB();
        let users = await db.collection(USERS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "users": users
        })
    })

    app.get("/tags", async function(req,res){
        let criteria = {};
        // const db = MongoUtil.getDB();
        let tags = await db.collection(TAGS_COLLECTION_NAME).find(criteria).toArray();
        res.json({
            "tags": tags
        })
    })

    app.post("/add-tag", async function(req, res){
        try {
            let id = ObjectId;
            let name= "new-tag";
            let displayName="New Tag";
    
            const db = MongoUtil.getDB();
    
            await db.collection(TAGS_COLLECTION_NAME).insertOne({
                id,
                name,
                displayName
            });
    
            res.status(200);
            res.json({
                "message": "tag added"
            })
        } catch (e){
            res.status(500);
            res.json({
                "message": "Internal serve error. Please contact administrator"
            })
            console.log(e)
        }
        
        
        
    })
}
main();

//open the listening port
app.listen(process.env.PORT, function(){
    console.log("server started")
})