import {type Request, type Response, type NextFunction} from 'express'
import { decodeSessionToken } from '../utils/helper.functions.js'

export const authGate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1]
    if(!token){
        return res.status(401).json({msg: 'User is not authorized to access these resources'})
    }

    const decoded = await decodeSessionToken(token, process.env.JWT_SECRET_LOGIN ?? '')
    if(decoded){
        req.user = decoded as { id: number; username: string; email: string }
        next()
    }else{
        return res.status(401).json({msg: 'User is not authorized to access these resources'})
    }

}