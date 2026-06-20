export interface IUserTable {
    id: number,
    username: string,
    email: string,
    credits: number
    is_active?: boolean,
    created_at?: Date
    hashed_password?: string
}
