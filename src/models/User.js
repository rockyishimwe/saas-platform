const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:[true,'First name is required'],
        trim:true,
        maxLength:[50,'First name cannot exceed 50 characters']
    },
    lastName:{
        type:String,
        required:[true,'Last name is required'],
        trim:true,
        maxLength:[50,'Last name cannot exceed 50 characters']
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:true,
        lowercase:true,
        trim:true,
        match:[/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,'Please enter a valid email']
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        minlength:[6,'Password must be at least 6 characters long'],
        select:false
    },
    role:{
        type:String,
        enum:['admin','manager','member'],
        default:'member'
    },
    companyId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Company',
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    lastLogin:{
        type:Date
    },
},{
    timestamps:true
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();
    try{
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password,salt);
        next();
    } catch(error){
        next(error);
    }
});
userSchema.methods.comparePassword = async function(candidatePassword){
    return await  bcrypt.compare(candidatePassword,this.password);
};
userSchema.virtual('fullName').get(function (){
    return `${this.firstName} ${this.lastName}`;
});
module.exports = mongoose.model('User', userSchema);