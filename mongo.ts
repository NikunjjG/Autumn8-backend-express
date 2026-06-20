import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

export const noSqlConnection = async() => {
    try{
        const connection = await mongoose.connect(process.env.MONGODB_URI ?? '')
        console.log("MongoDB connected:", connection.connection.host)
    }catch(err){
        console.log({msg: "There was problem connecting to the database", err: err})
    }
}