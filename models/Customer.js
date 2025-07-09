import mongoose from "mongoose";
const {Schema} = mongoose;

const customerSchema = new Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  purchases: [{
    saleId: { type: Schema.Types.ObjectId, ref: "Sale" },
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;