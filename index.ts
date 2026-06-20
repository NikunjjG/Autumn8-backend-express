import express, {type Request, type Response} from "express"
import {createServer} from "node:http"
import { Server } from 'socket.io'
import dotenv from "dotenv"
import { WEB_SOCKET_ACTIONS } from "./constants/ws_actions.js"
import { randomUUID } from "node:crypto"
import { decodeSessionToken, generateJWTToken } from "./utils/helper.functions.js"
import { query } from "./db.js"
import authRouter from "./routes/v1/auth.routes.js"
import redis from './redis.js'
import './mongo.js'
import { syncDBtoCache } from "./services/credits.service.js"
import cors from 'cors'
import { authGate } from "./middlewares/auth.middleware.js"
import creditsRouter from "./routes/v1/credits.routes.js"

interface IUser {
    id: number,
    username: string, 
    email: string 
}

dotenv.config()
const app = express();
app.use(express.json())
app.use(cors())
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

app.get('/users', async (req: Request, res: Response) => {
  try{
    const userid  = req.query.userid as string

    if (!userid) {
      return res.status(400).json({ message: 'userid query parameter is required' });
    }

    const DB_QUERY = `SELECT username, email from users where id = $1`
    const result = await query(DB_QUERY, [userid])

    const user: IUser = result?.rows?.[0]

    if(!user){
       return res.status(404).json({message: 'User not found'})
    }

    return res.status(200).json(user)
  }catch(err){
    console.log(err)
  } 
})

app.use('/auth', authRouter)
app.use('/credits', authGate, creditsRouter)

io.on(WEB_SOCKET_ACTIONS.CONNECTION, (socket) => {
    console.log(`A user with socket connection id ${socket.id} connected`)

    let activeSessionId: string;

    socket.on(WEB_SOCKET_ACTIONS.CREATE_SESSION, async (userId: string) => {
        const sessionId = randomUUID()
        activeSessionId = sessionId;
        await socket.join(sessionId)
        const sessionToken = generateJWTToken({ user: userId, sessionId: sessionId }, process.env.JWT_SECRET_COLLABORATION ?? '', "1h")
        socket.emit(WEB_SOCKET_ACTIONS.SESSION_CREATED, {sessionId: sessionId, sessionToken: sessionToken, userId: userId})
    })

    socket.on(WEB_SOCKET_ACTIONS.JOIN_SESSION, async (token: string) => {
        try {
        const { sessionId } = await decodeSessionToken(token, process.env.JWT_SECRET_COLLABORATION ?? '') as {sessionId: string, sessionToken?: string};
        activeSessionId = sessionId;
        if (sessionId) {
            await socket.join(sessionId);
            console.log(`Socket ${socket.id} successfully joined room: ${sessionId}`);
        }
        } catch (err) {
            console.error("Failed to join session due to token error:", err);
        }
    })

    socket.on(WEB_SOCKET_ACTIONS.CURSOR_MOVEMENT, (data: { userId: string; coordinates: { x: number; y: number } }) => {
        if (!data) return;

        socket.broadcast.to(activeSessionId).emit(WEB_SOCKET_ACTIONS.CURSOR_MOVEMENT_LISTENER, {
            userId: data.userId,
            coordinates: data.coordinates
        }); 
    });
})

app.use('/', (_req,res) => {
    res.send('<h1>Hello</h1>')
})

server.listen(process.env.PORT, () => {
    console.log(`Server up and running at port ${process.env.PORT}`)
})

const syncInterval = setInterval(async() => {
    await syncDBtoCache()
}, 5*60*1000)

process.on("SIGTERM", async () => {
    clearInterval(syncInterval)
    await syncDBtoCache()
    process.exit(0)
})

process.on("SIGINT", async () => {
    clearInterval(syncInterval)
    await syncDBtoCache()
    process.exit(0)
})

