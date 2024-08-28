import { tokenService } from "../service/token.service.js";

export const authenticateToken = (req, res, next) => {
    try {
        const token = req.header("Authorization");

        if (!token) {
            return res.status(403).send({error: "Access denied."});
        }

        req.user = tokenService.verifyAccessToken(token)
        next();
    } catch (error) {
        res.status(401).send({error: error.message});
    }
}