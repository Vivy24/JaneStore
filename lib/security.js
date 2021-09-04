const crypto = require('crypto');

class Security {
    static md5(value) {
        if(!value){
            return;
        }
        return crypto.createHash('md5').update(value).digest('hex');
    }

    static isValidNonce(value,req){
        return (value==this.md5(req.sessionID+req.headers['user-agent']));
    }

    static generateId(){
        const timestamp=(new Date().getTime() /1000 | 0).toString(16);
        const template='%'.repeat(16);
        return timestamp + template.replace(/[%]/g,()=>{
            return (Math.random()*16 | 0).toString(16);
        }).toLowerCase();
    }

    static genPassword(password){
        const salt= crypto.randomBytes(16).toString('hex');
        const hash=crypto.pbkdf2Sync(password,salt,10000,64,`sha512`).toString('hex');
        return {
        salt:salt,
        hash:hash
            }
    }

    static validPassword(hash, salt,passwordAttemp){
        const passwordHash=crypto.pbkdf2Sync(passwordAttemp,salt,10000,64,`sha512`).toString('hex');
        return hash===passwordHash;
    }
}

module.exports=Security