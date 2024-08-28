import { nanoid } from "nanoid";

export function getDeviceInfo(req) {
    const userAgent = req.headers["user-agent"] || "";
    const deviceId = req.cookies.deviceId || nanoid(); // Используем идентификатор из cookies или генерируем новый
    return `${deviceId}`;
}