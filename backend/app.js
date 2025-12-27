import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import userRouter from "./routes/userRoutes.js";
import blogPostRouter from "./routes/blogPostRoutes.js";
import settlementRouter from "./routes/settlementRoutes.js";
import authRouter from "./routes/authRoutes.js";
import n8nRouter from "./routes/n8nRoutes.js";
import passport from "passport";

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    // Permite domeniul principal și toate subdomeniile
    const allowedDomain = process.env.PRODUCTION_URL.replace(
      /^https?:\/\//,
      ""
    );

    if (
      !origin ||
      origin.endsWith(`.${allowedDomain}`) ||
      origin === `https://${allowedDomain}` ||
      origin === `http://${allowedDomain}` ||
      origin === "http://localhost:5173"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

/*app.use(
  cors({
    origin: [
      process.env.PRODUCTION == "false"
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL,
      "https://timisoara-timis.bachelordegree.tech",
    ],
    credentials: true,
  })
);*/

// Security HTTP headers
app.use(helmet());

// Rate limiting pentru toate rutele
const limiter = rateLimit({
  max: 100, // 100 requests
  windowMs: 5 * 60 * 1000, // în 5 minute
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Rate limiting specific pentru autentificare (mai strict)
const authLimiter = rateLimit({
  max: 5, // 5 încercări
  windowMs: 5 * 60 * 1000, // în 5 minute
  message: "Too many login attempts. Please try again in 5 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cookieParser());

app.use(passport.initialize());

app.use(express.json());

// Data sanitization împotriva NoSQL query injection
app.use(mongoSanitize());

// Data sanitization împotriva XSS (Cross-Site Scripting)
app.use(xss());

// Aplică rate limiter strict pentru rutele de autentificare
app.use("/api/v1/auth/login", authLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blog-posts", blogPostRouter);
app.use("/api/v1/settlements", settlementRouter);
app.use("/api/v1/n8n", n8nRouter);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

export default app;
