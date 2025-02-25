// const { response } = require("express");
const responseCode = require("../../../../utilities/response-error-code");
const constant = require("../../../../config/constant");
const common = require("../../../../utilities/common");
const userModel = require("../models/user-model");

class User {
    constructor() { }
    signup(req, res) {
        // console.log("signup");
        var request_data = req.body;

        userModel.signup(request_data, (_responseData) => {
            common.response(res, _responseData)
        });
    }
    login(req, res) {
        var request_data = req.body;

        userModel.login(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    // generate OTP Function
    verifyOTP(req, res) {
        var request_data = req.body;
        userModel.verifyOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    validateOTP(req, res) {
        var request_data = req.body;
        userModel.validateOTP(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    // checkVerification status
    checkUserVerification(req, res) {
        var request_data = req.body;
        userModel.checkUserVerification(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    // update user profile
    updateUserProfile(req, res) {
        const request_data = req.body;

        if (!request_data.user_id) {
            return common.response(res, {
                code: common.response_code.OPERATION_FAILED,
                message: "User ID is required"
            });
        }

        userModel.updateUserProfile(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    forgotPassword(req, res) {
        var request_data = req.body;

        userModel.forgotPassword(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    resetPassword(req, res) {
        var request_data = req.body;

        userModel.resetPassword(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    changePassword(req, res) {
        var request_data = req.body;

        userModel.changePassword(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    displayTrendingPost(req, res) {
        var request_data = req.body;

        userModel.displayTrendingPost(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    filterNew(req, res) {
        var request_data = req.body;

        userModel.filterNew(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    filterFollowing(req, res) {
        var request_data = req.body;

        userModel.filterNew(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    filterNewToStyleCompare(req, res) {
        var request_data = req.body;

        userModel.filterNewToStyleCompare(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    
    filterExpiringToStyleCompare(req, res) {
        var request_data = req.body;

        userModel.filterExpiringToStyleCompare(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    CategoryWiseDisplay(req, res) {
        var request_data = req.params;

        userModel.CategoryWiseDisplay(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    postRankings(req, res) {
        var request_data = req.params;

        userModel.postRankings(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    postDetails(req, res) {
        var request_data = req.params;

        userModel.postDetails(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    savedPost(req, res) {
        var request_data = req.params;

        userModel.savedPost(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }
    async filter(req,res){
        var request_data = req.body;
        userModel.filter(request_data, (_response_data)=>{
            common.response(res, _response_data);
        });
    }
    profileOfUser(req, res) {
        var request_data = req.params;

        userModel.profileOfUser(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    create_post(req,res){
        const request_data = req.body;
        if (!request_data.descriptions || !request_data.category_name) {
            return common.response(res, {
                code: responseCode.OPERATION_FAILED,
                message: "Missing required fields"
           });
        }
        userModel.create_post(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
        });
    }
    follow_user(req,res){
        const request_data = req.body;
        
        userModel.follow_user(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
        });
    }
    save_post(req,res){
        const request_data = req.body;
        
        userModel.save_post(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
        });
    }
    add_comment(req,res){
        const request_data = req.body;
        
        userModel.add_comment(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
        });
    }
    edit_profile(req,res){
        const request_data = req.body;
        
        userModel.edit_profile(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
        });
    }
    delete_posts(req,res){
        const request_data = req.body;
        
        userModel.delete_posts(request_data, (response_data) => {
            common.response(res, response_data);
        });
    }
    otherProfile(req, res) {
        var request_data = req.body;

        userModel.otherProfile(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

};
module.exports = new User();