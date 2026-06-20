import { query } from "../db.js"
import { QEURIES } from "../queries/index.js"
import redis from "../redis.js"
import type { IUserTable } from "../types/user.types.js"
import { REDIS_KEYS } from "../utils/redis.keys.js"

export const getUserCredits = async(userid: string) => {
    try{
        const creditsRedis = await redis.get(REDIS_KEYS.USER_CREDITS(userid))
        if(!creditsRedis){
            const result = await query(QEURIES.USER_QUERIES.GET.CREDITS_FROM_USERID(), [userid])
            const creditsPg: IUserTable = result?.rows?.[0];
            await redis.set(REDIS_KEYS.USER_CREDITS(userid), creditsPg?.credits)
            return creditsPg.credits;
        }
        return parseInt(creditsRedis, 10)
    }catch(err){
        console.log({msg: "Error fetching credits", err: err})
    }
}

export const deductUserCredits = async(userid: string, amount: number) => {
    try{
        const newBalance = await redis.decrby(REDIS_KEYS.USER_CREDITS(userid), amount)
        if(newBalance >= 0){
            return({
                success: true,
                remaining: newBalance
            })
        }
        const originalBalance = await redis.incrby(REDIS_KEYS.USER_CREDITS(userid), amount)
        return({
            success: false,
            remaining: originalBalance
        })
    }catch(err){
         console.log({msg: "There was a problem completing the operation", err: err})
    }
}

export const syncDBtoCache = async() => {
    try{
        const stream = redis.scanStream({ match: "credits:*" })
        stream.on("data", async (keys) => {
            for (const key of keys) {
                const value = await redis.get(key)
                const userId = key.split(":")[1]
                if (!value || !userId) continue
                await query(QEURIES.USER_QUERIES.WRITE.UPDATE_USER_CREDITS(), [value, userId])
            }
        })
        stream.on("error", (err) => {
            console.error("Redis scan error:", err)
        })
    }catch(err){
        console.log(err)
    }
}