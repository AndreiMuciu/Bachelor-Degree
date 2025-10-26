import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin:
      process.env.PRODUCTION == false
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL,
    credentials: true,
  })
);
app.use(cookieParser());

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

export default app;
