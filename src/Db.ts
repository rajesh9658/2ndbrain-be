import mongoose,{ Schema, model } from "mongoose";

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  
  
});

export const usermodel1 = model("User", userSchema);

const brainSchema = new Schema({
    title: String,
    link:String,
    tag:[{type:mongoose.Types.ObjectId,ref:"tag"}],
    type:String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true },
})

const linkSchema = new Schema({
    hash:String,
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true, unique: true },
})

export const Brain = model("Brain", brainSchema);
export const Link = model("Link", linkSchema);