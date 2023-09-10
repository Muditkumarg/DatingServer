const { userData, userPhoto, userMessage, FriendRequestData, ProFileLikeData } = require('../Model/UserSchema')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "Api";
const generateUniqueId = require('generate-unique-id');
const axios = require('axios');
var generator = require('generate-password');

const getData =(req,res)=>{
    res.send("I am node js")
}

const getAllUserRequest = async (req, res) => {
    await userData.find({}, { password: 0 }).then((err, data) => {
        if (err) {
            res.json(err)
        } else {
            res.json(data)
        }
    })
}
const SignUpRequest = async (req, res) => {
    try {
        const { username, contactnumber, email, password, dob, country, city, gender, lookingfor } = req.body;

        const refrenceId = generateUniqueId({
            length: 10,
            useLetters: false,
            includeSymbols: [''],
        });

        const existingUser = await userData.findOne({ email: email });
        if (existingUser) {
            return res.json({ message: "user already exist", success: false });
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            const Signupuser = await userData.create({
                username: username,
                contactnumber: contactnumber,
                email: email,
                password: hashedPassword,
                dob: dob,
                country: country,
                city: city,
                gender: gender,
                lookingfor: lookingfor,
                refrenceId: refrenceId,
                isOnline: "Offline"
            });
            const token = jwt.sign({ email: Signupuser.email }, SECRET_KEY);
            res.status(201).json({ message: "Register successfully", success: true, token: token });
        }
    } catch {
        res.json({ message: "something went wrong", success: false });
    }
}

const LoginRequest = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await userData.findOne({ email: email })
        if (!existingUser) {
            return res.json({ message: "user not found", success: false });
        }
        const matchPassword = await bcrypt.compare(password, existingUser.password);
        if (!matchPassword) {
            return res.json({ message: "Invalid Credential", success: false })
        };
        const token = jwt.sign({ email: existingUser }, SECRET_KEY);
        // io.emit('login', existingUser.email);
        res.json({ message: "Login successfully", success: true, token: token });

    } catch {
        res.json({ message: "something went wrong" });
    }
}

const loginWithGoogleRequest = async (req, res) => {
    const { token } = req.body; // Assuming the token is sent in the request body

    try {
        const refrenceId = generateUniqueId({
            length: 10,
            useLetters: false,
            includeSymbols: [''],
        });

        // Verify the Google token with Google's servers
        const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
        const loginCredential = response.data;
        const username = loginCredential.name;
        const email = loginCredential.email;

        const jwtPayload = { userId: loginCredential.sub, email: loginCredential.email };
        const authToken = jwt.sign(jwtPayload, SECRET_KEY);

        const existingUser = await userData.findOne({ email: email });
        if (!existingUser) {
            const data = new userData({
                username: username,
                email: email,
                refrenceId: refrenceId
            })
            await data.save()
        }
        const useremail = await userData.findOne({ email: email })

        // Send the JWT as part of the response
        res.status(200).json({ token: authToken, email: useremail.email, message: 'Authentication successful', success: true });

        //   res.status(200).json({ message: 'Authentication successful' });
    } catch (error) {
        console.error('Error verifying Google token:', error);
        res.status(400).json({ message: 'Authentication failed', success: false });
    }

}

const SearchUserRequest = async (req, res) => {
    try {
        const username = req.params.searchData.toLowerCase();
        const searchResults = await userData.find({
            $or: [
                { username: { $regex: username, $options: 'i' } }, // Case-insensitive search for username
                { email: { $regex: username, $options: 'i' } },    // Case-insensitive search for email
            ]
        });

        res.json({ success: true, message: searchResults });
    
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ success: false, message: "An error occurred" });
    }
}

const LogOutRequest = (req, res) => {
    const token = req.headers.authorization.split(' ')[1]; // Extract the token from the Authorization header

    try {
        jwt.verify(token, SECRET_KEY);

        // Implement any other logout logic you need (such as updating user status)
        res.clearCookie('token');
        // Respond with success and message
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        // Respond with failure and message
        res.json({ success: false, message: 'Logout failed' });
    }

}

