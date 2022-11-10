import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();

app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient("mongodb://localhost:27017");
let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("batePapoUol")
});

app.post("/participants", async (req, res) => {
    const newParticipant = {
        name: req.body.name,
        lastStatus: Date.now()
    }
    console.log(newParticipant);
    try{
        await db.collection("participants").insertOne(newParticipant);
        res.sendStatus(201)

    } catch(err){
        res.sendStatus(422);
    }
})

app.get("/participants", async (req, res) => {
    try{
        const participants = await db.collection("participants").find().toArray()
        res.send(participants)
    } catch(err){
        res.sendStatus(422);
    }
})


app.listen(5000, () => {console.log("Server running in port 5000")});