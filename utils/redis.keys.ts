export const REDIS_KEYS = {
    USER_CREDITS: (userid: string) => `credits:${userid}`
}