const common = require("../../../../utilities/common");
const database = require("../../../../config/database");
const response_code = require("../../../../utilities/response-error-code");
const md5 = require("md5");

class UserModel {
    
    async signup(request_data, callback) {
            // Insert new user if no existing record found
            try {
                if (!request_data.email_id || !request_data.user_name || !request_data.mobile_number || !request_data.passwords) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "Missing required fields"
                    });
                }
                     // Prepare user data object
                    const userData = {
                        user_name: request_data.user_name,
                        email_id: request_data.email_id || null,
                        mobile_number: request_data.mobile_number || null,
                        passwords: request_data.passwords ? md5(request_data.passwords) : null,
                        steps_: 1
                    };

                const insertUserQuery = "INSERT INTO tbl_user SET ?";

                // Insert user into the database
                const [result] = await database.query(insertUserQuery, userData);
                console.log(result.insertId)
                if (!result.insertId) {
                    return callback({
                        code: response_code.OPERATION_FAILED,
                        message: "User registration failed"
                    }, null);
                } 
                const timeZoneTimestamp = new Date(request_data.time_zone).toISOString().slice(0, 19).replace('T', ' ');
                const deviceData = {
                    user_id: result.insertId,
                    device_type: request_data.device_type,
                    device_token: request_data.device_token,
                    os_version: request_data.os_version,
                    app_version: request_data.app_version,
                    time_zone: timeZoneTimestamp
                };
                
                const insertDeviceQuery = "INSERT INTO tbl_device_info SET ?";
                await database.query(insertDeviceQuery, deviceData);

                callback({
                    code: response_code.SUCCESS,
                    message: "User registered, please verify OTP",
                    user_id: result.insertId
                });

            } catch (error) {
                console.error("Signup error:", error); // Log the actual error
                callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Signup error: " + error.message  // Include error message
                }, null);
            }
    }

    // verify OTP
    async verifyOTP(request_data, callback) {
        try {
            const generated_otp = common.generateOTP();
            console.log("Generated OTP:", generated_otp);
            const otp_data = {
                user_id: request_data.user_id,
                action: "signup",
                verify_with: request_data.email_id ? "email" : "phone",
                verify: 0,  // Not verified yet
                otp: generated_otp,
                created_at: new Date()
            };
            const insertOTPQuery = "INSERT INTO tbl_otp SET ?";
            console.log("Executing query:", insertOTPQuery, otp_data);

            const [result] = await database.query(insertOTPQuery, otp_data);

            console.log("Database Insert Result:", result);

            return callback({
                code: response_code.SUCCESS,
                message: "OTP sent successfully"
            }
            )
        } catch {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "OTP generation error: "
            }, null);
        }
    };

    // OTP validation
    async validateOTP(request_data, callback) {
        try {
            const getOtpQuery = "SELECT otp FROM tbl_otp WHERE user_id = ?";
            const [otpResult] = await database.query(getOtpQuery, [request_data.user_id]);
            console.log("OTP Result:", otpResult);

            if (!otpResult || otpResult.length === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "OTP not found"
                });
            }
            const storedOTP = otpResult[0].otp; // Extracting OTP value
            // Check if OTP matches
            if (storedOTP != request_data.otp) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "OTP incorrect"
                });
            }
            // mark OTP as verified
            const updateOtpQuery = "UPDATE tbl_otp SET verify = 1 WHERE user_id = ? and otp = ?";
            console.log("Executing Query:", updateOtpQuery);
            const [updateResult] = await database.query(updateOtpQuery, [request_data.user_id, request_data.otp]);
            console.log("Update Query Result:", updateResult);

            // Check if any row was affected
            if (updateResult.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update OTP verification"
                });
            }
            callback({
                code: response_code.SUCCESS,
                message: "OTP verified successfully"
            });
        }
        catch {
            callback({
                code: response_code.OPERATION_FAILED,
                message: "OTP validation error: "
            }, null);
        }
    };

    async checkUserVerification(request_data, callback) {
        try {
            const checkQuery = "SELECT verify FROM tbl_otp WHERE user_id = ?";
            const [otpResult] = await database.query(checkQuery, [request_data.user_id]);
            console.log("OTP Result:", otpResult);
            if (!otpResult || otpResult[0].verify != 1) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "User not verified"
                }, null);
            }
            const updateUserQuery = "UPDATE tbl_user SET steps_ = 2 WHERE user_id = ?";
            const [result] = await database.query(updateUserQuery, [request_data.user_id]);
            console.log("Update Query Result:", result);
            callback({
                code: response_code.SUCCESS,
                message: "User is verified and can proceed"
            });
        } catch (error) {  // Fix: Added 'error' parameter
            console.error("Verification check failed:", error.message);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Verification check failed: " + error.message
            });
        }

    };

    async updateUserProfile(request_data, callback) {
        if (!request_data || !request_data.user_id) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Invalid request data"
            });
        }    
        try {
            // Fetch user data first to check OTP verification status
        const userResult = await common.getUserDetail(request_data.user_id);

        if (!userResult || userResult.length === 0) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "User not found"
            });
        }

        if (userResult[0].steps_ !== 2) {
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Please verify your OTP before updating your profile"
            });
        }

        // Prepare updated user data
        const user_data = {
            user_full_name: request_data.user_full_name,
            date_of_birth: request_data.date_of_birth,
            steps_: 3
        };

        // Update user profile
        const updatedUser = await common.updateUserInfo(request_data.user_id, user_data);

        callback({
            code: response_code.SUCCESS,
            message: "Profile updated successfully",
            user: updatedUser
        });
        } catch (error) {
            callback({
                code: response_code.OPERATION_FAILED,
                message: "Profile update failed"
            }, null);
        }  
    }

    //forget password
    async forgotPassword(request_data, callback) {
        try {
            let field, email;

            // Determine whether to use email or phone number
            if (request_data.email_id) {
                field = 'email_id';
                email = request_data.email_id;
            } else if (request_data.phone_number) {
                field = 'phone_number';
                email = request_data.phone_number;
            } else {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email or phone number is required"
                });
            }

            const selectQuery = `SELECT user_id, email_id, phone_number FROM tbl_user WHERE ${field} = ?`;
            // console.log("Executing Query:", selectQuery);
            // Execute the query
            const [result] = await database.query(selectQuery, [email]);
            console.log("Query Result:", result);
            const user = result[0];
            // Check if OTP matches
            // Verify email/phone matches the request
            if (field === 'email_id' && user.email_id !== request_data.email_id) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Email does not exist"
                });
            } else {
                callback({
                    code: response_code.SUCCESS,
                    message: "User registered, please verify OTP",
                    user_id: user.user_id
                });
            }

        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    // reset Password - updated the tbl_user table with new password
    async resetPassword(request_data, callback) {
        try {
            if (!request_data.passwords) {
                return callback({
                    code: 400,
                    message: "Password is required"
                });
            }                                         
            const passwordHash = md5(request_data.passwords || ""); // Hash the password
            const updateQuery = "UPDATE tbl_user SET passwords = ? WHERE user_id = ?";
            const [result] = await database.query(updateQuery, [passwordHash, request_data.user_id]);
            console.log("Update Query Result:", result);

            if (result.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update password"
                });
            }
            callback({
                code: response_code.SUCCESS,
                message: "Password updated successfully"
            });
        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    async changePassword(request_data, callback) {
        try {
            let oldPassword = request_data.old_password; // Old password from user input
            let newPassword = request_data.new_password; // New password from user input

            // Hash the passwords
            const oldPasswordHash = md5(oldPassword || "");
            const newPasswordHash = md5(newPassword || "");

            const selectQuery = `SELECT passwords FROM tbl_user WHERE user_id = ?`;
            const [result] = await database.query(selectQuery, [request_data.user_id]);

            if (result[0].passwords !== oldPasswordHash) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Old password is incorrect"
                });
            }
            if (oldPasswordHash === newPasswordHash) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Old password and new password should not be same"
                });
            }
            const updateQuery = "UPDATE tbl_user SET passwords = ? WHERE user_id = ?";
            const [updateResult] = await database.query(updateQuery, [newPasswordHash, request_data.user_id]);
            // Check if the update was successful
            if (updateResult.affectedRows === 0) {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to update password"
                });
            }
            callback({
                code: response_code.SUCCESS,
                message: "Password updated successfully"
            });


        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    // login
    async login(request_data, callback) {
        try {
            let field = 'email_id';
            let email = request_data.email_id;

            if (!email) {
                field = 'phone_number';
                email = request_data.phone_number;
            }

            const passwordHash = md5(request_data.passwords || ""); // Hash the password

            const selectQuery = `SELECT *, user_id FROM tbl_user WHERE ${field} = ? AND passwords = ?`;
            const condition = [email, passwordHash];

            console.log("Executing Query:", selectQuery);
            console.log("Query Parameters:", condition);

            // Execute the query
            const [result] = await database.query(selectQuery, condition);

            console.log("Query Result:", result);

            if (result.length > 0) {
                let user = result[0];

                if (user.is_active == 1) {
                    return callback({
                        code: response_code.SUCCESS,
                        message: "Login successful",
                        data: user
                    });
                } else {
                    return callback({
                        code: response_code.ACCOUNT_INACTIVE,
                        message: "Account is inactive"
                    });
                }
            } else {
                return callback({
                    code: response_code.INVALID_CREDENTIALS,
                    message: "Invalid email or password"
                });
            }
        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    async displayTrendingPost(request_data, callback) {
        try{
            const updateTrendingQuery = `
                UPDATE tbl_post p
                JOIN (
                    SELECT post_id
                    FROM (
                        SELECT post_id, COUNT(rating_id) AS total_ratings, AVG(rating) AS avg_rating
                        FROM tbl_rating
                        GROUP BY post_id
                        ORDER BY total_ratings DESC, avg_rating DESC
                        LIMIT 3
                    ) AS trending_post
                ) tp ON p.post_id = tp.post_id
                SET p.is_trending = 1
                WHERE is_active = 1 AND is_deleted = 0
            `;
    
            await database.query(updateTrendingQuery);
            const resetTrendingQuery = `
                UPDATE tbl_post 
                SET is_trending = 0 
                WHERE post_id NOT IN (
                    SELECT post_id FROM (
                        SELECT post_id
                        FROM tbl_rating
                        GROUP BY post_id
                        ORDER BY COUNT(rating_id) DESC, AVG(rating) DESC
                        LIMIT 3
                    ) AS trending
                )
            `;

            await database.query(resetTrendingQuery);

            const selectQuery =`select p.post_id, i.image_name from tbl_post p 
                                    inner join tbl_post_image_relation pi on pi.post_id = p.post_id 
                                    inner join tbl_image i on i.image_id = pi.image_id
                                    where p.is_trending = 1 AND p.is_active = 1 AND p.is_deleted = 0;`
            const [result] = await database.query(selectQuery);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "Trending posts",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
                message: "No trending posts found",
                data: []
            });
        }
        
    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }

}   
    //filter
    async filter(request_data, callback){
        const {filter_type, post_type} = request_data;
        if(filter_type === "new"){
            var query;
            var queryParams = [];

            if(post_type === "toStyleAll"){
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        order by p.created_at limit 6;`;
            } else{
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        and p.post_type = ?
                        order by p.created_at limit 3;`;
                        queryParams.push(post_type);
            }

            const [results] = await database.query(query, queryParams);
            if(results.length === 0){
                return callback({
                    code: response_code.NOT_FOUND,
                    message: "NOT FOUND"
                });
            }
            return callback({
                code: response_code.SUCCESS,
                message: "Here are posts...",
                data: results
            });

        } else if(filter_type === "following"){
            var query;
            var queryParams = [];

            if(post_type === "toStyleAll"){
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        and
                        p.user_id in (
                            select f.follow_id from tbl_follow f where f.user_id = 1
                        )
                        order by p.created_at limit 3;`;
            } else{
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        and
                        p.user_id in (
                            select f.follow_id from tbl_follow f where f.user_id = 1
                        )
                        and post_type = ?
                        order by p.created_at limit 3;
                        `;
                        queryParams.push(post_type);
            }

            const [results] = await database.query(query, queryParams);
            if(results.length === 0){
                return callback({
                    code: response_code.NOT_FOUND,
                    message: "NOT FOUND"
                });
            }
            return callback({
                code: response_code.SUCCESS,
                message: "Here are posts...",
                data: results
            });

        } else if(filter_type === "expiring"){
            var query;
            var queryParams = [];

            if(post_type === "toStyleAll"){
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        and
                        expire_timer BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 YEAR)`;

            } else{
                query = `select
                        p.post_id,
                        i.image_name,
                        p.post_type
                        from tbl_post p
                        left join
                        tbl_post_image_relation pi
                        on pi.post_id = p.post_id
                        left join
                        tbl_image i
                        on i.image_id = pi.image_id
                        where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                        and
                        expire_timer BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 YEAR)
                        and post_type = ?;
                        `;
                        queryParams.push(post_type);
            }

            const [results] = await database.query(query, queryParams);
            if(results.length === 0){
                return callback({
                    code: response_code.NOT_FOUND,
                    message: "NOT FOUND"
                });
            }
            return callback({
                code: response_code.SUCCESS,
                message: "Here are posts...",
                data: results
            });

        } else{
            return callback({
                code: response_code.NOT_FOUND,
                message: "Some Error"
            });
        }
    }

    // // filter new
    // async filterNew(request_data, callback) {
    //     try{
    //         const selectQuery =`select p.post_id, i.image_name, p.post_type from tbl_post p 
    //                                 left join tbl_post_image_relation pi on pi.post_id = p.post_id
    //                                 left join tbl_image i on i.image_id = pi.image_id
    //                                 where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
    //                                 order by p.created_at limit 3;`
    //         const [result] = await database.query(selectQuery);
    //         if(result.length > 0){
    //             return callback({
    //                 code: response_code.SUCCESS,
    //                 message: "post based on filter new",
    //                 data: result
    //             });
                                
    //     }else {
    //         return callback({
    //             code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
    //             message: "no New post found",
    //             data: []
    //         });
    //     }

    // }catch(error){
    //     console.error("Database Error:", error);
    //     return callback({
    //         code: response_code.OPERATION_FAILED,
    //         message: "Database error occurred: " + (error.sqlMessage || error.message)
    //     });
    // }
    // }
    // // filter/following
    // async filterFollowing(request_data, callback) {
    //     try{
    //         const selectQuery =`select p.post_id, i.image_name, p.post_type from tbl_post p
    //                                 left join tbl_post_image_relation pi on pi.post_id = p.post_id
    //                                 left join tbl_image i on i.image_id = pi.image_id
    //                                 where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
    //                                 and p.user_id in (
    //                                     select f.follow_id from tbl_follow f where f.user_id = 1)
    //                                 order by p.created_at limit 3;`
    //         const [result] = await database.query(selectQuery);
    //         if(result.length > 0){
    //             return callback({
    //                 code: response_code.SUCCESS,
    //                 message: "post shown only which are followed by user",
    //                 data: result
    //             });
                                
    //     }else {
    //         return callback({
    //             code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
    //             message: "no post found which are followed by user",
    //             data: []
    //         });
    //     }

    // }catch(error){
    //     console.error("Database Error:", error);
    //     return callback({
    //         code: response_code.OPERATION_FAILED,
    //         message: "Database error occurred: " + (error.sqlMessage || error.message)
    //     });
    // }
    // }

    // //filter/new/toStypeCompare
    // async filterNewToStyleCompare(request_data, callback) {
    //     try{
    //         const selectQuery =`select p.post_id, i.image_name, p.post_type from tbl_post p
    //                                 left join tbl_post_image_relation pi on pi.post_id = p.post_id
    //                                 left join tbl_image i on i.image_id = pi.image_id
    //                                 where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0 and p.post_type = "toStyleCompare"
    //                                 order by p.created_at limit 3;`
    //         const [result] = await database.query(selectQuery);
    //         if(result.length > 0){
    //             return callback({
    //                 code: response_code.SUCCESS,
    //                 message: "post shown on filter new/toStyleCompare",
    //                 data: result
    //             });
                                
    //     }else {
    //         return callback({
    //             code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
    //             message: "no post found ",
    //             data: []
    //         });
    //     }

    // }catch(error){
    //     console.error("Database Error:", error);
    //     return callback({
    //         code: response_code.OPERATION_FAILED,
    //         message: "Database error occurred: " + (error.sqlMessage || error.message)
    //     });
    // }
    // }

    //  //filter/Expiring/toStypeCompare
    // async filterExpiringToStyleCompare(request_data, callback) {
    //     try{
    //         const selectQuery =`select p.post_id, i.image_name, p.post_type from tbl_post p
    //                                     left join tbl_post_image_relation pi on pi.post_id = p.post_id
    //                                     left join tbl_image i on i.image_id = pi.image_id
    //                                     where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
    //                                     and
    //                                     expire_timer BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 YEAR)
    //                                     and post_type = "toStyleCompare";`
    //         const [result] = await database.query(selectQuery);
    //         if(result.length > 0){
    //             return callback({
    //                 code: response_code.SUCCESS,
    //                 message: " Filter using Expiring when postType select as toStyleCompare",
    //                 data: result
    //             });
                                
    //     }else {
    //         return callback({
    //             code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
    //             message: "no post found ",
    //             data: []
    //         });
    //     }

    // }catch(error){
    //     console.error("Database Error:", error);
    //     return callback({
    //         code: response_code.OPERATION_FAILED,
    //         message: "Database error occurred: " + (error.sqlMessage || error.message)
    //     });
    // }
    // }

    //display category wise post
    async CategoryWiseDisplay(request_data, callback) {
        
        try{
            const selectQuery =`select p.post_id, c.category_name, i.image_name,p.post_type from tbl_post p
                                    inner join tbl_category c on p.category_id = c.category_id
                                    left join tbl_post_image_relation pi on pi.post_id = p.post_id
                                    left join tbl_image i on i.image_id = pi.image_id
                                    where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 and i.is_deleted = 0
                                    and c.category_name = ?;`
            const [result] = await database.query(selectQuery, [request_data.category_name]);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "post shown on category based",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  // Assuming a code for empty data
                message: `no post found in ${request_data.category_name} `,
                data: []
            });
        }

    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }
    }
    //see ranking of posts
    async postRankings(request_data, callback) {
        
        try{
            const selectQuery =`select avg_rating,
                                    rank() over (order by avg_rating desc) as rank_no ,
                                    image_id
                                    from tbl_subpost where post_id = ?;`
            const [result] = await database.query(selectQuery, [request_data.post_id]);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "Here is your ranking",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  
                message: `no ranking available  `,
                data: []
            });
        }

    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }
    }

    //post details
    async postDetails(request_data, callback) {
        
        try{
            const selectQuery =`select p.post_id,u.user_name,p.descriptions,p.comment_cnt, c.category_name, i.image_name,p.post_type ,t.tags,p.created_at from tbl_post p
                                    inner join tbl_category c on p.category_id = c.category_id
                                    left join tbl_user u on p.user_id = u.user_id
                                    left join tbl_post_image_relation pi on pi.post_id = p.post_id
                                    left join tbl_post_tag as pt on pt.post_id = p.post_id
                                    left join tbl_tags as t on t.tag_id = pt.tag_id
                                    left join tbl_image i on i.image_id = pi.image_id
                                    where p.is_active = 1 and p.is_deleted = 0 and i.is_active = 1 
                                    and i.is_deleted = 0 and p.post_id = ?;`
            const [result] = await database.query(selectQuery, [request_data.post_id]);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "post details",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  
                message: `no post details found `,
                data: []
            });
        }

    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }
    }
    //saved post
    async savedPost(request_data, callback) {
        
        try{
            const selectQuery =`select * from tbl_post as p 
                                    inner join tbl_user as u on p.user_id = u.user_id 
                                    inner join tbl_save as s on s.user_id= u.user_id AND s.post_id = p.post_id where s.is_save=1;`
            const [result] = await database.query(selectQuery);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "saved post",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  
                message: `no post saved `,
                data: []
            });
        }

    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }
    }

    //profile page of user
    async profileOfUser(request_data, callback) {
        
        try{
            const selectQuery =`select sp.subpost_id,u.user_name, u.user_full_name, u.descriptions, u.profile_pic, u.follower_cnt, u.following_cnt, u.rating_cnt, i.image_name
                                    from tbl_user as u inner join tbl_post as p on u.user_id = p.user_id 
                                    inner join tbl_subpost as sp on sp.post_id =p.post_id
                                    inner join tbl_image as i on i.image_id = sp.image_id
                                    where u.user_id=?`
            const [result] = await database.query(selectQuery, [request_data.user_id]);
            if(result.length > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "profile of user",
                    data: result
                });
                                
        }else {
            return callback({
                code: response_code.NO_DATA_FOUND,  
                message: `no user found`,
                data: []
            });
        }

    }catch(error){
        console.error("Database Error:", error);
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Database error occurred: " + (error.sqlMessage || error.message)
        });
    }
    }

    //add post
    async create_post(request_data,user_id,callback) {
        try{
            if (!user_id) {
                throw new Error("User ID is required");
            }
            let category_id=null;
            if(request_data.category_name){
                const [existingCategory]=await database.query(
                    "select category_id from tbl_category where category_name = ?",
                    [request_data.category_name]
                );
                if(existingCategory.length>0){
                    category_id=existingCategory[0].category_id;
                }
            }
            const postQuery=`INSERT INTO tbl_post 
            (user_id,descriptions,post_type,expire_timer, category_id) 
            VALUES (?, ?, ?, ?,?)`

            const postParams=[
                user_id,
                request_data.descriptions || null,
                request_data.post_type || null,
                request_data.expire_timer,
                category_id
            ]
            const [postResult] = await database.query(postQuery,postParams);
            const post_id = postResult.insertId;
            const [postData]= await database.query(
                `SELECT * FROM tbl_post WHERE post_id = ?`, [post_id]
            );

            return callback({
                code: response_code.SUCCESS,
                message: "Post Created Successfully",
                data: postData[0]
            });

        }catch(error){
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
    }
    }
    
    async otherProfile(requestData, callback) {
        try {
            console.log(requestData.other_id, requestData.user_id);
    
            const other_id = requestData.other_id;
    
            // Fetch the following IDs of the user
            const followingQuery = "SELECT follow_id FROM tbl_follow WHERE user_id = ?";
            const [followingResult] = await database.query(followingQuery, [requestData.user_id]);
    
            if (!followingResult || followingResult.length === 0) {
                return callback({
                    code: response_code.NO_DATA_FOUND,
                    message: "You are not following any users."
                });
            }
    
            const followingIds = followingResult.map(row => row.follow_id);
    
            // Check if the requested profile is followed by the user
            if (!followingIds.includes(other_id)) {
                return callback({
                    code: response_code.INACTIVE_ACCOUNT,
                    message: "You are not following this user."
                });
            }
    
            // Fetch user profile details
            const profileQuery = `
                SELECT 
                    u.profile_pic,
                    u.user_name,
                    u.follower_cnt,
                    u.following_cnt,
                    u.descriptions, 
                    COUNT(p.post_id) AS total_post
                FROM tbl_user AS u 
                LEFT JOIN tbl_post AS p ON p.user_id = u.user_id 
                WHERE u.user_id = ?
            `;
    
            const [profileResult] = await database.query(profileQuery, [other_id]);
    
            if (!profileResult || profileResult.length === 0) {
                return callback({
                    code: response_code.NO_DATA_FOUND,
                    message: "User profile not found.",
                    data: []
                });
            }
    
            return callback({
                code: response_code.SUCCESS,
                message: "Profile retrieved successfully.",
                data: profileResult[0]
            });
    
        } catch (error) {
            console.error("Database Error:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Database error occurred: " + (error.sqlMessage || error.message)
            });
        }
    }

    async contact_us(request_data, user_id, callback) {
        try {

            if (!request_data.title || !request_data.email_id || !request_data.message) {
                return callback({
                    code: response_code.BAD_REQUEST,
                    message: "Title, Email ID, and Message are required"
                });
            }
    
            const contact_us = {
                title: request_data.title,
                email_id: request_data.email_id,
                message: request_data.message,
                user_id: user_id
            };
    
            const insertQuery = "INSERT INTO tbl_contact_us SET ?";
    
            const [result] = await database.query(insertQuery, [contact_us]);
    
            if (result.affectedRows > 0) {
                return callback({
                    code: response_code.SUCCESS,
                    message: "Contact request submitted successfully",
                    data: { contact_id: result.insertId }
                });
            } else {
                return callback({
                    code: response_code.OPERATION_FAILED,
                    message: "Failed to submit contact request"
                });
            }
    
        } catch (error) {
            console.error("Error in contact_us:", error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Error submitting contact request"
            });
        }
    } 

    async follow_user(request_data, user_id, callback) {
        try{
            const {follow_id} = request_data;
            if(!follow_id){
                return callback({
                    code: response_code.BAD_REQUEST,
                    message: "Follow ID is required"
                });
            }

            const checkFollowQuery ="SELECT * FROM tbl_follow WHERE user_id = ? AND follow_id = ?";
            const [existingFollow] = await database.query(checkFollowQuery, [user_id, follow_id]);
            if(existingFollow.length > 0){
                return callback({
                    code: response_code.ALREADY_EXISTS,
                    message: "User is already followed"
                });
            }
            const followQuery = "INSERT INTO tbl_follow (user_id, follow_id) VALUES (?, ?)";
            const [followResult] = await database.query(followQuery, [user_id, follow_id]);
            if(followResult.affectedRows > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "User followed successfully"
                });
        }
    }catch (error) {
        return callback({
            code: response_code.OPERATION_FAILED,
            message: "Error occurred while following user",
            data: error.message || error,
        });
    }
    }

    async save_post(request_data, user_id, callback) {
        try{
            const {post_id} = request_data;
            
            const checkSaveQuery = "SELECT * FROM tbl_save WHERE user_id = ? AND post_id = ?";
            const [existingSave] = await database.query(checkSaveQuery, [user_id, post_id]);

            if(existingSave.length > 0){
                const deleteQuery = "DELETE FROM tbl_save WHERE user_id = ? AND post_id = ?";
                await database.query(deleteQuery, [user_id, post_id]);
                return callback({
                    code: response_code.SUCCESS,
                    message: "Post unsaved successfully"
                });
            }else{
                const saveQuery = "INSERT INTO tbl_save (user_id, post_id) VALUES (?, ?)";
                const [saveResult] = await database.query(saveQuery, [user_id, post_id]);
                if(saveResult.affectedRows > 0){
                    return callback({
                        code: response_code.SUCCESS,
                        message: "Post saved successfully"
                    });
                }
            }
        }catch(error){
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Some Error Occured",
                data: error
            });
        }
    }

    async add_comment(request_data, user_id, callback) {
        try{
            const {post_id, comment_} = request_data;
            if(!post_id || !comment_){
                return callback({
                    code: response_code.BAD_REQUEST,
                    message: "Post ID and Comment are required"
                });
            }
            const commentQuery = "INSERT INTO tbl_comment (user_id, post_id, comment_) VALUES (?, ?, ?)";
            const [commentResult] = await database.query(commentQuery, [user_id, post_id, comment_]);
            if(commentResult.affectedRows > 0){
                return callback({
                    code: response_code.SUCCESS,
                    message: "Comment added successfully",
                    data: {commentResult}
                });
            }
        }catch(error){
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Error",
                data: error
            });
        }
    }

    async delete_posts(request_data, callback){
        try{
    
            const {post_id, user_id} = request_data;
            var checkQuery = "SELECT * FROM tbl_post WHERE post_id = ? AND user_id = ?";
            const [post] = await database.query(checkQuery, [post_id, user_id]);
    
            if (post.length === 0) {
                return callback({
                    code: response_code.NOT_FOUND,
                    message: "Post not found or you are not authorized to delete it."
                });
            }
    
            if (post[0].is_deleted === 1) {
                return callback({
                    code: response_code.SUCCESS,
                    message: "Post is already deleted."
                });
            }
    
            
            const deletePostQuery = "UPDATE tbl_post SET is_deleted = 1, is_active = 0 WHERE post_id = ? AND user_id = ?";
            await database.query(deletePostQuery, [post_id, user_id]);
    
            const deleteImagesQuery = `
                UPDATE tbl_image 
                SET is_deleted = 1, is_active = 0 
                WHERE image_id IN (
                    SELECT image_id FROM tbl_post_image_relation WHERE post_id = ?
                )
            `;
            await database.query(deleteImagesQuery, [post_id]);
    
            return callback({
                code: response_code.SUCCESS,
                message: "Post and related images deleted successfully."
            });
    
        } catch(error){
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Error Occured",
                data: error
            })
        }
    }

    async edit_profile(request_data, user_id, callback) {
        try {
            if (!user_id) {
                return callback({
                    code: response_code.BAD_REQUEST,
                    message: "User ID is required"
                });
            }
    
            const allowedFields = ["user_name", "user_full_name", "date_of_birth", "descriptions", "profile_pic"];
            let updateFields = [];
            let values = [];
    
            for (let key of allowedFields) {
                if (request_data[key] !== undefined) {
                    updateFields.push(`${key} = ?`);
                    values.push(request_data[key]);
                }
            }
    
            if (updateFields.length === 0) {
                return callback({
                    code: response_code.NO_CHANGE,
                    message: "No valid fields provided for update"
                });
            }

            updateFields.push("updated_at = CURRENT_TIMESTAMP()");
            values.push(user_id);
    
            const updateQuery = `
                UPDATE tbl_user 
                SET ${updateFields.join(", ")}
                WHERE user_id = ? AND is_active = 1 AND is_deleted = 0
            `;
    
            const [result] = await database.query(updateQuery, values);
    
            if (result.affectedRows > 0) {
                return callback({
                    code: response_code.SUCCESS,
                    message: "Profile updated successfully"
                });
            } else {
                return callback({
                    code: response_code.NOT_FOUND,
                    message: "User not found or no changes applied"
                });
            }
    
        } catch (error) {
            console.log(error);
            return callback({
                code: response_code.OPERATION_FAILED,
                message: "Error updating profile"
            });
        }
    }

}
module.exports = new UserModel();
// async signup(request_data, callback) {
//     try {
//         console.log(request_data);

