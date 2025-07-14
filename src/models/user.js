const mongoose = require('mongoose');
const validator = require("validator");
const jsonWebToken  = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
    firstName:{
    type : String,
    required :true,
    index : true,
    minlength : 2,
    maxlength : 50,
},

lastName: {
    type : String,
},
emailId : {
    type : String,
    lowercase :true,
    required :true,
    unique : true,
    trim : true,
    validate(value) {
        if(!validator.isEmail(value)) {
            throw new Error("Invaild email address" +value );
        }
    },
},
password :{
    type : String,
    required :true,
    validate(value) {
        if(!validator.isStrongPassword(value)) {
            throw new Error("Enter new password" +value );
        }
    },

},
age :{
    type: Number,
    min:16,
},
gender :{
    type : String,
    enum : {
        values : ["Male", "Female", "Other"],
        message : '{VALUE} is not a valid gender type',
    }
},
photoUrl :{
    type: String,
    default:"https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg",
    validate(value) {
        if(!validator.isURL(value)) {
            throw new Error("Invaild Photo url " +value );
        }
    },

},
about :{
    type :String,
    default : "This is a about of the user",
},
skills : {
    type : [String],
},
semester: {
  type: Number,
  min: 1,
  max: 8
},
yearOfEducation: {
  type: Number,
  min: 1,
  max: 4
},
},
{
    timestamps :true,
}
);

userSchema.methods.getJWT = async function () {
    const user = this;

   const token = await jsonWebToken.sign({_id : user._id} ,"DEV@STUDENT$768", {
                expiresIn: "7d",
});
return token;
};
userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    const isPasswordValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    );
    return isPasswordValid;
};

const User = mongoose.model("User", userSchema);
module.exports = User;