const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../routes/user");

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email: email.toLowerCase(), password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "5d" });
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "strict" })
            ;
        res.status(200).json({ message: "User logged in successfully" });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { register, login };