//         // Validate required fields
//         if (!request_data.email_id || !request_data.device_type) {
//             return callback({
//                 code: response_code.OPERATION_FAILED,
//                 message: "Missing required fields"
//             });
//         }

//         // Initialize user data with required fields
//         const user_data = {
//             email_id: request_data.email_id,
//             login_type: request_data.login_type || "S" // Default to 'S' if not provided
//         };

//         // Add optional fields if they exist
//         const optionalFields = ['user_name', 'fname', 'lname', 'phone_number', 'social_id', 'latitude', 'longitude'];
//         optionalFields.forEach(field => {
//             if (request_data[field]) {
//                 user_data[field] = request_data[field];
//             }
//         });

//         if (request_data.passwords) {
//             user_data.passwords = md5(request_data.passwords);
//         }

//         // Prepare device data
//         const device_data = {
//             device_type: request_data.device_type,
//             device_token: request_data.device_token,
//             os_version: request_data.os_version,
//             app_version: request_data.app_version,
//             time_zone: request_data.time_zone // Add time_zone to match INSERT query
//         };

//         // Determine query based on login type
//         const selectUserQueryIfExists = user_data.login_type === "S"
//             ? "SELECT * FROM tbl_user WHERE email_id = ? OR phone_number = ?"
//             : "SELECT * FROM tbl_user WHERE email_id = ? OR social_id = ?";

