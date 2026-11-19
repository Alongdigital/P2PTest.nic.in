
document.addEventListener("DOMContentLoaded", () => {

    const codeInput = document.getElementById("activationCode");
    const verifyBtn = document.getElementById("verifyCodeBtn");
    const form = document.getElementById("signupForm");

    if (!codeInput || !verifyBtn || !form) return;

    let verifiedInvitation = null;

    const fields = [
        "fullName",
        "email",
        "mobile",
        "password",
        "confirmPassword",
        "signupTerms",
        "registerBtn"
    ];

    function unlockFields(unlocked) {

        fields.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.disabled = !unlocked;
        });

        const notice = document.getElementById("lockedMessage");

        if (notice) {
            notice.textContent = unlocked
                ? "✓ Invitation verified. Complete your registration."
                : "🔒 Verify your activation code to unlock these fields.";
        }
    }

    unlockFields(false);

    verifyBtn.addEventListener("click", async () => {

        const code = codeInput.value.trim();

        if (!code) {
            return APP.message(
                "activationMessage",
                "Enter your activation code.",
                "error"
            );
        }

        try {

            APP.setLoading(verifyBtn, true, "Verify");

            const result = await APP.callFunction(
                APP_CONFIG.functions.verifyActivation,
                { activation_code: code }
            );

            if (!result.valid || !result.registration_token) {
                throw new Error("Invalid or expired activation code.");
            }

            verifiedInvitation = result.registration_token;

            codeInput.readOnly = true;
            verifyBtn.disabled = true;

            APP.message(
                "activationMessage",
                "Activation code verified successfully.",
                "success"
            );

            unlockFields(true);

            // Pre-fill verified application details
            if (result.applicant) {

                document.getElementById("fullName").value =
                    result.applicant.full_name || "";

                document.getElementById("email").value =
                    result.applicant.email || "";

                document.getElementById("mobile").value =
                    result.applicant.mobile || "";

                // Identity fields remain locked to prevent changes
                document.getElementById("email").readOnly = true;
                document.getElementById("mobile").readOnly = true;
                document.getElementById("fullName").readOnly = true;
            }

        } catch (error) {

            verifiedInvitation = null;

            unlockFields(false);

            APP.message(
                "activationMessage",
                error.message || "Activation verification failed.",
                "error"
            );

        } finally {

            verifyBtn.disabled = Boolean(verifiedInvitation);

            if (!verifiedInvitation) {
                verifyBtn.textContent = "Verify";
            }

        }

    });

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!verifiedInvitation) {
            return APP.message(
                "signupMessage",
                "Verify your activation code first.",
                "error"
            );
        }

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (password.length < 12) {
            return APP.message(
                "signupMessage",
                "Password must contain at least 12 characters.",
                "error"
            );
        }

        if (password !== confirmPassword) {
            return APP.message(
                "signupMessage",
                "Passwords do not match.",
                "error"
            );
        }

        if (!document.getElementById("signupTerms").checked) {
            return APP.message(
                "signupMessage",
                "Please accept the Terms & Conditions.",
                "error"
            );
        }

        const button = document.getElementById("registerBtn");

        try {

            APP.setLoading(button, true, "Create Admin Account");

            const result = await APP.callFunction(
                APP_CONFIG.functions.activateAccount,
                {
                    registration_token: verifiedInvitation,
                    password
                }
            );

            APP.message(
                "signupMessage",
                result.message || "Registration successful. Please sign in.",
                "success"
            );

            verifiedInvitation = null;
            form.reset();
            unlockFields(false);

            codeInput.value = "";
            codeInput.readOnly = false;
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify";

            // Redirect only after backend confirms success
            if (result.success) {
                setTimeout(() => {
                    window.location.href = APP_CONFIG.links.login;
                }, 1800);
            }

        } catch (error) {

            APP.message(
                "signupMessage",
                error.message || "Account creation failed.",
                "error"
            );

        } finally {

            APP.setLoading(button, false, "Create Admin Account");

        }

    });

});
