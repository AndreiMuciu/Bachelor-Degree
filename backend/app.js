import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import userRouter from "./routes/userRoutes.js";
import blogPostRouter from "./routes/blogPostRoutes.js";
import settlementRouter from "./routes/settlementRoutes.js";
import authRouter from "./routes/authRoutes.js";
import n8nRouter from "./routes/n8nRoutes.js";
import memberRouter from "./routes/memberRoutes.js";
import coordinatesRouter from "./routes/coordinatesRoutes.js";
import passport from "passport";

const app = express();
const corsOptions = {
  origin: function (origin, callback) {
    // Permite domeniul principal și toate subdomeniile
    const allowedDomain = process.env.PRODUCTION_URL.replace(
      /^https?:\/\//,
      "",
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

app.use(express.urlencoded({ extended: true }));
// Data sanitization împotriva NoSQL query injection
app.use((req, res, next) => {
  // Curățăm body-ul (principalul vector de atac)
  if (req.body) mongoSanitize.sanitize(req.body);

  // Curățăm parametrii din URL
  if (req.params) mongoSanitize.sanitize(req.params);

  // Curățăm query params, dar FĂRĂ a încerca să suprascriem req.query
  // (mongoSanitize.sanitize modifică obiectul prin referință, deci e suficient)
  if (req.query) mongoSanitize.sanitize(req.query);

  next();
});

// Data sanitization împotriva XSS (Cross-Site Scripting)
// Funcție recursivă pentru a curăța obiectele (body, query, params)
// Funcție recursivă pentru a curăța obiectele
// Lista de chei care conțin cod și nu trebuie sanitizate
const CODE_KEYS = new Set([
  "html",
  "css",
  "js",
  "bloghtml",
  "posthtml",
  "index.html",
  "script.js",
  "styles.css",
  "blog.html",
  "post.html",
  "membershtml",
]);

const cleanObject = (data, parentKey = null) => {
  if (!data) return data;

  for (const key in data) {
    const lowerKey = key.toLowerCase();

    // 1. LOGICA DE SKIP: Verificăm dacă cheia este pentru cod
    // Skip dacă:
    // - cheia este în lista de chei de cod (html, css, js, etc.)
    // - cheia se termină cu extensie de cod (.html, .js, .css)
    // - suntem în obiectul "files" (parentKey === 'files')
    if (
      CODE_KEYS.has(lowerKey) ||
      lowerKey.endsWith("html") ||
      lowerKey.endsWith("js") ||
      lowerKey.endsWith("css") ||
      parentKey === "files"
    ) {
      continue; // Treci la următoarea cheie fără să modifici nimic
    }

    // 2. Curățare standard
    if (typeof data[key] === "string") {
      data[key] = xss(data[key]);
    } else if (typeof data[key] === "object" && data[key] !== null) {
      // Recursivitate pentru obiecte imbricate, pasăm cheia curentă ca parent
      cleanObject(data[key], lowerKey);
    }
  }
};

// Middleware XSS manual (care nu crapă aplicația)
app.use((req, res, next) => {
  if (req.body) cleanObject(req.body);
  if (req.query) cleanObject(req.query);
  if (req.params) cleanObject(req.params);
  next();
});

// Aplică rate limiter strict pentru rutele de autentificare
app.use("/api/v1/auth/login", authLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blog-posts", blogPostRouter);
app.use("/api/v1/settlements", settlementRouter);
app.use("/api/v1/n8n", n8nRouter);
app.use("/api/v1/members", memberRouter);
app.use("/api/v1/coordinates", coordinatesRouter);

app.get("/health", (req, res) => {
  res.status(200).send("Server is healthy");
});

export default app;
