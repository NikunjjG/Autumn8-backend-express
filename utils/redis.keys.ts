export const REDIS_KEYS = {
    USER_CREDITS: (userid: string) => `credits:${userid}`,
    AUTH_TOKEN: (userid: string, jti: string) => `auth:${userid}:${jti}`
}