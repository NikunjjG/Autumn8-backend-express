import {type Request, type Response} from 'express'
import { getUserCredits } from '../services/credits.service.js'

export const fetchCreditsController = async (req: Request, res: Response) => {
    try{
        const userId = req.user?.id
        if(!userId){
            return res.status(401).json({msg: "User not authenticated!"})
        }
        const credits = await getUserCredits(userId.toString())
        return res.status(200).json({ credits })
    }catch(err){
        console.log(err)
        return res.status(409).json({msg: 'There was some error fetching credits', err: err})
    }
}