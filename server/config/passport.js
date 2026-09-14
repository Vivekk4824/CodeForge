import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              if (user.authProvider === 'local') {
                user.authProvider = 'google';
              }
              await user.save();
              return done(null, user);
            }
          }

          user = await User.create({
            name: profile.displayName || 'Google User',
            email: email || `${profile.id}@google.com`, 
            googleId: profile.id,
            authProvider: 'google',
            passwordHash: undefined 
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            return done(null, user);
          }

          const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.githubId = profile.id;
              if (user.authProvider === 'local') {
                user.authProvider = 'github';
              }
              await user.save();
              return done(null, user);
            }
          }

          user = await User.create({
            name: profile.displayName || profile.username || 'GitHub User',
            email: email || `${profile.id}@github.com`,
            githubId: profile.id,
            authProvider: 'github',
            passwordHash: undefined
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

export default passport;
