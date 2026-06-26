import dotenv from "dotenv"
dotenv.config()

import { app, server, io } from "./server.js"
import { WEB_SOCKET_ACTIONS } from "./constants/ws_actions.js"
import { decodeSessionToken } from "./utils/helper.functions.js"
import authRouter from "./routes/v1/auth.routes.js"
import redis from './redis.js'
import './mongo.js'
import { syncDBtoCache } from "./services/credits.service.js"
import { authGate } from "./middlewares/auth.middleware.js"
import creditsRouter from "./routes/v1/credits.routes.js"
import workflowRouter from "./routes/v1/workflow.routes.js"

app.use('/auth', authRouter)
app.use('/credits', authGate, creditsRouter)

app.post('/workflows/:id/progress', (req, res) => {
    const workflowId = req.params.id
    io.to(`workflow:${workflowId}`).emit('EXECUTION_PROGRESS', req.body)
    res.status(200).send()
})

app.use('/workflows', authGate, workflowRouter)

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token
        if (!token) return next(new Error('Unauthorized'))

        const decoded = await decodeSessionToken(token, process.env.JWT_SECRET_LOGIN ?? '') as { id: number; username: string; email: string }
        if (!decoded) return next(new Error('Unauthorized'))

        socket.data.userId = decoded.id
        socket.data.username = decoded.username

        const collabToken = socket.handshake.auth.collabToken
        if (collabToken) {
            const workflowId = await redis.get(`collab:${socket.handshake.auth.workflowId}:${collabToken}`)
            if (!workflowId) return next(new Error('Invalid collaboration session'))
            socket.data.isCollaborator = true
            socket.data.collabToken = collabToken
        }

        next()
    } catch {
        next(new Error('Unauthorized'))
    }
})

io.on(WEB_SOCKET_ACTIONS.CONNECTION, (socket) => {
    console.log(`User ${socket.data.username} (${socket.id}) connected`)

    socket.on(WEB_SOCKET_ACTIONS.JOIN_WORKFLOW, async (workflowId: string) => {
        const room = `workflow:${workflowId}`
        await socket.join(room)
        socket.data.workflowRoom = room

        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.USER_JOINED, {
            userId: socket.data.userId,
            username: socket.data.username,
            socketId: socket.id,
        })

        console.log(`${socket.data.username} joined room ${room}`)
    })

    socket.on(WEB_SOCKET_ACTIONS.NODES_CHANGE, (data: { changes: any[] }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.NODES_CHANGE, {
            changes: data.changes,
            senderId: socket.id,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.EDGES_CHANGE, (data: { changes: any[] }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.EDGES_CHANGE, {
            changes: data.changes,
            senderId: socket.id,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.NODE_ADDED, (data: { node: any }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.NODE_ADDED, {
            node: data.node,
            senderId: socket.id,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.EDGE_ADDED, (data: { edge: any }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.EDGE_ADDED, {
            edge: data.edge,
            senderId: socket.id,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.NODE_DATA_UPDATED, (data: { nodeId: string; nodeData: any }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.NODE_DATA_UPDATED, {
            nodeId: data.nodeId,
            nodeData: data.nodeData,
            senderId: socket.id,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.CURSOR_MOVEMENT, (data: { x: number; y: number }) => {
        const room = socket.data.workflowRoom
        if (!room) return
        socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.CURSOR_MOVEMENT, {
            userId: socket.data.userId,
            username: socket.data.username,
            x: data.x,
            y: data.y,
        })
    })

    socket.on(WEB_SOCKET_ACTIONS.DISCONNECT, () => {
        const room = socket.data.workflowRoom
        if (room) {
            socket.broadcast.to(room).emit(WEB_SOCKET_ACTIONS.USER_LEFT, {
                userId: socket.data.userId,
                username: socket.data.username,
                socketId: socket.id,
            })
        }
        console.log(`User ${socket.data.username} (${socket.id}) disconnected`)
    })

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

