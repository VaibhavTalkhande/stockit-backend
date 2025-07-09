import mongoose from "mongoose";
const { Schema } = mongoose;

const saleSchema = new Schema({
  store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}, { timestamps: true });
const Sale = mongoose.model("Sale", saleSchema);
export default Sale;