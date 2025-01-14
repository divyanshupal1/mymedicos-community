import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import requestIp from "request-ip";
import { fileURLToPath } from "url";
import { ApiError } from "./utils/ApiError.js";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config({
    path: "./.env",
    
})




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var whitelist = [
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:3000",
    "https://www.mymedicos.in",
    "https://mymedicos.in",
]

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    pingTimeout: 60000,
    cors: {
        origin: (origin, callback) => {
            if (!origin || whitelist.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    },
});

app.set("io", io);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());




app.use(
    cors({
        origin: function (origin, callback) {
            console.log("Request Origin: " + origin)
            if (whitelist.indexOf(origin) !== -1 || !origin) {
                console.log("Allowed by cors: " + origin)
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS' + origin))
            }
        },
        credentials: true,
    })
);

app.options('*', cors())

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (whitelist.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    };
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

app.use(requestIp.mw());

app.use((req, res, next) => {
    console.log("Request IP: ", req.clientIp);
    console.log("Request URL: ", req.originalUrl);
    next();
});

// Rate limiter to avoid misuse of the service and avoid cost spikes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req, res) => {
        return req.clientIp; // IP address from requestIp.mw(), as opposed to req.ip
    },
    handler: (_, __, ___, options) => {
        throw new ApiError(
            options.statusCode || 500,
            `There are too many requests. You are only allowed ${options.max
            } requests per ${options.windowMs / 60000} minutes`
        );
    },
});

app.use(limiter);


import userRouter from "./routes/user.routes.js";
import questionRouter from "./routes/questions.route.js";
import postRouter from "./routes/posts.route.js";
import commentRouter from "./routes/comments.route.js";

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);
app.use("/api/v1/posts",postRouter)
app.use("/api/v1/comments",commentRouter)


app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET ,
        resave: true,
        saveUninitialized: true,
    })
);


import { errorHandler } from "./middlewares/error.middlewares.js";

app.use(errorHandler);

export { httpServer };
