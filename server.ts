import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import cors from "cors"

const app = express()
app.use(express.json())
app.use(cors())

const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

export { app, server, io }
