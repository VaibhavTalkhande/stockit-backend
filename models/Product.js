import mongoose from "mongoose";
const { Schema } = mongoose;

const productSchema = new Schema({
    name:{ type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    image: {type:String},
    category: { type: String, required: true },
    stock: { type: Number, default: 0 },
    store:{type:Schema.Types.ObjectId,ref:"Store",require:true}
}, {
    timestamps: true,
});



const Product = mongoose.model("Product", productSchema);
export default Product;