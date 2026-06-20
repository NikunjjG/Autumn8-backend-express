import {Redis} from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT ?? "6379"),
    password: process.env.REDIS_PASSWORD ?? ""
})

redis.on("ready", () => {
    console.log("The redis connection is ready!")
})

redis.on("error", (err) => {
    console.log({message:"There was an error connecting with the redis", error: err})
})

export default redis