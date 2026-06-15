import express from "express"
import {createServer} from "node:http"
import { Server } from 'socket.io'
import dotenv from "dotenv"
import { WEB_SOCKET_ACTIONS } from "./constants/ws_actions.js"
import { randomUUID } from "node:crypto"
import { decodeSessionToken, generateJWTToken } from "./utils/helper.functions.js"

dotenv.config()
const app = express();
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

io.on(WEB_SOCKET_ACTIONS.CONNECTION, (socket) => {
    console.log(`A user with socket connection id ${socket.id} connected`)

    let activeSessionId: string;

    socket.on(WEB_SOCKET_ACTIONS.CREATE_SESSION, async (userId: string) => {
        const sessionId = randomUUID()
        activeSessionId = sessionId;
        await socket.join(sessionId)
        const sessionToken = generateJWTToken({ user: userId, sessionId: sessionId }, "1h")
        socket.emit(WEB_SOCKET_ACTIONS.SESSION_CREATED, {sessionId: sessionId, sessionToken: sessionToken, userId: userId})
    })

    socket.on(WEB_SOCKET_ACTIONS.JOIN_SESSION, async (token: string) => {
        try {
        const { sessionId } = await decodeSessionToken(token) as {sessionId: string, sessionToken?: string};
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