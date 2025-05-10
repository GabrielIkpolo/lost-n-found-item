import bcrypt from "bcrypt";
import dotenv from 'dotenv';


// hashes password 
export const hashPassword = async (password)=>{
    try{
        const saltRounds = parseInt(process.env.SALT_ROUNDS, 10);
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }catch(error){
        console.error("Error hashing password",error);
        throw error
    }
}

export const comparePassword = async (password, hashed) => {
    try {
        const isMatch = await bcrypt.compare(password, hashed);
        return isMatch;
    } catch (error) {
        console.log("Error comparing password", error);
        throw error;
    }
}

export default { hashPassword, comparePassword }

