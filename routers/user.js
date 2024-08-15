const express = require("express");
const router = express.Router(); // Create a new router instance
const UserController = require("../controller/user.js");
const { authenticateToken } = require("../middleware/userAuth.js");

// Route handlers
router.post("/sign-up", UserController.SignUp); 
router.post("/log-in", UserController.LogIn); 

router.get("/user-info", authenticateToken, UserController.GetUserInfo);

router.put("/set-profile", authenticateToken, UserController.ProfileDpSet); 

router.get("/search-player", authenticateToken, UserController.SearchPlayer);


router.put("/add-friend", authenticateToken, UserController.AddFriend)

router.post("/friends-info",authenticateToken, UserController.FriendsInfo); 

router.post("/game-result",  UserController.GameEndInfoStore);


router.get("/leaderboard", UserController.Leaderboard);

router.get('/user-info/:id',authenticateToken,UserController.FriendsProfile);

router.post('/forgot-password',UserController.ResetLikeSend);

router.post('/reset-password/:token',UserController.ResetPassword);


module.exports = router;
