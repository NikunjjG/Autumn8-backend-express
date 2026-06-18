export interface IAppSessionTable {
    token: string,
    userid: number,
    created_at: Date,
    token_status: TTokenStatus
}

export type TTokenStatus = 'active' | 'revoked' | 'expired';