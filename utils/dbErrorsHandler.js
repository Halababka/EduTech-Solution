import { Prisma } from "../db.js";

const dbErrorsHandler = (e) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        switch (e.code) {
            case "P2002":
                return "Невозможно создать запись с такими данными";
            case "P1001":
                return "Нет подключения с БД";
            case "P2025":
                return "Одна или несколько записей, которые были необходимы не найдены";
            default:
                return "Необрабатываемая ошибка";
        }
    } else return "Неизвестная ошибка"
}
export default dbErrorsHandler;