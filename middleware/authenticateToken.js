import jwt from "jsonwebtoken";

const secret = process.env.SECRET;

export const authenticateToken = (req, res, next) => {
    console.log(secret)
    try {
        const token = req.header("authorization");
        if (!token) return res.status(403).send({error: "Access denied."});

        console.log(secret)

        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).send({error: "Invalid token"});
    }
}