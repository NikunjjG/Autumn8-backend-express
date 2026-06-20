import { type Socket } from "socket.io"
import { decodeSessionToken } from "../utils/helper.functions.js"


export const socketAuth = async(socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token
    if(!token){
        return next(new Error("Unauthorized"))
    }
    const decoded = await decodeSessionToken(token, process.env.JWT_SECRET_LOGIN ?? '')as { id: number; username: string; email: string }
    if(decoded){
        socket.data.userId = decoded.id
        next()
    }else{
         return next(new Error("Unauthorized"))
    }
}