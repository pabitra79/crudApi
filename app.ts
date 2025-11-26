import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import { connectionDb } from "./app/config/database";
connectionDb();
import { errorMiddleware } from './app/middleware/errorMiddleware';
app.use(errorMiddleware);

if (process.env.NODE_ENV !== 'test') {
    connectionDb().catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });
}

const swaggerFilePath = path.join(__dirname, "swagger.json");
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, "utf-8"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// for swagger
import {AuthRouter} from "./app/routes/swagger/auth.router"
app.use("/api/auth", AuthRouter);
import { TaskRouter } from "./app/routes/swagger/task.router";
app.use("/api/tasks", TaskRouter);

// for postman
import { Authrouter } from "./app/routes/auth.router";
app.use("/api/auth",Authrouter);
import { Taskrouter } from "./app/routes/task.router";
app.use("/api/tasks",Taskrouter);


app.listen(5001,()=>{
    console.log("Server port is 5001")
})
export default app;