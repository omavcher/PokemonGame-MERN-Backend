const mongoose = require("mongoose");

const conn = async ()=>{
    try{
        await mongoose.connect(process.env.DB_URI);
        console.log("Connected to DB")

    }catch(err){
        console.log(err);
    }
}

conn();