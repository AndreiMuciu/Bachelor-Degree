import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const DB = process.env.MONGO_URI.replace(
  "<db_password>",
  process.env.DB_PASSWORD,
);

mongoose
  .connect(DB)
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

const PORT = process.env.PORT || "No PORT found in .env file";

if (PORT === "No PORT found in .env file") {
  console.error(PORT);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
