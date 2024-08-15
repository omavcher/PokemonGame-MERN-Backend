const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');


module.exports.SignUp = async (req, res) => {
    try {
        const { name, email, password, gender } = req.body;

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email }); // Use findOne instead of find
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Check Password length
        if (password.length <= 5) {
            return res.status(400).json({ message: "Password is too short" });
        }

         const hashPass = await bcrypt.hash(password,10);
        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashPass, 
            gender
        });

        await newUser.save();

        res.status(200).json({ message: "User created successfully", user: newUser });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports.LogIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Debugging: Print stored hashed password
    console.log('Stored hashed password:', existingUser.password);

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, existingUser.password);

    // Debugging: Print password match result
    console.log('Password match result:', isMatch);

    if (isMatch) {
      // Create JWT token
      const authClaims = {
        name: existingUser.name,
        email: existingUser.email
      };

      const token = jwt.sign(authClaims, process.env.JWT_SECRET, { expiresIn: "30d" });

      return res.status(200).json({ id: existingUser._id, token });
    } else {
      return res.status(400).json({ message: "Invalid credentials" });
    }

  } catch (err) {
    console.error("Login Error:", err); // Log the error for debugging
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports.GetUserInfo = async (req, res) => {
    try {
        const { id } = req.headers; // Extracting id from headers
        const data = await User.findById(id).select('-password')

        if (!data) {
            return res.status(404).json({ message: "User not found" }); // Handling case where user is not found
        }

        return res.status(200).json(data); // Returning the fetched user data
    } catch (err) {
        res.status(500).json({ message: "Internal server error" }); // Handling any errors
    }
};

module.exports.ProfileDpSet = async (req, res) => {
    try {
      const { id } = req.headers; // ID should be sent in headers
      const { profilePicture } = req.body; // Profile picture URL should be in body
  
      if (!id || !profilePicture) {
        return res.status(400).json({ message: 'Invalid data provided' });
      }
  
      // Find user by ID and update the dp field
      const result = await User.findByIdAndUpdate(id, { dp: profilePicture }, { new: true });
  
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({ message: 'Profile picture updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  module.exports.SearchPlayer = async (req, res) => {
    const playerId = req.query.id;
  try {
    const player = await User.findOne({ _id: playerId });
    
    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ message: 'Player not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
  };
  

  module.exports.AddFriend = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.headers.id; // Assuming user ID is sent in headers
  
    try {
      // Find the user and the friend by their IDs
      const user = await User.findById(userId);
      const friend = await User.findById(friendId);
  
      if (!user || !friend) {
        return res.status(404).json({ message: 'User or friend not found' });
      }
  
      // Check if the friend is already in the user's friends list
      if (user.friends.includes(friendId)) {
        return res.status(400).json({ message: 'Already friends' });
      }
  
      // Add the friend to the user's friends list
      user.friends.push(friendId);
      await user.save();
  
      // Optionally, add the user to the friend's friends list as well
      if (!friend.friends.includes(userId)) {
        friend.friends.push(userId);
        await friend.save();
      }
  
      res.status(200).json({ message: 'Friend added successfully' });
    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };


  module.exports.FriendsInfo = async (req, res) => {
    try {
      const { ids } = req.body;
  
      // Fetch users with the given IDs
      const friends = await User.find({ '_id': { $in: ids } });
  
      if (!friends) {
        return res.status(404).json({ message: 'Friends not found' });
      }
  
      res.json(friends);
    } catch (error) {
      console.error('Error fetching friends info:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }



  module.exports.GameEndInfoStore = async (req, res) => {
    try {
        const { userId, playerPoints, computerPoints, opponentName } = req.body;
    
        // Find the user by their ID
        const user = await User.findById(userId);
    
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
    
        // Determine if it's a win or loss
        const result = playerPoints > computerPoints ? 'win' : 'loss';
        const points = playerPoints; // Store playerPoints
    
        if (result === 'win') {
            user.wins.push({ points, opponent: opponentName });
            
            // Calculate the user's level based on the number of wins
            const numberOfWins = user.wins.length;
            let newLevel = calculateLevel(numberOfWins);
            
            user.level = newLevel; // Update the user's level
        } else if (result === 'loss') {
            user.losses.push({ points, opponent: opponentName });
        } else {
            return res.status(400).json({ message: "Invalid result type" });
        }
    
        // Save the updated user document
        await user.save();
    
        return res.status(200).json({ message: "Game result stored successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Function to calculate the level based on the number of wins
function calculateLevel(numberOfWins) {
    if (numberOfWins < 1) return 1; // Ensure level 1 for 0 or less wins
    
    // Calculate level based on the square root of wins
    let level = Math.floor(Math.sqrt(numberOfWins)) + 1;
    
    return level;
}

  


  module.exports.Leaderboard = async (req, res) => {
    try {
        const users = await User.find({}, 'name level _id') // Fetch name, score, and player ID
            .sort({ score: -1 }) 
            .limit(10); // Limit to top 10 users
        
        // Respond with the fetched users
        res.json(users);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).send('Server error');
    }
};
module.exports.FriendsProfile = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};





const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});


module.exports.ResetLikeSend = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user found with this email address.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    const resetLink = `${process.env.FRONTEND}/reset-password/${resetToken}`;

    const mailOptions = {
      to: email,
      from: 'no-reply@pokemon.com',
      subject: 'Password Reset Request',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 10px 0;
          }
          .header img {
            max-width: 150px;
          }
          .content {
            padding: 20px;
            text-align: center;
          }
          .content h1 {
            color: #333;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #FB4B04;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 16px;
          }
          .button:hover {
            background-color: #d84303;
          }
          .footer {
            text-align: center;
            padding: 10px;
            font-size: 12px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>Password Reset Request</h1>
            <p>Hi there,</p>
            <p>You recently requested to reset your password. Click the button below to create a new password.</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>If you didn't request this change, please ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Your App. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link has been sent to your email address.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request.' });
  }
};



module.exports.ResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Debugging: Print the token and current time
    console.log('Reset Token:', token);
    console.log('Current Time:', Date.now());

    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password is required and must be at least 6 characters long.' });
    }

    // Find user with valid reset token and not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    // user.resetPasswordToken = undefined;
    // user.resetPasswordExpires = undefined;

    // Save the updated user
    await user.save();
    
    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'An error occurred while resetting your password.' });
  }
};