import { TABLE_LOOKUPS } from "../utils/table.lookups.js"

const writeIntoSessionTable = () => {
    return `INSERT INTO ${TABLE_LOOKUPS.APP_SESSION_TABLE} (token, userid) 
    VALUES($1, $2)`
}

export const AUTH_QUERIES = {
    WRITE: {
        TOKEN_INTO_SESSION_TABLE: writeIntoSessionTable
    }
}