import jwt from "jsonwebtoken";

const secret = process.env.SECRET;

export const authenticateToken = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        if (!token) return res.status(403).send({error: "Access denied."});
        req.user = jwt.verify(token, secret);
        next();
    } catch (error) {
        res.status(400).send({error: "Invalid token"});
    }
}