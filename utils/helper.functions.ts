import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';

export const generateJWTToken = (payload: object, secret: string, ttl?: string,): string => {
  
  const options: jwt.SignOptions = {
  ...(ttl && ttl.trim() !== '' 
    ? { expiresIn: ttl as jwt.SignOptions['expiresIn'] } 
    : {})
} as jwt.SignOptions;

  return jwt.sign(payload, secret, options)
};

export const decodeSessionToken = async(token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret);
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

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
    const isMatch = await bcrypt.compare(password, storedHash);
    return isMatch;
};