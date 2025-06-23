import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema({
    name:{ type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: {type:String},
    category: { type: String, required: true },
    stock: { type: Number, default: 0 },
    transactions: [{
        type: Schema.Types.ObjectId,
        ref: "Transaction",
    }],
}, {
    timestamps: true,
});

const transactionSchema = new Schema({
    type: { type: String, enum: ["INCREASE","DECREASE"], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);
export default Product;