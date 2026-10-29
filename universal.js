
/* =====================================================
   UNIVERSAL ADMIN PANEL
   Main Controller | Owner + Main Developer
   Storage: Browser localStorage (configuration preview)
   ===================================================== */

"use strict";

const UniversalAdmin = (() => {
    const STORAGE_KEY = "universal_admin_v1";

    const defaultState = {
        websites: [],
        databases: [],
        users: [
            {
                id: "owner-main",
                name: "Owner",
                email: "",
                role: "Owner",
                locked: true
            },
            {
                id: "developer-main",
                name: "Main Developer",
                email: "",
                role: "Main Developer",
                locked: true
            }
        ],
        config: {
            platformName: "Universal Admin",
            brandName: "Edutech Technology",
            primaryColor: "#101a30",
            accentColor: "#d5ad60",
            logoUrl: "",
            navigation: "default"
        },
        activity: []
    };

    let state = loadState();

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (!saved) return clone(defaultState);

            const parsed = JSON.parse(saved);

            return {
                ...clone(defaultState),
                ...parsed,
                config: {
                    ...defaultState.config,
                    ...(parsed.config || {})
                },
                websites: Array.isArray(parsed.websites)
                    ? parsed.websites : [],
                databases: Array.isArray(parsed.databases)
                    ? parsed.databases : [],
                users: Array.isArray(parsed.users)
                    ? parsed.users : clone(defaultState.users),
                activity: Array.isArray(parsed.activity)
                    ? parsed.activity : []
            };
        } catch (error) {
            console.error("Unable to load admin settings:", error);
            return clone(defaultState);
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            updateDashboard();
            return true;
        } catch (error) {
            console.error("Unable to save settings:", error);
            toast("Settings save nahi ho paaye. Storage check karo.");
            return false;
        }
    }

    function id() {
        return "item-" + Date.now().toString(36) +
            "-" + Math.random().toString(36).slice(2, 8);
    }

    function safeText(value) {
        return String(value ?? "");
    }

    function validHttpUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "https:" ||
                url.protocol === "http:";
        } catch {
            return false;
        }
    }

    function toast(message) {
        let box = $("#toast");

        if (!box) {
            box = document.createElement("div");
            box.id = "toast";
            box.className = "toast";
            document.body.appendChild(box);
        }

        box.textContent = message;
        box.classList.add("show");

        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => {
            box.classList.remove("show");
        }, 2800);
    }

    function log(message) {
        state.activity.unshift({
            id: id(),
            message,
            time: new Date().toLocaleString()
        });

        state.activity = state.activity.slice(0, 100);
        saveState();
        renderActivity();
    }

    // ---------- NAVIGATION ----------

    function navigateTo(page) {
        const target = $("#" + page);

        if (!target) return;

        $$(".nav-link").forEach(link => {
            link.classList.toggle(
                "active",
                link.dataset.page === page
            );
        });

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        if (location.hash !== "#" + page) {
            history.replaceState(null, "", "#" + page);
        }
    }

    function setupNavigation() {
        $$(".nav-link[data-page]").forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        const sidebar = $(".sidebar");

        if (sidebar && !$(".sidebar-overlay")) {
            const overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            document.body.appendChild(overlay);

            overlay.addEventListener("click", () => {
                sidebar.classList.remove("open");
                overlay.classList.remove("show");
            });
        }

        const menuButton = $("[data-menu-toggle]");

        if (menuButton && sidebar) {
            menuButton.addEventListener("click", () => {
                sidebar.classList.toggle("open");
                $(".sidebar-overlay")?.classList.toggle("show");
            });
        }

        if (location.hash.length > 1) {
            const page = location.hash.slice(1);

            if ($("#" + page)) {
                navigateTo(page);
            }
        }
    }

    // ---------- WEBSITE MANAGEMENT ----------

    function renderWebsites() {
        const list = $("#websiteList");
        if (!list) return;

        list.replaceChildren();

        if (!state.websites.length) {
            list.textContent = "Abhi koi website add nahi ki gayi.";
            return;
        }

        state.websites.forEach(site => {
            const card = document.createElement("article");
            card.className = "record-card";

            const details = document.createElement("div");
            details.className = "record-details";

            const title = document.createElement("strong");
            title.textContent = site.name;

            const link = document.createElement("a");
            link.href = site.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = site.url;

            const description = document.createElement("p");
            description.textContent = site.description || "";

            details.append(title, link, description);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "btn btn-danger";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                if (!confirm(`Remove website "${site.name}"?`)) return;

                state.websites = state.websites.filter(
                    item => item.id !== site.id
                );

                saveState();
                renderWebsites();
                log("Website removed: " + site.name);
                toast("Website removed.");
            });

            card.append(details, remove);
            list.appendChild(card);
        });
    }

    function setupWebsiteForm() {
        const form = $("#websiteForm");
        if (!form) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            const name = $("#websiteName", form)?.value.trim();
            const url = $("#websiteUrl", form)?.value.trim();
            const description =
                $("#websiteDescription", form)?.value.trim() || "";

            if (!name || !url || !validHttpUrl(url)) {
                toast("Website ka naam aur valid URL enter karo.");
                return;
            }

            state.websites.push({
                id: id(),
                name,
                url,
                description,
                createdAt: new Date().toISOString()
            });

            if (!saveState()) return;

            renderWebsites();
            form.reset();
            log("Website added: " + name);
            toast("Website add ho gayi.");
        });
    }

    // ---------- USER MANAGEMENT ----------

    function renderUsers() {
        const list = $("#userList");
        if (!list) return;

        list.replaceChildren();

        state.users.forEach(user => {
            const card = document.createElement("article");
            card.className = "record-card";

            const details = document.createElement("div");
            details.className = "record-details";

            const name = document.createElement("strong");
            name.textContent = user.name;

            const email = document.createElement("p");
            email.textContent = user.email || "Email not configured";

            const role = document.createElement("span");
            role.className = "role-badge";
            role.textContent = user.role;

            details.append(name, email, role);
            card.appendChild(details);

            if (!user.locked) {
                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "btn btn-danger";
                remove.textContent = "Remove";

                remove.addEventListener("click", () => {
                    if (!confirm(`Remove ${user.name} from this preview?`)) {
                        return;
                    }

                    state.users = state.users.filter(
                        item => item.id !== user.id
                    );

                    saveState();
                    renderUsers();
                    log("Preview user removed: " + user.name);
                    toast("Preview user removed.");
                });

                card.appendChild(remove);
            } else {
                const protectedLabel = document.createElement("span");
                protectedLabel.textContent = "Protected role";
                card.appendChild(protectedLabel);
            }

            list.appendChild(card);
        });
    }

    function setupUserForm() {
        const form = $("#userForm");
        if (!form) return;

        form.addEventListener("submit", event => {
            event.preventDefault();

            const name = $("#userName", form)?.value.trim();
            const email = $("#userEmail", form)?.value.trim();
            const role = $("#userRole", form)?.value;

            if (!name || !email || !email.includes("@")) {
                toast("Valid name aur email enter karo.");
                return;
            }

            if (!["Developer", "Admin", "Editor", "Viewer"].includes(role)) {
                toast("Select kiya gaya role valid nahi hai.");
                return;
            }

            if (state.users.some(
                user => user.email.toLowerCase() === email.toLowerCase()
            )) {
                toast("Yeh email pehle se list mein hai.");
                return;
            }

            state.users.push({
                id: id(),
                name,
                email,
                role,
                locked: false
            });

            if (!saveState()) return;

            renderUsers();
            form.reset();
            log("Preview user added: " + name + " (" + role + ")");
            toast("Preview user add ho gaya.");
        });
    }

    // ---------- DATABASE MANAGEMENT ----------

    function createDatabaseInterface() {
        const section = $("#database");
        if (!section) return;

        if ($("#universalDatabaseManager")) return;

        const manager = document.createElement("div");
        manager.id = "universalDatabaseManager";
        manager.className = "database-manager";

        manager.innerHTML = `
            <div class="section-heading">
                <div>
                    <h3>Database Manager</h3>
                    <p>Add and configure database connections.</p>
                </div>
                <button type="button" id="toggleDatabaseForm"
                    class="btn btn-primary">+ Add Database</button>
            </div>

            <form id="universalDatabaseForm" hidden>
                <div class="form-grid">
                    <label>
                        Database Name
                        <input name="dbName" required maxlength="80"
                            placeholder="Main Website Database">
                    </label>

                    <label>
                        Database Type
                        <select name="dbType" required>
                            <option value="Google Sheets">Google Sheets + Apps Script</option>
                            <option value="Firebase">Firebase</option>
                            <option value="REST API">REST API</option>
                            <option value="JSON">JSON Endpoint</option>
                        </select>
                    </label>

                    <label class="full-width">
                        Connection / API URL
                        <input name="dbUrl" type="url"
                            placeholder="https://example.com/api"
                            autocomplete="url">
                    </label>

                    <label class="full-width">
                        Spreadsheet ID (optional)
                        <input name="spreadsheetId"
                            placeholder="Google Sheets file ID">
                    </label>

                    <label class="full-width">
                        Description
                        <textarea name="dbDescription" rows="3"
                            placeholder="What data will this database store?"></textarea>
                    </label>
                </div>

                <p class="form-note">
                    Do not enter passwords, private keys, access tokens,
                    or service-account credentials here.
                </p>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        Save Database
                    </button>
                    <button type="button" id="cancelDatabaseForm"
                        class="btn btn-secondary">Cancel</button>
                </div>
            </form>

            <div id="databaseList" class="record-list"></div>
        `;

        section.appendChild(manager);

        $("#toggleDatabaseForm", manager).addEventListener("click", () => {
            const form = $("#universalDatabaseForm", manager);
            form.hidden = !form.hidden;
        });

        $("#cancelDatabaseForm", manager).addEventListener("click", () => {
            $("#universalDatabaseForm", manager).reset();
            $("#universalDatabaseForm", manager).hidden = true;
        });

        $("#universalDatabaseForm", manager).addEventListener(
            "submit",
            saveDatabase
        );

        renderDatabases();
    }

    function saveDatabase(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);

        const name = safeText(data.get("dbName")).trim();
        const type = safeText(data.get("dbType"));
        const url = safeText(data.get("dbUrl")).trim();
        const spreadsheetId =
            safeText(data.get("spreadsheetId")).trim();
        const description =
            safeText(data.get("dbDescription")).trim();

        const allowedTypes = [
            "Google Sheets",
            "Firebase",
            "REST API",
            "JSON"
        ];

        if (!name || !allowedTypes.includes(type)) {
            toast("Database name aur type check karo.");
            return;
        }

        if (url && !validHttpUrl(url)) {
            toast("Connection URL valid HTTP/HTTPS URL hona chahiye.");
            return;
        }

        if (type === "Google Sheets" && !url && !spreadsheetId) {
            toast("Apps Script URL ya Spreadsheet ID add karo.");
            return;
        }

        const database = {
            id: id(),
            name,
            type,
            url,
            spreadsheetId,
            description,
            status: "Configured",
            createdAt: new Date().toISOString()
        };

        state.databases.push(database);

        if (!saveState()) {
            state.databases = state.databases.filter(
                item => item.id !== database.id
            );
            return;
        }

        renderDatabases();
        form.reset();
        form.hidden = true;

        log("Database configuration added: " + name);
        toast("Database configuration save ho gayi.");
    }

    function renderDatabases() {
        const list = $("#databaseList");
        if (!list) return;

        list.replaceChildren();

        if (!state.databases.length) {
            const empty = document.createElement("p");
            empty.textContent = "No database configurations added yet.";
            list.appendChild(empty);
            return;
        }

        state.databases.forEach(database => {
            const card = document.createElement("article");
            card.className = "record-card";

            const details = document.createElement("div");
            details.className = "record-details";

            const name = document.createElement("strong");
            name.textContent = database.name;

            const type = document.createElement("p");
            type.textContent = "Type: " + database.type;

            const status = document.createElement("p");
            status.textContent =
                "Configuration saved locally — connection not verified.";

            const description = document.createElement("p");
            description.textContent = database.description || "";

            details.append(name, type, status, description);

            if (database.url) {
                const link = document.createElement("a");
                link.href = database.url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.textContent = "Open endpoint";
                details.appendChild(link);
            }

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "btn btn-danger";
            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                if (!confirm(`Remove database "${database.name}"?`)) {
                    return;
                }

                state.databases = state.databases.filter(
                    item => item.id !== database.id
                );

                saveState();
                renderDatabases();
                log("Database configuration removed: " + database.name);
                toast("Database configuration removed.");
            });

            card.append(details, remove);
            list.appendChild(card);
        });
    }

    // ---------- UNIVERSAL CONFIGURATION ----------

    function setupConfigForm() {
        const form = $("#configForm");
        if (!form) return;

        const fields = [
            "platformName",
            "brandName",
            "primaryColor",
            "accentColor",
            "logoUrl",
            "navigation"
        ];

        fields.forEach(field => {
            const input = $(`[name="${field}"]`, form) || $("#" + field);

            if (input && state.config[field] !== undefined) {
                input.value = state.config[field];
            }
        });

        