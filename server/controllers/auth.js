// server/controllers/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* REGISTER USER */
export const register = async (req, res) => {
    try {
        // Body fields
        const {
            firstName,
            lastName,
            email,
            password,
            // picturePath may be provided by client, but when using multer prefer req.file
            friends,
            location,
            occupation
        } = req.body;

        // If multer processed a file, use its filename (or path) as picturePath
        const picturePath = req.file ? req.file.filename : req.body.picturePath;

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: passwordHash,
            picturePath,
            friends: friends || [],
            location,
            occupation,
            viewedProfile: Math.floor(Math.random() * 1000),
            impressions: Math.floor(Math.random() * 1000)
        });

        const savedUser = await newUser.save();
        // Do not return password in response
        const userToReturn = savedUser.toObject();
        delete userToReturn.password;

        res.status(201).json(userToReturn);
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: err.message });
    }
}

/* LOGGING IN */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email });
        if (!user) return res.status(400).json({ msg: "USER DOES NOT EXIST." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "INVALID CREDENTIALS." });

        // use the user's _id
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d" // optional expiration
        });

        // sanitize user before returning
        const userToReturn = user.toObject();
        delete userToReturn.password;

        res.status(200).json({ token, user: userToReturn });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: err.message });
    }
}