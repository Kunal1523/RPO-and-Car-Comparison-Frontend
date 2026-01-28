// import { Configuration, PopupRequest } from "@azure/msal-browser";

// export const msalConfig: Configuration = {
//     auth: {
//         clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "",
//         authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
//         redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || "http://localhost:5173",
//     },
//     cache: {
//         cacheLocation: "sessionStorage", // This configures where your cache will be stored
//         storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
//     },
// };

// export const loginRequest: PopupRequest = {
//     scopes: ["User.Read", "User.Read.All"],
// };

// export const getAllowedEmails = (): string[] => {
//     const envEmails = import.meta.env.VITE_ALLOWED_EMAILS || "";
//     return envEmails.split(',').map((e: string) => e.trim().toLowerCase()).filter((e: string) => e.length > 0);
// };

// export const MANUAL_LOGIN_EMAIL = "admin@gmail.com";
// export const MANUAL_LOGIN_PASSWORD = "admin123"; // Change this to your preferred password


export const BACKEND_BASE_URL =
    import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:8000";

export const MICROSOFT_LOGIN_URL = `${BACKEND_BASE_URL}/auth/microsoft/login`;

export const getAllowedEmails = (): string[] => {
    const envEmails = import.meta.env.VITE_ALLOWED_EMAILS || "";
    return envEmails
        .split(',')
        .map((e: string) => e.trim().toLowerCase())
        .filter((e: string) => e.length > 0);
};

// Manual login credentials (frontend only)
export const MANUAL_LOGIN_EMAIL = "admin@gmail.com";
export const MANUAL_LOGIN_PASSWORD = "admin123";
