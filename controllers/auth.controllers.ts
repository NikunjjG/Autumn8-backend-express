import { type Request, type Response } from "express"
import { query } from "../db.js"
import { QEURIES } from "../queries/index.js"
import type { IUserTable } from "../types/user.types.js"
import { generateJWTToken, hashPassword, verifyPassword } from "../utils/helper.functions.js"

export const LoginController = async(req: Request, res: Response) => {
    try{
        const { email, password } = req.body

        if(!password || !email){
            return res.status(400).json({message: 'Incomplete payload, both email and password are required'})
        }

        const result = await query(QEURIES.USER_QUERIES.GET.USER_FROM_EMAIL(), [email])
        const user: IUserTable = result.rows?.[0];

        console.log({user, email, password})

        const isPasswordVerified = await verifyPassword(password, user.hashed_password ?? '')
        
        if(!user){
            return res.status(404).send({message: 'No user with the given credentials found.'})
        }else if(!isPasswordVerified){
            return res.status(401).send({message: 'Invalid credentials'})
        }
        
        delete user.hashed_password;
        const authToken = await generateJWTToken({id:user?.id ,username: user?.username, email: user?.email}, process.env.JWT_SECRET_LOGIN ?? '')
        await query(QEURIES.AUTH_QUERIES.WRITE.TOKEN_INTO_SESSION_TABLE(), [authToken, user.id])

        return res.status(200).json({token: authToken, ...user})
    }catch(err){
        console.log(err)
        res.status(409).json({message: 'Error logging in. Please try in some time', err_msg: err})
    }
}

export const SignUpController = async(req: Request, res: Response) => {
    try{
        const {username, email, password} = req.body;
        if(!password || !email || !username){
            return res.status(400).json({message: 'Incomplete payload, username, email and password are mandatory'})
        }

        const result = await query(QEURIES.USER_QUERIES.GET.USER_FROM_EMAIL(), [email])
        const user: IUserTable = result.rows?.[0];

        if(user){
            return res.status(409).json({message: 'User already exists. Please try logging in.'})
        }
        
        const hashedPassword = await hashPassword(password)
        await query(QEURIES.USER_QUERIES.WRITE.CREATE_NEW_USER(), [username, email, hashedPassword])
        // const fetchedResult = await query(QEURIES.USER_QUERIES.GET.USER_FROM_EMAIL(), [email])
        // const createdUser: IUserTable = fetchedResult.rows?.[0];

        return res.status(200).json({message: 'User created succesfully!'})
    }catch(err){
        console.log(err)
        res.status(409).json({message: 'Error creating a new account. Please try in some time', err_msg: err})
    }
}
