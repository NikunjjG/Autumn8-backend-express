import {Redis} from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_HOST ?? '')

redis.on("ready", () => {
    console.log("The redis connection is ready!")
})

redis.on("error", (err) => {
    console.log({message:"There was an error connecting with the redis", error: err})
})

export default redis