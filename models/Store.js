import mongoose from "mongoose";
const { Schema } = mongoose;

const storeSchema = new Schema({
  name: { type: String, required: true },
  owner: { type: Schema.Types.ObjectId, ref: "User" }, // The user who created the store
  // Optionally, add address, contact info, etc.
}, { timestamps: true });

const Store = mongoose.model("Store", storeSchema);
export default Store; 