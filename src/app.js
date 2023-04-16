import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"

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

app.post("/participants", async(req, res) => {
    const { name } = req.body
    
    const userSchema = joi.object({
        name: joi.string().required()
    })

    const validation = userSchema.validate(name, {abortEarly: false})

    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }
    
    try {
        const userExist = await db.collection("participants").findOne({name: name})
        if (userExist) return res.status(409).send("Usuário já cadastrado")

        db.collection("participants").insertOne({
            name,
            lastStatus: Date.now()
        })
        res.sendStatus(201)
    } catch (error) {
        res.status(500).send(err.message)
    }
})

app.get("/participants", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(err.message)
    }
})

app.post("/messages", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(err.message)
    }
})

app.get("/messages", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(err.message)
    }
})

app.post("/status", async(req, res) => {
    try {
        
    } catch (error) {
        res.status(500).send(err.message)
    }
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
