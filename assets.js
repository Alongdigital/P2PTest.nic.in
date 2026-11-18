
/* =====================================
   ADMIN PORTAL - ASSET CONFIGURATION
===================================== */

window.APP_CONFIG = {

    brand: {
        name: "YOUR BRAND",
        logo: "A",
        year: 2026
    },

    images: {
        background:
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",

        google:
            "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    },

    links: {
        login: "/pages/login.html",
        signup: "/pages/signup.html",
        apply: "/pages/apply.html",
        forgot: "/pages/forgot-password.html",
        dashboard: "/dashboard.html",
        terms: "/pages/terms.html",
        privacy: "/pages/privacy.html"
    },

    supabase: {
        url: "YOUR_SUPABASE_PROJECT_URL",
        publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
    },

    functions: {
        submitApplication: "submit-application",
        verifyCaptcha: "verify-captcha",
        verifyActivation: "verify-activation",
        activateAccount: "activate-account",
        findLoginIdentity: "find-login-identity",
        requestRecovery: "request-recovery-otp",
        verifyRecovery: "verify-recovery-otp"
    },

    captcha: {
        siteKey: "YOUR_RECAPTCHA_SITE_KEY"
    }
};

/* =====================================
   SHARED HELPERS
===================================== */

window.APP = {

    client: null,

    async init() {

        if (!window.supabase) {
            throw new Error("Supabase SDK not loaded.");
        }

        if (!window.APP_CONFIG.supabase.url.startsWith("https://") ||
            window.APP_CONFIG.supabase.publishableKey.includes("YOUR_")) {
            throw new Error("Supabase configuration is incomplete.");
        }

        if (!this.client) {
            this.client = window.supabase.createClient(
                window.APP_CONFIG.supabase.url,
                window.APP_CONFIG.supabase.publishableKey
            );
        }

        return this.client;
    },

    async callFunction(name, body) {

        const client = await this.init();

        const { data, error } =
            await client.functions.invoke(name, { body });

        if (error) throw error;

        if (data?.error) {
            throw new Error(data.error);
        }

        return data;
    },

    message(id, text, type = "info") {

        const element = document.getElementById(id);

        if (!element) return;

        element.textContent = text;

        element.style.color = {
            success: "#4ade80",
            error: "#f87171",
            info: "#93c5fd"
        }[type] || "#ffffff";
    },

    setLoading(button, loading, originalText) {

        if (!button) return;

        button.disabled = loading;
        button.textContent = loading ? "Please wait..." : originalText;
    },

    lockForm(form, locked) {

        if (!form) return;

        form.querySelectorAll("input, select, textarea, button")
            .forEach(element => {
                element.disabled = locked;
            });
    },

    async verifyCaptcha() {

        if (typeof grecaptcha === "undefined") {
            throw new Error("CAPTCHA is not loaded.");
        }

        const token = grecaptcha.getResponse();

        if (!token) {
            throw new Error("Please complete reCAPTCHA.");
        }

        await this.callFunction(
            APP_CONFIG.functions.verifyCaptcha,
            { token }
        );

        return token;
    }
};

/* =====================================
   SHARED PAGE BRANDING
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    const brand = document.querySelector(".brand h2");
    const logo = document.querySelector(".brand-logo");
    const background = document.querySelector(".background");

    if (brand) {
        brand.textContent = APP_CONFIG.brand.name;
    }

    if (logo) {
        logo.textContent = APP_CONFIG.brand.logo;
    }

    if (background) {
        background.style.backgroundImage =
            `url("${APP_CONFIG.images.background}")`;
    }

});
