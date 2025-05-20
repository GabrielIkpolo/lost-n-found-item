import crypto from 'crypto';
import bcrypt from 'bcrypt';


export const generateVarificationToken = async ()=>{
    const token = crypto.randomBytes(32).toString('hex');
    return bcrypt.hash(token,10); // store hashed token
}