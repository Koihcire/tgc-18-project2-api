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

    app.get("/", function(req,res){
        res.json({
            "message": "welcome to session tools api"
        })
    })

    app.get("/tools", async function(req,res){
        const db = MongoUtil.getDB();
        let tools = await db.collection(TOOLS_COLLECTION_NAME).toArray();
        res.json({
            "tools": tools
        })
    })
}
main();

//open the listening port
app.listen(process.env.PORT, function(){
    console.log("server started")
})