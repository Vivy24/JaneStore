const passport= require('passport');
const LocalStrategy=require('passport-local').Strategy;
const Admin= require("./model/Admin");
const Security=require('./security');

passport.use(new LocalStrategy(
    function(username, password, done) {
    const upperusername=username.trim().toUpperCase();
    Admin.findOne({ username: upperusername }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, {message:'Incorrect username'});
        }
        const isValid=Security.validPassword(user.hash,user.salt,password);
        if (!isValid) {
          return done(null, false, {message:'Incorrect password'});
        }
        return done(null, user);
      });
    }
  ));

passport.serializeUser((user,done)=>{
  done(null,user.id);
})

passport.deserializeUser((userId,done)=>{
  Admin.findById(userId)
  .then((user)=>{
    done(null,user);
  })
  .catch(err=>done(err));
})