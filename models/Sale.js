import mongoose from "mongoose";
const { Schema } = mongoose;

const saleSchema = new Schema({
    storeName:{type:String, required: true},   
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    products:[{
        productId:{type:Schema.Types.ObjectId, ref:"Product", required: true},
        name:{type:String, required: true},
        quantity:{type:Number, required: true},
        price:{type:Number, required: true}
    }],
    totalAmount: { type: Number, required: true },
    date:{ type: Date, default: Date.now },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

},{
    timestamps: true,
});
const Sale = mongoose.model("Sale", saleSchema);
export default Sale;