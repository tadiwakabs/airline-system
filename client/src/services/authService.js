import api from "./api";

// Registration
export async function registerUser(userData) {
    const response = await api.post("/auth/register", userData);
    return response.data;
}

// Login
export async function loginUser(credentials) {
    const response = await api.post("/auth/login", credentials);
    return response.data;
}

// GET profile
export async function getMyProfile() {
    const response = await api.get("/user/me");
    return response.data;
}

// UPDATE profile
export async function updateMyProfile(profileData) {
    const response = await api.put("/user/me", profileData);
    return response.data;
}

// UPDATE profile: password
export async function changeMyPassword(passwordData) {
    const response = await api.put("/user/change-password", passwordData);
    return response.data;
}
