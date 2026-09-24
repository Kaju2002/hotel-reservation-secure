import React, { useState } from "react";
import Icon from "@mdi/react";
import { mdiEye, mdiEyeOff } from "@mdi/js";
import Navbar from "./../components/CommonComponents/Navbar";
import axios from "axios";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

const GoogleIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path
            d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
            fill="#4285F4"
        />
        <path
            d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
            fill="#34A853"
        />
        <path
            d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
            fill="#FBBC05"
        />
        <path
            d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
            fill="#EB4335"
        />
    </svg>
);

const GitHubIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577 0-.285-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.76-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.382 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.838 1.234 1.91 1.234 3.22 0 4.61-2.804 5.624-5.476 5.92.43.37.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.297 24 12 24 5.37 18.63 0 12 0z" />
    </svg>
);

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:5000/api/user/login",
                { email, password }
            );

            if (response.data.message === "Login successful") {
                message.success("Login Successful!");

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(response.data.user)
                );
                if (response.data.token) {
                    localStorage.setItem("authToken", response.data.token);
                }

                if (response.data.user.userType === "Admin") {
                    navigate("/admin/");
                } else {
                    navigate("/");
                }
            } else {
                message.error("Login Failed. Check your credentials.");
            }
        } catch (error) {
            if (error.response && error.response.data) {
                message.error(error.response.data.message);
            } else {
                message.error("Something went wrong. Please try again.");
            }
        }
    };

    const startGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/google";
    };

    const startGitHubLogin = () => {
        window.location.href = "http://localhost:5000/api/auth/github";
    };

    return (
        <>
            <Navbar />
            <div className="sg_main_container_login_page">
                <div className="sg_login_background_main">
                    <div className="sg_login_main_container">
                        <form onSubmit={handleLogin}>
                            <div className="sg_login_title_main_container">
                                <h2 className="sg_logon_title">Sign In</h2>
                                <p className="sg_login_subtitle">
                                    Enter your email and password to sign in!
                                </p>
                            </div>

                            <div className="sg_oauth_buttons_row">
                                <button
                                    type="button"
                                    className="sg_oauth_btn"
                                    onClick={startGoogleLogin}
                                >
                                    <GoogleIcon />
                                    <span>Sign in with Google</span>
                                </button>
                                <button
                                    type="button"
                                    className="sg_oauth_btn"
                                    onClick={startGitHubLogin}
                                >
                                    <GitHubIcon />
                                    <span>Sign in with GitHub</span>
                                </button>
                            </div>

                            <div className="sg_oauth_divider">
                                <span>Or</span>
                            </div>

                            <div className="sg_input_filed_main">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="sg_login_email_input"
                                />
                                <div className="">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                        className="sg_login_password_input"
                                    />
                                    <span
                                        className="sg_custom_password_toggle"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        <Icon
                                            path={
                                                showPassword
                                                    ? mdiEyeOff
                                                    : mdiEye
                                            }
                                            size={1}
                                            color="black"
                                            title={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        />
                                    </span>
                                </div>
                            </div>
                            <div className="sg_login_remember_me">
                                <label>
                                    <input
                                        type="checkbox"
                                        style={{ marginRight: 5 }}
                                    />
                                    Keep me logged in
                                </label>
                                <a
                                    href="/"
                                    className="sg_login_forgot_password"
                                >
                                    Forgot Password?
                                </a>
                            </div>
                            <button
                                type="submit"
                                className="sg_login_main_button"
                            >
                                Sign In
                            </button>
                            <p className="sg_signup_txt_main">
                                Don't have an account?{" "}
                                <a href="/signup" className="sg_signup_link">
                                    Sign Up
                                </a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginPage;
