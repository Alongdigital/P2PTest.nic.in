
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("applicationForm");

    if (!form) return;

    const button = document.getElementById("applyButton");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName =
            document.getElementById("fullName").value.trim();

        const email =
            document.getElementById("email").value.trim().toLowerCase();

        const mobile =
            document.getElementById("mobile").value.trim();

        const reason =
            document.getElementById("reason").value.trim();

        const role =
            document.getElementById("role").value;

        const consent =
            document.getElementById("applicationConsent").checked;

        if (!fullName || !email || !mobile || !reason || !role) {
            return APP.message(
                "applicationMessage",
                "Please complete all required fields.",
                "error"
            );
        }

        if (!consent) {
            return APP.message(
                "applicationMessage",
                "Please accept the terms.",
                "error"
            );
        }

        try {

            APP.setLoading(button, true, "Submit Application");

            const result = await APP.callFunction(
                APP_CONFIG.functions.submitApplication,
                {
                    full_name: fullName,
                    email,
                    mobile,
                    reason,
                    requested_role: role
                }
            );

            APP.message(
                "applicationMessage",
                result.message || "Application submitted successfully.",
                "success"
            );

            form.reset();

        } catch (error) {

            APP.message(
                "applicationMessage",
                error.message || "Application submission failed.",
                "error"
            );

        } finally {

            APP.setLoading(button, false, "Submit Application");

        }

    });

});
