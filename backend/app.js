import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import blogPostRouter from "./routes/blogPostRoutes.js";
import settlementRouter from "./routes/settlementRoutes.js";

const app = express();

app.use(
  cors({
    origin:
      process.env.PRODUCTION === false
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL,
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogposts", blogPostRouter);
app.use("/api/v1/settlements", settlementRouter);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

export default app;
