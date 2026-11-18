
document.addEventListener("DOMContentLoaded", () => {

    const recoveryForm = document.getElementById("recoveryForm");

    if (!recoveryForm) return;

    const method = document.getElementById("recoveryMethod");
    const emailField = document.getElementById("emailField");
    const phoneField = document.getElementById("phoneField");

    const otpSection = document.getElementById("otpSection");
    const resetForm = document.getElementById("resetPasswordForm");

    let recoveryChallenge = null;
    let verifiedRecoveryToken = null;

    // Select recovery method
    function updateMethod() {

        const isEmail = method.value === "email";

        emailField.hidden = !isEmail;
        phoneField.hidden = isEmail;

        document.getElementById("recoveryEmail").required = isEmail;
        document.getElementById("recoveryPhone").required = !isEmail;
    }

    method.addEventListener("change", updateMethod);

    updateMethod();

    // Request OTP
    recoveryForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const isEmail = method.value === "email";

        const destination = isEmail
            ? document.getElementById("recoveryEmail").value.trim().toLowerCase()
            : document.getElementById("recoveryPhone").value.trim();

        if (!destination) {
            return APP.message(
                "recoveryMessage",
                "Enter your registered contact information.",
                "error"
            );
        }

        const button = document.getElementById("sendOtpBtn");

        try {

            APP.setLoading(button, true, "Send Verification OTP");

            const result = await APP.callFunction(
                APP_CONFIG.functions.requestRecovery,
                {
                    method: method.value,
                    destination
                }
            );

            recoveryChallenge = result.challenge_id;

            if (!recoveryChallenge) {
                throw new Error("Recovery request could not be created.");
            }

            recoveryForm.querySelectorAll("input, select, button")
                .forEach(element => element.disabled = true);

            otpSection.hidden = false;

            APP.message(
                "recoveryMessage",
                "If the account is eligible, a verification code will be sent.",
                "success"
            );

        } catch (error) {

            APP.message(
                "recoveryMessage",
                error.message || "Unable to request OTP.",
                "error"
            );

        } finally {

            APP.setLoading(button, false, "Send Verification OTP");

            if (recoveryChallenge) button.disabled = true;

        }

    });

    // Verify OTP
    document.getElementById("verifyOtpBtn")
        .addEventListener("click", async () => {

            const otp = document.getElementById("otp").value.trim();

            if (!otp || !recoveryChallenge) {
                return APP.message(
                    "otpMessage",
                    "Enter your OTP first.",
                    "error"
                );
            }

            const button = document.getElementById("verifyOtpBtn");

            try {

                APP.setLoading(button, true, "Verify OTP");

                const result = await APP.callFunction(
                    APP_CONFIG.functions.verifyRecovery,
                    {
                        challenge_id: recoveryChallenge,
                        otp
                    }
                );

                if (!result.verified || !result.recovery_token) {
                    throw new Error("Invalid or expired OTP.");
                }

                verifiedRecoveryToken = result.recovery_token;

                otpSection.hidden = true;
                recoveryForm.hidden = true;
                resetForm.hidden = false;

                APP.message(
                    "resetMessage",
                    "Identity verified. Create your new password.",
                    "success"
                );

            } catch (error) {

                APP.message(
                    "otpMessage",
                    error.message || "OTP verification failed.",
                    "error"
                );

            } finally {

                APP.setLoading(button, false, "Verify OTP");

            }

        });

    // Resend OTP
    document.getElementById("resendOtpBtn")
        .addEventListener("click", async () => {

            try {

                const isEmail = method.value === "email";

                const destination = isEmail
                    ? document.getElementById("recoveryEmail").value.trim().toLowerCase()
                    : document.getElementById("recoveryPhone").value.trim();

                const result = await APP.callFunction(
                    APP_CONFIG.functions.requestRecovery,
                    {
                        method: method.value,
                        destination
                    }
                );

                recoveryChallenge = result.challenge_id;

                document.getElementById("otp").value = "";

                APP.message(
                    "otpMessage",
                    "If eligible, a new OTP has been requested.",
                    "success"
                );

            } catch (error) {

                APP.message(
                    "otpMessage",
                    error.message || "Unable to resend OTP.",
                    "error"
                );

            }

        });

    // Reset Password
    resetForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!verifiedRecoveryToken) {
            return APP.message(
                "resetMessage",
                "Verify your OTP first.",
                "error"
            );
        }

        const password =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmNewPassword").value;

        if (password.length < 12) {
            return APP.message(
                "resetMessage",
                "Password must contain at least 12 characters.",
                "error"
            );
        }

        if (password !== confirmPassword) {
            return APP.message(
                "resetMessage",
                "Passwords do not match.",
                "error"
            );
        }

        const button = document.getElementById("resetPasswordBtn");

        try {

            APP.setLoading(button, true, "Reset Password");

            const result = await APP.callFunction(
                APP_CONFIG.functions.completeRecovery,
                {
                    recovery_token: verifiedRecoveryToken,
                    new_password: password
                }
            );

            if (!result.success) {
                throw new Error("Password reset failed.");
            }

            verifiedRecoveryToken = null;
            recoveryChallenge = null;

            APP.message(
                "resetMessage",
                "Password changed successfully. Redirecting to login...",
                "success"
            );

            resetForm.reset();

            setTimeout(() => {
                window.location.href = APP_CONFIG.links.login;
            }, 1800);

        } catch (error) {

            APP.message(
                "resetMessage",
                error.message || "Unable to reset password.",
                "error"
            );

        } finally {

            APP.setLoading(button, false, "Reset Password");

        }

    });

});
