const express = require('express');
const { adminSignUp, adminLoginRequest } = require('../Controller/AdminLogin')
const { getAllUserRequest, SignUpRequest, LoginRequest, getUserProfileRequest, UpdateProfileRequest, getProfileById, ResetPasswordRequest,getData,
    addPhotoRequest, getPhotoByRefrenceId, getProfilePhoto, SetProfilePhotoByRef, photoDeleteRequest, MessageRequest, getUserProfileByEmailRequest, getMessageSendByRefRequest, getUserMessageRequest,
    getMessageRequest, FriendRequest, FriendRequestSenderStatus, getFriendRequestByRef, acceptFriendRequest, deleteFriendRequest, likeProfileRequest, likeProfleSenderStatus, unLikeProfileRequest
    ,FriendRequestRecieverStatus, getFriendRequestByBoth,getFriends,unFriendRequest,LogOutRequest,loginWithGoogleRequest,likeProfleStatusForSender,SearchUserRequest,
    likeProfileStatusReciever,seenLikeProfileUpdate } = require('../Controller/UserLogin');
const photoUpload = require('../Files/AddPhotoFile');
const profileUpload = require('../Files/UserProfile');

const router = express.Router();
router.get('/',getData)
router.get('/api/getalluser', getAllUserRequest)
router.post('/api/signup', SignUpRequest)
router.post('/api/login', LoginRequest)
router.get('/api/getuserdata/:useremail', getUserProfileRequest)
router.get('/api/getuserdatabyemail/:email', getUserProfileByEmailRequest)
router.get('/api/getprofilebyid/:id', getProfileById)
router.put('/api/updateprofile', profileUpload, UpdateProfileRequest);
router.put('/api/setprofilePhoto', SetProfilePhotoByRef);
router.put('/api/resetpassword', ResetPasswordRequest);
router.post('/api/addphoto', photoUpload, addPhotoRequest);
router.get('/api/getphotorefrenceid/:refrenceId', getPhotoByRefrenceId);
router.get('/api/getprofilePhotobyid/:id', getProfilePhoto);
router.delete('/api/deletephoto/:id', photoDeleteRequest);
router.post('/api/logout',LogOutRequest)
router.post('/google-auth',loginWithGoogleRequest);
router.get('/api/searchuser/:searchData',SearchUserRequest)

// <--------------------------Message Send Api ---------------------------------->

router.post('/api/messagesend', MessageRequest);
router.get('/api/getmessage/:refrenceId', getMessageRequest);
router.post('/api/getmessagesendbyref/:sendbyrefrenceId', getMessageSendByRefRequest);
router.post('/api/getmessagesendbyuser', getUserMessageRequest);


// <------------------------------Friend Request Api ------------------------------------->
router.post('/api/frinedrequest', FriendRequest);
router.post('/api/friendrequestsenderstatus/:senderId/:receiverId', FriendRequestSenderStatus);
router.post('/api/friendrequestrecieverstatus/:senderRefrenceId/:recieverRefrenceId', FriendRequestRecieverStatus);
router.get('/api/getfriendrequest/:recieverRefrenceId', getFriendRequestByRef);
router.get('/api/getfriendrequestbyboth/:senderRefrenceId/:recieverRefrenceId', getFriendRequestByBoth);
router.get('/api/getfriends/:recieverRefrenceId',getFriends);
router.delete('/api/unfriend/:id',unFriendRequest);
router.post('/api/acceptfriendrequest/:senderId', acceptFriendRequest);
router.delete('/api/deletefriendrequest/:senderId', deleteFriendRequest);

//   ---------------------------------------Like Profile ------------------------------------->
router.post('/api/likeprofle', likeProfileRequest);
router.post('/api/unlikelikeprofle', unLikeProfileRequest);
router.post('/api/likeprofilesenderstatus/:senderId/:receiverId', likeProfleSenderStatus);
router.post('/api/likeprofilestatusbysender/:senderId', likeProfleStatusForSender);
router.get('/api/recievergetlikestatus/:recieverRefrenceId',likeProfileStatusReciever);
router.put('/api/seenlikeprofileupdate/:id',seenLikeProfileUpdate)

// <-----------------------------------------Addmin Pannel Api ---------------------------------------->

router.post('/api/adminsignup', adminSignUp);
router.post('/api/adminlogin', adminLoginRequest)




module.exports = router;