//         const params = user_data.login_type === "S"
//             ? [user_data.email_id, user_data.phone_number || null]
//             : [user_data.email_id, user_data.social_id];

//         // Check if user exists
//         const [existingUsers] = await database.query(selectUserQueryIfExists, params);

//         if (existingUsers.length > 0) {
//             // Handle existing user
//             const user_data_ = existingUsers[0];

//             if (existingUsers.length > 1) {
//                 await database.query(
//                     "UPDATE tbl_user SET is_deleted = 1 WHERE user_id = ?",
//                     [existingUsers[1].user_id]
//                 );
//             }

//             const otp_obj = request_data.otp ? { otp: request_data.otp } : {};
            
//             common.updateUserInfo(user_data_.user_id, otp_obj, (error, updateUser) => {
//                 if (error) {
//                     return callback({
//                         code: response_code.OPERATION_FAILED,
//                         message: error
//                     });
//                 }
//                 return callback({
//                     code: response_code.SUCCESS,
//                     message: "User Signed up",
//                     data: updateUser
//                 });
//             });
//         } else {
//             // Handle new user
//             if (!user_data.social_id && user_data.login_type === "S") {
//                 // Regular signup - proceed directly
//             } else {
//                 // Social signup - verify social account
//                 const [socialResult] = await database.query(
//                     "SELECT * FROM tbl_socials WHERE email = ? AND social_id = ?",
//                     [user_data.email_id, user_data.social_id]
//                 );

