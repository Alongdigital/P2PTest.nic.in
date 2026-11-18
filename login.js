
document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("loginForm");

    if (!form) return;

    const button = document.getElementById("loginBtn");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const identity =
            document.getElementById("loginIdentity").value.trim();

        const password =
            document.getElementById("password").value;

        const remember =
            document.getElementById("rememberMe").checked;

        const terms =
            document.getElementById("loginTerms").checked;

        if (!identity || !password) {
            return APP.message(
                "authMessage",
                "Enter your login credentials.",
                "error"
            );
        }

        if (!terms) {
            return APP.message(
                "authMessage",
                "Accept the Terms & Conditions first.",
                "error"
            );
        }

        try {

            APP.setLoading(button, true, "Sign In");

            // Verify Google reCAPTCHA on backend
            await APP.verifyCaptcha();

            const client = await APP.init();

            // Resolve mobile number into registered email
            let email = identity;

            if (!identity.includes("@")) {

                const result = await APP.callFunction(
                    APP_CONFIG.functions.findLoginIdentity,
                    { mobile: identity }
                );

                email = result.email;

                if (!email) {
                    throw new Error("Invalid login credentials.");
                }
            }

            // Supabase password authentication
            const { data, error } =
                await client.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            // Verify admin permission server-side
            const authorization = await APP.callFunction(
                "verify-admin-session",
                {}
            );

            if (!authorization.authorized) {

                await client.auth.signOut();

                throw new Error("You are not authorized to access this panel.");
            }

            if (!authorization.active) {

                await client.auth.signOut();

                throw new Error("Your admin account is inactive.");
            }

            // Supabase sessions are persistent by default.
            // Remember preference is currently a UI preference.
            sessionStorage.setItem(
                "admin_remember_preference",
                remember ? "yes" : "no"
            );

            APP.message(
                "authMessage",
                "Login successful. Redirecting...",
                "success"
            );

            window.location.href = APP_CONFIG.links.dashboard;

        } catch (error) {

            APP.message(
                "authMessage",
                error.message || "Login failed. Please try again.",
                "error"
            );

            // Reset CAPTCHA after attempt
            if (typeof grecaptcha !== "undefined") {
                grecaptcha.reset();
            }

        } finally {

            APP.setLoading(button, false, "Sign In");

        }

    });

    // Google OAuth
    const googleButton = document.getElementById("googleLogin");

    if (googleButton) {

        googleButton.addEventListener("click", async () => {

            try {

                const client = await APP.init();

                const { error } = await client.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                        redirectTo: window.location.origin +
                            APP_CONFIG.links.dashboard
                    }
                });

                if (error) throw error;

            } catch (error) {

                APP.message(
                    "authMessage",
                    error.message || "Google login failed.",
                    "error"
                );

            }

        });

    }

});
