import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();
// ...

const participantSchema = joi.object({
  name: joi.string().required(),
  lastStatus: joi.number(),
});

const messageSchema = joi.object({
  to: joi.string().min(1).required(),
  text: joi.string().min(1).required(),
  type: joi.valid("message").valid("private_message"),
});

const app = express();

app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(() => {
  db = mongoClient.db("batePapoUol");
});

app.post("/participants", async (req, res) => {
  const newParticipant = {
    name: req.body.name,
    lastStatus: Date.now(),
  };

  const validation = participantSchema.validate(newParticipant, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  try {
    const messageStatus = {
      from: newParticipant.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    };

    const participantExist = await db
      .collection("participants")
      .findOne({ name: newParticipant.name });

    if (participantExist) {
      return res.sendStatus(409);
    }
    await db.collection("participants").insertOne(newParticipant);
    await db.collection("messages").insertOne(messageStatus);
    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(422);
  }
});

app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.send(participants);
  } catch (err) {
    res.sendStatus(422);
  }
});

app.post("/messages", async (req, res) => {
  const newMessage = req.body;
  const fromUser = req.headers.user;

  if(!fromUser){
    res.sendStatus(401);
    return;
  }

  const validation = messageSchema.validate(newMessage,{abortEarly: false});

  if(validation.error){
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  try{
    const userExist = await db.collection("participants").findOne({name: fromUser});
    if(!userExist){
       return res.status(422).send({message: "Usuario inexistente na lista de participantes"})
    }

    const message = {
        from: fromUser,
        to: newMessage.to,
        text: newMessage.text,
        type: newMessage.type,
        time:dayjs().format("HH:mm:ss")
    }

    await db.collection("messages").insertOne(message);
    res.sendStatus(201);

  } catch(err){
    console.log("erro é aqui")
    res.sendStatus(422);
  }
});

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;

    try{
        const messages = await db.collection("messages")
        .find(
            {
                $or:[
                    {to:{$in: ["Todos", user]}},
                    {from: user}
                ]
                
            }
        ).toArray();
        res.send(messages.slice(-limit).reverse());

    } catch(err){
        res.sendStatus(422);
    }
})
app.listen(5000, () => {
  console.log("Server running in port 5000");
});
