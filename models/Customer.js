import mongoose from "mongoose";
const {Schema} = mongoose;

const customerSchema = new Schema({
    name:{ type: String, required: true },
    email:{type: String},
    phone:{type: String},
    address:{type: String},
    purchases:[{
        saleId:{type:Schema.Types.ObjectId, ref:"Sale"},
        date:{type:Date, default: Date.now}
    }],
},
{
    timestamps: true,
});

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;