const mongoose = require("mongoose");
const connectDB = async() =>{
    await mongoose.connect(
       "mongodb+srv://admin:admin@cluster0.hlcetbh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )};
module.exports = connectDB;
connectDB()
.then(()=>{
    console.log("Database conection  established");
})
.catch((err) =>{
    console.log("Database cannot be connected ");

});
