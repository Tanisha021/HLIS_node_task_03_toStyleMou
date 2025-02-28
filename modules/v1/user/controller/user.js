// const { response } = require("express");
const response_code = require("../../../../utilities/response-error-code");
const constant = require("../../../../config/constant");
const common = require("../../../../utilities/common");
const userModel = require("../models/user-model");
const Validator = require('Validator')
const {default: localizify} = require('localizify');
const validationRules  = require('../../../validation_rules');
const middleware = require("../../../../middleware/validators");
const { t } = require("localizify");


class User {
    signup(req, res) {
        // console.log("signup");
        var request_data = req.body;
        // const userLang = req.headers["accept-language"] || "en";
        // localizify.setLocale(userLang);

        const rules = validationRules.signup;
        // let message = req.language.required;
        let message = {
            required: req.language.required,
            email: t('email'),
            'mobile_number.min': t('mobile_number_min'),
            'mobile_number.regex': t('mobile_number_numeric'),
            'passwords.min': t('passwords_min')
        };
    
        let keywords = {
            'password': t('rest_keywords_password'),
            'email_id': t('email')
        };

        const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
    
        if (valid) {
            userModel.signup(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // userModel.signup(request_data, (_responseData) => {
        //     common.response(res, _responseData)
        // });
    }
    login(req, res) {
        var request_data = req.body;

        const rules = validationRules.login; 

        let message={
            required: req.language.required,
            email: t('email'),
            'passwords.min': t('passwords_min')
        }

        let keywords={
            'email_id': t('rest_keywords_email_id'),
            'passwords':t('rest_keywords_password')
        }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        if(valid){
            userModel.login(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }
        // if(middleware.checkValidation(req,res,request,rule,message,keywords)){
        //     userModel.login(request_data, (_responseData) => {
        //         middleware.send_responseresponse(res, _responseData);
        //     });
        // }
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
    compeleteUserProfile(req, res) {
        try{        
            const request_data = req.body;
            const rules = validationRules.compeleteUserProfile; 

        let message={
            required: req.language.required
        }

        let keywords={
            'user_full_name': t('rest_keywords_user_full_name'),
            'date_of_birth': t('rest_keywords_user_date_of_birth')
        }
        const valid = middleware.checkValidationRules(req,res,request_data,rules,message, keywords)
        if(valid){
            userModel.compeleteUserProfile(request_data, (_responseData) => {
                common.response(res, _responseData);
            });
        }

        }catch(error){
            console.error("Error in complete_profile:", error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }

        // if (!request_data.user_id) {
        //     return common.response(res, {
        //         code: common.response_code.OPERATION_FAILED,
        //         message: "User ID is required"
        //     });
        // }

        // userModel.updateUserProfile(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
    }

    forgotPassword(req, res) {
        try{
            var request_data = req.body;

            const rules = validationRules.forgotPassword;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
                email: t('email'),
            };
        
            let keywords = {
                'email_id': t('rest_keywords_email_id')
            };
    
            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
        
            if (valid) {
                userModel.forgotPassword(request_data, (_responseData) => {
                    common.response(res, _responseData);
                });
            }
            // userModel.forgotPassword(request_data, (_responseData) => {
            //     common.response(res, _responseData);
            // });
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }
       
    }
    resetPassword(req, res) {
        try{
            var request_data = req.body;
             const rules = validationRules.resetPassword;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
                email: t('email'),
                'passwords.min': t('passwords_min')
            };
        
            let keywords = {
                'email_id': t('rest_keywords_email_id')
            };
    
            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
        
            if (valid) {
                userModel.resetPassword(request_data, (_responseData) => {
                    common.response(res, _responseData);
                });
            }
        }catch(error){
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong')
            });
        }
      

        // userModel.resetPassword(request_data, (_responseData) => {
        //     common.response(res, _responseData);
        // });
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
    // filterNew(req, res) {
    //     var request_data = req.body;

    //     userModel.filterNew(request_data, (_responseData) => {
    //         common.response(res, _responseData);
    //     });
    // }
    // filterFollowing(req, res) {
    //     var request_data = req.body;

    //     userModel.filterNew(request_data, (_responseData) => {
    //         common.response(res, _responseData);
    //     });
    // }

    // filterNewToStyleCompare(req, res) {
    //     var request_data = req.body;

    //     userModel.filterNewToStyleCompare(request_data, (_responseData) => {
    //         common.response(res, _responseData);
    //     });
    // }
    
    // filterExpiringToStyleCompare(req, res) {
    //     var request_data = req.body;

    //     userModel.filterExpiringToStyleCompare(request_data, (_responseData) => {
    //         common.response(res, _responseData);
    //     });
    // }

    CategoryWiseDisplay(req, res) {
        var request_data = req.params;

        userModel.CategoryWiseDisplay(request_data, (_responseData) => {
            common.response(res, _responseData);
        });
    }

    // postRankings(req, res) {
    //     var request_data = req.params;

    //     userModel.postRankings(request_data, (_responseData) => {
    //         common.response(res, _responseData);
    //     });
    // }
    postRankings(req,res){
        const request_data = req.body;
        if (!request_data.post_id ) {
            return common.response(res, {
                code: responseCode.OPERATION_FAILED,
                message: "Missing required fields"
           });
        }
        userModel.postRankings(request_data, request_data.user_id, (response_data) => {
            common.response(res, response_data);
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
    filter(req,res){
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
        try{

            var request_data = req.body;

            const rules = validationRules.create_post;
            // let message = req.language.required;
            let message = {
                required: req.language.required,
            };
        
            let keywords = {
                'descriptions': t('rest_keywords_descriptions'),
                'expire_timer': t('rest_keywords_expire_timer'),
                'post_type': t('rest_keywords_post_type'),
                'category_id': t('rest_keywords_category_id'),
                'user_id': t('rest_keywords_user_id'),

            };
    
            const valid = middleware.checkValidationRules(req, res, request_data, rules, message, keywords);
        
            if (valid) {
                userModel.create_post(request_data, request_data.user_id,(_responseData) => {
                    common.response(res, _responseData);
                });
            }

                // const request_data = req.body;
            // if (!request_data.descriptions || !request_data.category_name) {
            //     return common.response(res, {
            //         code: response_code.OPERATION_FAILED,
            //         message: "Missing required fields"
            // });
            // }
            // userModel.create_post(request_data, request_data.user_id, (response_data) => {
            //     common.response(res, response_data);
            // });
        }catch(error){
            console.error(error);
            return common.response(res, {
                code: response_code.OPERATION_FAILED,
                message: t('rest_keywords_something_went_wrong') + (error.sqlMessage || error.message)
            });
        }
        
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
    rate_post(req,res){
        const request_data = req.body;
        
        userModel.rate_post(request_data, request_data.user_id, (response_data) => {
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