import bcrypt from "bcrypt";

// hashes password 
const hashPassword = async (password)=>{
    try{
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    }catch(error){
        console.error(error);
        throw error
    }
}

const comparePassword = async (password, hashed) => {
    try {
        const isMatch = await bcrypt.compare(password, hashed);
        return isMatch;
    } catch (error) {
        throw error;
    }
}

export default { hashPassword, comparePassword }

