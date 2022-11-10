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
})


app.listen(5000, () => {console.log("Server running in port 5000")});