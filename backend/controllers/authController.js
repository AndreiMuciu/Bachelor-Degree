import * as msal from "@azure/msal-node";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const entraConfig = {
  auth: {
    clientId: process.env.ENTRA_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.ENTRA_TENANT_ID}`,
    clientSecret: process.env.ENTRA_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback(loglevel, message, containsPii) {
        console.log(message);
      },
      piiLoggingEnabled: false,
      logLevel: msal.LogLevel.Verbose,
    },
  },
};

const msalInstance = new msal.ConfidentialClientApplication(entraConfig);

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password!",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const signup = async (req, res) => {
  try {
    const newUser = await User.create({
      email: req.body.email,
      password: req.body.password,
    });

    createSendToken(newUser, 201, req, res);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

export const entraLogin = async (req, res) => {
  try {
    const redirectUri =
      process.env.PRODUCTION === "false"
        ? "http://localhost:5000/api/v1/auth/entra/redirect"
        : `${process.env.PRODUCTION_URL}/api/v1/auth/entra/redirect`;

    const authCodeUrlParameters = {
      scopes: ["user.read"],
      redirectUri,
    };

    const authUrl = await msalInstance.getAuthCodeUrl(authCodeUrlParameters);
    res.redirect(authUrl);
  } catch (err) {
    console.error("Entra login error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to initiate Entra login",
    });
  }
};

export const entraRedirect = async (req, res) => {
  try {
    const redirectUri =
      process.env.PRODUCTION === "false"
        ? "http://localhost:5000/api/v1/auth/entra/redirect"
        : `${process.env.PRODUCTION_URL}/api/v1/auth/entra/redirect`;

    const tokenRequest = {
      code: req.query.code,
      scopes: ["user.read"],
      redirectUri,
    };

    const response = await msalInstance.acquireTokenByCode(tokenRequest);

    const userEmail = response.account.username;
    const entraId = response.account.homeAccountId;

    // ⚠️ VERIFICARE CRITICĂ: userul TREBUIE să existe în DB
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const frontendUrl =
        process.env.PRODUCTION === "false"
          ? "http://localhost:5173"
          : process.env.PRODUCTION_URL;

      return res.redirect(
        `${frontendUrl}?error=user_not_found&message=No account found. Contact admin.`
      );
    }

    // Update Entra ID info dacă nu există
    if (!user.entraId) {
      user.entraId = entraId;
      user.authProvider = "entra";
      await user.save({ validateBeforeSave: false });
    }

    // Creează JWT
    const token = signToken(user._id);

    const cookieOptions = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.PRODUCTION !== "false",
      sameSite: "lax",
    };

    res.cookie("jwt", token, cookieOptions);

    const frontendUrl =
      process.env.PRODUCTION === "false"
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL;

    res.redirect(`${frontendUrl}?login=success`);
  } catch (err) {
    console.error("Entra redirect error:", err);

    const frontendUrl =
      process.env.PRODUCTION === "false"
        ? "http://localhost:5173"
        : process.env.PRODUCTION_URL;

    res.redirect(`${frontendUrl}?error=auth_failed`);
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;

    // Caută token în header sau cookie
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in!",
      });
    }

    // Verifică token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Verifică dacă userul mai există
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "User no longer exists.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      status: "fail",
      message: "Invalid token.",
    });
  }
};

// 7) RESTRICT TO - Restricționează pe baza rolului
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission",
      });
    }
    next();
  };
};
