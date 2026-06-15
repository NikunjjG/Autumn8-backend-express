import jwt from 'jsonwebtoken'

export const generateJWTToken = (payload: object, ttl?: string): string => {
  const secretKey = process.env.JWT_SECRET ?? ''

  const options: jwt.SignOptions = {
  ...(ttl && ttl.trim() !== '' 
    ? { expiresIn: ttl as jwt.SignOptions['expiresIn'] } 
    : {})
} as jwt.SignOptions;

  return jwt.sign(payload, secretKey, options);
};

export const decodeSessionToken = async(token: string) => {
  const secretKey = process.env.JWT_SECRET ?? '';
  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      console.error('Verification failed: Token has expired.');
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Verification failed: Token signature is invalid.');
    } else {
      console.error('Verification failed:', error.message);
    }
    
    return null;
  }
}