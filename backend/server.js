import "dotenv/config";
import express from "express";

const app = express();
const PORT = process.env.PORT || "No PORT found in .env file";

// TEST

if (PORT === "No PORT found in .env file") {
  console.error(PORT);
  process.exit(1);
}

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