//                 if (!socialResult.length) {
//                     return callback({
//                         code: response_code.OPERATION_FAILED,
//                         message: "Social ID and email combination not found in tbl_socials"
//                     });
//                 }
//             }

//             // Insert new user
//             const [insertResult] = await database.query("INSERT INTO tbl_user SET ?", user_data);
//             const userId = insertResult.insertId;

//             await this.enterOtp(userId);

//             // Insert device info
//             await database.query(
//                 "INSERT INTO tbl_device_info (device_type, time_zone, device_token, os_version, app_version, user_id) VALUES (?, ?, ?, ?, ?, ?)",
//                 [device_data.device_type, device_data.time_zone, device_data.device_token, device_data.os_version, device_data.app_version, userId]
//             );

//             // Get user details
//             common.getUserDetail(userId, userId, async (err, userInfo) => {
//                 try {
//                     if (err) {
//                         return callback({
//                             code: response_code.OPERATION_FAILED,
//                             message: err
//                         });
//                     }
    
//                     if (userInfo.is_profile_complete == 1) {
//                         // Generate tokens
//                         const userToken = common.generateToken(40);
//                         const deviceToken = common.generateToken(40);
    
//                         // Update both tokens in database
//                         await Promise.all([
//                             database.query(
//                                 "UPDATE tbl_user SET token = ? WHERE user_id = ?",
//                                 [userToken, userId]
//                             ),
//                             database.query(
//                                 "UPDATE tbl_device_info SET device_token = ? WHERE user_id = ?",
//                                 [deviceToken, userId]
//                             )
//                         ]);
    
//                         // Update userInfo with new token before sending response
//                         userInfo.token = userToken;
//                         userInfo.device_token = deviceToken;
    
//                         return callback({
//                             code: response_code.SUCCESS,
//                             message: "User Signed Up Successfully... Verification Pending",
//                             data: userInfo
//                         });
//                     } else {
//                         return callback({
//                             code: response_code.SUCCESS,
//                             message: "User Signed Up Successfully... Verification and Profile Completion is Pending",
//                             data: userInfo
//                         });
//                     }
//                 } catch (tokenError) {
//                     console.error("Token update error:", tokenError);
//                     return callback({
//                         code: response_code.OPERATION_FAILED,
//                         message: "Error updating tokens"
//                     });
//                 }
//             });
//         }
//     } catch (error) {
//         console.error("Signup error:", error);
//         return callback({
//             code: response_code.OPERATION_FAILED,
//             message: error.sqlMessage || error.message || "An error occurred during signup"
//         });
//     }
// }