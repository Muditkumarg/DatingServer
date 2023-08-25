const adminData = require('../Model/AdminSchema')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "Api";
const generateUniqueId = require('generate-unique-id');
const adminSignUp = async (req, res) => {
    try {
        const {name,email, password} = req.body;
        console.log(req.body);
        const existingUser = await adminData.findOne({ email: email });
        if (existingUser) {
            return res.json({ message: "user already exist", success: false });
        } else {
            const refrenceId = generateUniqueId({
                length: 10,
                useLetters: false,
                includeSymbols: [''],
            });
            const hashedPassword = await bcrypt.hash(password, 10);
            const Signupuser = await adminData.create({
                name: name,
                email: email,
                password: hashedPassword,
                refrenceId: refrenceId
            });
            const token = jwt.sign({ email: Signupuser.email }, SECRET_KEY);
            res.status(201).json({ message: "Register successfully", success: true, token: token })
        }
    } catch {
        res.json({message:"something went wrong"});
    }
}

const adminLoginRequest = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await adminData.findOne({ email: email })
        if (!existingUser) {
            return res.json({ message: "user not found", success: false });
        }
        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if (!matchPassword) {
            return res.json({ message: "Invalid Credential", success: false })
        };
        const token = jwt.sign({ email: existingUser }, SECRET_KEY);
        res.json({ message: "Login successfully", success: true, token: token });
    } catch {
        res.json({ message: "something went wrong" });
    }
}

module.exports = {adminSignUp,adminLoginRequest}