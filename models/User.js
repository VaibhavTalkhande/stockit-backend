import mongoose from "mongoose";
const {Schema} = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    storeName:{type:String,required:true},
    phone:{type:String},
    address:{type:String},
    image:{type:String},
},
{
    timestamps: true,
});

const User = mongoose.model("User", userSchema);
export default User;