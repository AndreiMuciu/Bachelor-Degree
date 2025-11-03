import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import blogPostRouter from "./routes/blogPostRoutes.js";
import settlementRouter from "./routes/settlementRoutes.js";
import authRouter from "./routes/authRoutes.js";
import n8nRouter from "./routes/n8nRoutes.js";
import passport from "passport";

const app = express();

app.use(
  cors({
    origin:
      process.env.PRODUCTION == "false"
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL,
    credentials: true,
  })
);
app.use(cookieParser());

app.use(passport.initialize());

app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blog-posts", blogPostRouter);
app.use("/api/v1/settlements", settlementRouter);
app.use("/api/v1/n8n", n8nRouter);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

export default app;
