import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../model/User.js";

const cookieExtractor = (req) => {
  if (!req || !req.cookies) {
    return null;
  }
  return req.cookies.token || null;
};

const userRule = (passport) => {
  const SECRET = process.env.SECRET;
  if (!SECRET) {
    throw new Error("Missing process.env.SECRET");
  }

  const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      cookieExtractor,
    ]),
    secretOrKey: SECRET,
  };

  passport.use(
    "user-rule",
    new JwtStrategy(opts, async (payload, done) => {
      try {
        console.log("JWT payload:", payload);
        const user = await User.findById(payload.id).select(
          "_id name userName role"
        );
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};

export default userRule;
