import dotenv from "dotenv";
import { httpServer } from "./app.js";
import connectDB from "./db/index.js";
import 'module-alias/register.js';
import './db/firebase.js';

dotenv.config({
    path: "./.env",
});

const startServer = () => {
    httpServer.listen(process.env.PORT || 8080, () => {
        console.info(
            `🖥️  Server started at: http://localhost:${process.env.PORT || 8080
            }`
        );
    });
};

try {
    await connectDB();
    startServer();
} catch (err) {
    console.log("Mysql connection error: ", err);
}
