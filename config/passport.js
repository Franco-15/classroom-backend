const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const prisma = require('../utils/prisma');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { githubId: profile.id }
            });

            if (existingUser) {
                return done(null, existingUser);
            }

            const user = await prisma.user.create({
                data: {
                    githubId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: profile.photos[0].value,
                    role: 'STUDENT'
                }
            });

            await prisma.account.create({
                data: {
                    userId: user.id,
                    type: 'oauth',
                    provider: 'github',
                    providerAccountId: profile.id,
                    access_token: accessToken,
                    refresh_token: refreshToken
                }
            });

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