const getUserProfileRequest = async (req, res) => {
    try {
        let useremail = req.params.useremail;
        await userData.find({
            "$or": [
                { "email": { $regex: useremail } }],
        },
            { password: 0, contactnumber: 0 }
        ).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const getUserProfileByEmailRequest = async (req, res) => {
    try {
        let email = req.params.email;
        await userData.find({
            "$or": [
                { "email": { $regex: email } }],
        },
            { password: 0, contactnumber: 0, email: 0, }
        ).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const UpdateProfileRequest = async (req, res) => {
    console.log(req.body.id)
    try {
        const id = req.body.id;
        if (req.files && req.files.photo) {
            const photo = req.files.photo[0].filename;
            await userData.findByIdAndUpdate(id, {
                "photo": photo,
            }).then((data) => {
                res.json({ message: "Profile photo Updated successfully", success: true, data: data });
            })
        } else {
            const id = req.body;
            const { username, contactnumber, dob, country, city, gender, lookingfor } = req.body;
            await userData.findByIdAndUpdate(id, {
                "username": username, "contactnumber": contactnumber, "dob": dob, "country": country, "city": city, "gender": gender,
                "lookingfor": lookingfor
            }).then((data) => {
                res.json({ message: "Updated successfully", success: true, data: data });
            })
        }
    } catch (error) {
        res.status(500).json({ message: "An error occurred", success: false });
    }
}
const getProfileById = async (req, res) => {
    try {
        let id = req.params.id;
        userData.findById(id, { password: 0 }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json(data)
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const ResetPasswordRequest = async (req, res) => {
    const { password, newpassword } = req.body;
    const id = req.body._id
    console.log(req.body._id);
    try {
        const user = await userData.findById(id)
        console.log(user);
        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.json({ message: 'Old password is incorrect', success: false });
        }
        const hashedPassword = await bcrypt.hash(newpassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password updated successfully', success: true, data: user });
    } catch (error) {
        s
        console.error(error);
        res.json({ message: 'An error occurred', success: false });
    }
};
const SetProfilePhotoByRef = async (req, res) => {
    console.log(req.body)

    const { refrenceId, photo } = req.body;
    try {
        const user = await userData.findOne({ refrenceId: refrenceId });
        user.photo = photo;
        await user.save();
        res.json({ message: 'profile updated successfully', success: true, data: user });
    } catch (error) {
        res.json({ message: 'An error occurred', success: false });
    }
}
const addPhotoRequest = async (req, res) => {
    const { refrenceId, description } = req.body;
    try {
        const photo = (req.files) ? req.files.photo[0].filename : null
        const sendPhoto = new userPhoto({
            refrenceId,
            description,
            photo
        })
        await sendPhoto.save().then((data) => {
            res.json({ message: "Photo Added successfully", success: true, result: data })
        })

    } catch (err) {
        res.status(500).json({ message: 'An error occurred', success: false });
    }
}
const getPhotoByRefrenceId = (req, res) => {
    try {

        let refrenceId = req.params.refrenceId;
        console.log(refrenceId)

        userPhoto.find({
            "$or": [
                { "refrenceId": { $regex: refrenceId } }
            ]
        }).then((data) => {
            if (data && data.length > 0) {

                res.json({ data: data, success: true, message: "Photos found" });
            } else {

                res.json({ data: [], success: false, message: "No photos found" });
            }
        });
    } catch {
        res.json({ message: "Something went wrong", success: false });
    }
};
const getProfilePhoto = (req, res) => {
    try {
        let id = req.params.id;
        userPhoto.findById(id).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json(data)

            }
        })
    }
    catch {
        res.json("Something went wrong");
    }
}
const photoDeleteRequest = async (req, res) => {
    let { id } = req.params;
    await userPhoto.findByIdAndDelete(id).then(() => {
        res.json({ message: "Delete succesfully", success: true });
    })
}


// <--------------------------------------------Message Request--------------------------------->

const MessageRequest = async (req, res) => {
    const { senderRefrenceId, recieverRefrenceId, message } = req.body
    console.log(req.body)

    try {
        const sender = await userData.findOne({ refrenceId: senderRefrenceId });
        const receiver = await userData.findOne({ refrenceId: recieverRefrenceId });

        if (senderRefrenceId === recieverRefrenceId) {
            return res.json({ message: "you can't send self", success: false })
        }
        if (!sender || !receiver) {
            return res.status(404).json({ error: 'One or both users not found.' });
        }
        const messageData = new userMessage({
            sender: sender,
            receiver: receiver,
            message: message
        });
        const data = await messageData.save();

        return res.status(201).json({ message: 'sent successfully', success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while processing the request.', success: false });
    }
}

const getMessageRequest = async (req, res) => {
    try {
        let refrenceId = req.params.refrenceId;

        const messages = await userMessage.find({
            "$or": [
                { "refrenceId": { $regex: refrenceId } }
            ],
        },
        ).populate('sender')
            .exec();
        res.json({ data: messages, success: true });
    }
    catch {
        res.json("Something went wrong");
    }
}

const getMessageSendByRefRequest = async (req, res) => {
    try {
        let sendbyrefrenceId = req.params.sendbyrefrenceId;
        const recieverRefrenceId = req.body.recieverRefrenceId

        await userMessage.find({
            "$and": [
                { "sendbyrefrenceId": { $regex: sendbyrefrenceId } },
                { "refrenceId": { $regex: recieverRefrenceId } }
            ],
        }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        res.json("Something went wrong");
    }

}

const getUserMessageRequest = async (req, res) => {
    try {
        const refrenceId = req.body.refrenceId;
        const sendbyrefrenceId = req.body.sendbyrefrenceId

        await userMessage.find({
            "$and": [
                { "refrenceId": { $regex: refrenceId } },
                { "sendbyrefrenceId": { $regex: sendbyrefrenceId } }
            ],
        }).then((err, data) => {
            if (err) {
                res.json(err)
            } else {
                res.json({ data: data, success: true })
            }
        })
    }
    catch {
        // res.json("Something went wrong");
    }
}

const isSeenChatNotification=async(req,res)=>{
    try {
        const query = { isSeen: false };
        const updateOperation = { $set: { isSeen: true } };
        
        const result = await userMessage.updateMany(query, updateOperation);
        res.json({success:true,message:"updated"})
    } catch (error) {
        console.error('Error updating documents:', error);
    }
}



module.exports = {
    getAllUserRequest, SignUpRequest, LoginRequest, getUserProfileRequest, UpdateProfileRequest, getProfileById, ResetPasswordRequest,
    addPhotoRequest, getPhotoByRefrenceId, getProfilePhoto, SetProfilePhotoByRef, photoDeleteRequest, MessageRequest, getUserProfileByEmailRequest, getMessageRequest,
    getMessageSendByRefRequest, getUserMessageRequest,    LogOutRequest, loginWithGoogleRequest
    , SearchUserRequest,getData,isSeenChatNotification
}


