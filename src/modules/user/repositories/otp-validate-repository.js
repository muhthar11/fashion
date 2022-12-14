const db = require('../../../../config/connection');
const collections = require('../../../../config/collections');
const bcrypt=require('bcrypt');
const { response } = require('../../../../app');
const objectId =require('mongodb').ObjectId;

let config ={
    serviceSID:process.env.serviceSID,
    accountSID:process.env.accountSID,
    authToken:process.env.authToken
}

const client = require('twilio')(config.accountSID,config.authToken);
module.exports={

    getOtp:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            console.log("userData ==",userData)
            let check = await db.get().collection(collections.USER_COLLECTION).findOne(
                {
                    $or:
                    [
                        {  
                            email:userData.email,
                        },
                        {
                            mobileNo:userData.mobileNo,
                        }
                    ]
                }
            );
          
            console.log("check =",check)
            if(check){
                reject("Email or mobileNo Alrady Exist")
            }
            else{
                client.verify.services(config.serviceSID).verifications.create({
                    to:`+91${userData.mobileNo}`,
                    channel:"sms"
                  }).then((response)=>{
                    console.log("muhthar")
                    resolve(response);
                })
              
            }

         

         })
    },

    verifyOtp:(verifyOtp,userData)=>{
        console.log("verifyOtp ==",verifyOtp)
        return new Promise(async(resolve,reject)=>{
            let phoneNumber ="+91"+userData.mobileNo
            console.log("phoneNumber=",phoneNumber)
            client.verify.v2.services(config.serviceSID).verificationChecks.create({
                    to:phoneNumber,
                    code: verifyOtp
                }).then(async(response)=>{
                    console.log("validation ==",response);
                    if(response.status == 'approved'){
                        userData.password=await bcrypt.hash(userData.password,10)
                        userData.status = true;
                        userData.recordStatusId =1;
                        db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                            console.log("success")
                           resolve(data);
                        })
                    }
                    // else{
                    //     resolve("")
                    // }
                 }).catch((err)=>{
                    console.log("err =",err)
                })
        })
    }
}