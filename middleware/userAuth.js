const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication token required" });
    }
 
    const token = authHeader.split(" ")[1];
    console.log("Token:", token); // Debugging statement

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Error:", err); // Debugging statement
            return res.status(403).json({ message: "Invalid or expired token, Please Login again" });
        }

        req.user = user;
        next();
    });
};


module.exports = { authenticateToken };
