/*
* //@returns a SQL query that helps fetch the user based on email
* //@example {id: 1, "email: john@example.com", username: "John", is_active: true, created_at: "2026-01-01"}
*/

import { TABLE_LOOKUPS } from "../utils/table.lookups.js"

const getUserFromEmail = () => {
    return `SELECT * from ${TABLE_LOOKUPS.USER_TABLE} WHERE email = $1`
}

const writeNewUserIntoTable = () => {
    return `INSERT INTO ${TABLE_LOOKUPS.USER_TABLE} (username, email, hashed_password) 
    VALUES($1, $2, $3)`
}

export const USER_QUERIES = {
    GET: {
        USER_FROM_EMAIL: getUserFromEmail
    },
    WRITE: {
        CREATE_NEW_USER: writeNewUserIntoTable
    }
}