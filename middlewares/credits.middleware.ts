import {type Request, type Response, type NextFunction} from 'express'
import { getUserCredits } from '../services/credits.service.js'

export const creditGate = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id
    const userCredits = await getUserCredits(userId?.toString() ?? '') ?? 0
    if(userCredits <= 0){
        return res.status(403).json({msg: 'Not enough credits to perform this operation'})
    }else{
        next()
    }
}