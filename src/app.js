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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().required().valid("message", "private_message"),
    from: joi.string().required()
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
    const { to, text, type } = req.body
    const { user } = req.headers

    const validation = messageSchema.validate({to, text, type, from: user}, {abortEarly: false})
    
    if(validation.error){
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }

    try {
        const userExist = await db.collection("participants").findOne({name: user})
        if (!userExist) return res.status(422).send("Usuário não cadastrado")

        await db.collection("messages").insertOne({
            from: user,
            to,
            text, 
            type,
            time: dayjs().format("HH:mm:ss")
        })
        res.sendStatus(201)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.get("/messages", async(req, res) => {
    const { user } = req.headers
    const limit = req.query.limit
    
    if (isNaN(limit) && limit || parseInt(limit) <= 0) return res.sendStatus(422)

    try {

        const messages = await db.collection("messages").find({
            $or: [
              { from: user },
              { to: { $in: [user, "Todos"] } },
              { type: "message" }
            ]
          }).limit(Number(limit)).toArray()
      
        res.send(messages)
      

    } catch (error) {
        res.status(500).send(error.message)
    }
})

app.post("/status", async(req, res) => {
    const {user} = req.headers
    if (!user) return res.sendStatus(404)
    
    try {
        const userExist = await db.collection("participants").findOne({name: user})
        if (!userExist) return res.sendStatus(404)

        await db.collection("participants").updateOne(
            {name: user},
            {$set: {lastStatus: Date.now()}}
        )

        res.sendStatus(200)
    } catch (error) {
        res.status(500).send(error.message)
    }
})

setInterval (async () => {
    const seconds = Date.now() - 10000
    
    try {
        const inactive = await db.collection("participants").find({lastStatus: {$lte: seconds}}).toArray()

        if (inactive.length > 0) {
            const lastMessage = inactive.map((usuario) => {
                return {
                    from: usuario.name,
                    to: "Todos",
                    text: 'sai da sala...',
                    type: 'status',
                    time: dayjs().format("HH:mm:ss")
                }
            })
            await db.collection("messages").insertMany(lastMessage)
            await db.collection("participants").deleteMany({lastStatus: {$lte: seconds}})
        }

    } catch (error) {
        res.status(500).send(error.message)
    }

}, 15000)

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
