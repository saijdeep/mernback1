const validator = require("validator");

const validateSignUpData = (req)=> {
    const {firstName, lastName, emailId, password} = req.body;
    
    if(!firstName || !lastName){
        throw new Error("Name is not valid");
    }
    if(firstName.length < 3){
        throw new Error("Firstname should be 4-50 charaters");
    }
    if(!validator.isStrongPassword(password)){
        throw new Error("Please enter a strong password");
    }
    if(!validator.isEmail(emailId)){
        throw new Error("Email not valid");
    }
};

const validateEditProfileData = (req) => {
    const allowedEditFields = [
        "firstName",
        "lastName",
        "emailId",
        "photoUrl",
        "gender",
        "age",
        "about",
        "skills",
        "semester",
        "yearOfEducation"
    ];

    // Check if all fields are allowed
    const isEditAllowed = Object.keys(req.body).every((field) => 
        allowedEditFields.includes(field)
    );

    if (!isEditAllowed) {
        throw new Error("Invalid fields in edit request");
    }

    // Validate photoUrl if provided
    if (req.body.photoUrl && !(validator.isURL(req.body.photoUrl) || req.body.photoUrl.startsWith('/'))) {
        throw new Error("Invalid photo URL");
    }

    // Validate age if provided
    if (req.body.age && !validator.isInt(req.body.age.toString(), { min: 16, max: 100 })) {
        throw new Error("Age must be between 16 and 100");
    }

    // Validate gender if provided
    if (req.body.gender && !["Male", "Female", "Other"].includes(req.body.gender)) {
        throw new Error("Invalid gender value");
    }

    // Validate semester if provided
    if (req.body.semester && !validator.isInt(req.body.semester.toString(), { min: 1, max: 8 })) {
        throw new Error("Semester must be between 1 and 8");
    }

    // Validate yearOfEducation if provided
    if (req.body.yearOfEducation && !validator.isInt(req.body.yearOfEducation.toString(), { min: 1, max: 4 })) {
        throw new Error("Year of education must be between 1 and 4");
    }

    return true;
};

module.exports = {
    validateSignUpData,
    validateEditProfileData,
};