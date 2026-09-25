import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { message, Spin } from "antd";

function OAuthCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const handledRef = useRef(false);

    useEffect(() => {
        if (handledRef.current) return;
        handledRef.current = true;

        const error = searchParams.get("error");
        const token = searchParams.get("token");
        const userRaw = searchParams.get("user");

        if (error) {
            message.error(error);
            navigate("/login", { replace: true });
            return;
        }

        if (!token || !userRaw) {
            message.error("OAuth sign-in failed. Please try again.");
            navigate("/login", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(userRaw);
            localStorage.setItem("authToken", token);
            localStorage.setItem("currentUser", JSON.stringify(user));
            message.success("Login Successful!");

            if (user.userType === "Admin") {
                navigate("/admin/", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (err) {
            console.error(err);
            message.error("Could not complete OAuth sign-in.");
            navigate("/login", { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div
            style={{
                minHeight: "60vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Spin size="large" tip="Completing sign-in..." />
        </div>
    );
}

export default OAuthCallbackPage;
