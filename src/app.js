import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

const app = express()
app.use(cors())
app.use(express.json())

//Conexão do banco de dados
let db
dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL);

mongoClient.connect()
.then(() => db = mongoClient.db())
.catch((err) => console.log(err.message))
//Fim da Conexão do banco de dados

const userSchema = joi.object({
    name: joi.string().required().min(1)
})

app.post("/participants", async(req, res) => {
    const { name } = req.body
    
    const validation = userSchema.validate({name}, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }
    
    try {
        const userExist = await db.collection("participants").findOne({name})
        if (userExist) return res.status(409).send("Usuário já cadastrado")

        await db.collection("participants").insertOne({
            name,
            lastStatus: Date.now()
        })

        await db.collection("messages").insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs().format("HH:mm:ss")
        })

        res.sendStatus(201)
    } catch (error) {
        res.status(500).send(error.message)
    }

})

app.get("/participants", async(req, res) => {
    try {
        const users = await db.collection("participants").find().toArray()
        res.send(users)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.post("/messages", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.get("/messages", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.post("/status", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(error.message)
    }
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
