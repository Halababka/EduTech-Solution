export const useAuth = async (oldToken = null) => {
    const auth = useState("auth", () => ({
        user: null,
        token: "",
    }));

    if (!auth.value.user || oldToken) {
        auth.value = await initAuth(oldToken);
    }

    return auth;
};

export const initAuth = async (oldToken = null) => {
    const auth = {
        user: null,
        token: "",
    };

    if (oldToken === "none") {
        return auth;
    }

    const authCookie = useCookie("token", {
        maxAge: 60 * 60 * 24 * 30,
        // sameSite: "lax",
        // secure: true,
        httpOnly: false,
        path: "/",
    });

    if (oldToken) {
        authCookie.value = oldToken;
    }

    if (authCookie.value) {
        auth.token = authCookie.value;
    }

    return auth;
};