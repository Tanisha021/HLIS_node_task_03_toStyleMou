const User = require('../controller/user');  

const customerRoute = (app) => {
    app.post("/v1/user/signup", User.signup); 
    app.post("/v1/user/login", User.login);
    app.post("/v1/user/generate-otp", User.verifyOTP);
    app.post("/v1/user/verify-otp", User.validateOTP);
    app.get("/v1/user/check-verification", User.checkUserVerification);
    app.post("/v1/user/update-profile", User.updateUserProfile);
    app.post("/v1/user/forgot-password", User.forgotPassword);
    app.post("/v1/user/reset-password", User.resetPassword);
    app.post("/v1/user/change-password", User.changePassword);

    app.get("/v1/user/display-trending-post", User.displayTrendingPost);
    app.get("/v1/user/filtered/new", User.filterNew);
    app.get("/v1/user/filtered/following", User.filterFollowing);
    app.get("/v1/user/filtered/new/tostylecompare", User.filterNewToStyleCompare);
    app.get("/v1/user/filter/expire/tostylecompare", User.filterExpiringToStyleCompare);
    app.get("/v1/user/category/:category_name", User.CategoryWiseDisplay);
    app.get("/v1/user/postranking/:post_id", User.postRankings);
    app.get("/v1/user/postDetails/:post_id", User.postDetails);
    app.get("/v1/user/savedpost", User.savedPost);
    app.get("/v1/user/:user_id", User.profileOfUser);
    app.get("/v1/user/other-profile", User.otherProfile);

    app.post("/v1/user/create-post", User.create_post);
    
};

module.exports = customerRoute;
