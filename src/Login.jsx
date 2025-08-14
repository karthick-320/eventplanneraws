// src/Login.jsx
import React, { useEffect, useState } from "react";
import { CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import UserPool from "./UserPool";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const alreadyLoggedIn = localStorage.getItem("userEmail");
    if (alreadyLoggedIn) {
      navigate("/EventPlannerForm");
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess: (data) => {
       
      
        const user = data.getAccessToken().decodePayload();
        const emailFromToken = user.email;
      
        localStorage.setItem("userEmail", emailFromToken); 
        localStorage.setItem("userId", email); 
        navigate("/EventPlannerForm");
      },
      onFailure: (err) => {
      
        if (err.code === "UserNotFoundException") {
          setErrorMsg("Account not found. Please check your email.");
        } else if (err.code === "NotAuthorizedException") {
          setErrorMsg("Incorrect password. Please try again.");
        } else if (err.code === "UserNotConfirmedException") {
          setErrorMsg("Account not verified. Please check your email.");
        } else {
          setErrorMsg("Login failed. Please try again.");
        }
      },
    });
  };

  const handleForgotPassword = () => {
    setErrorMsg("");
    if (!email) {
      setErrorMsg("Please enter your email to reset password.");
      return;
    }

    const user = new CognitoUser({ Username: email, Pool: UserPool });

    user.forgotPassword({
      onSuccess: (data) => {
        
        setShowForgot(true);
        setResetMsg("OTP sent to your email.");
      },
      onFailure: (err) => {
   
        setErrorMsg(err.message || "Failed to send reset code.");
      },
    });
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    const user = new CognitoUser({ Username: email, Pool: UserPool });

    user.confirmPassword(resetCode, newPassword, {
      onSuccess: () => {
        setResetMsg("Password reset successfully. Please log in.");
        setShowForgot(false);
        setPassword("");
      },
      onFailure: (err) => {
        
        setErrorMsg(err.message || "Reset failed.");
      },
    });
  };

  return (
    <div className="login_wrapper">
      <div className="login_card">
        <h2 className="login_title">Welcome back</h2>
        <p className="login_subheading">
          Enter your credentials to access your account
        </p>

        {!showForgot ? (
          <form onSubmit={handleLogin} className="login_form">
            <div className="login_input_group">
              <input
                type="email"
                value={email}
                placeholder="Email Address"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMsg("");
                }}
                className="login_input"
                required
              />
            </div>

            <div className="login_input_group">
              <input
                type="password"
                value={password}
                placeholder="Password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                className="login_input"
                required
              />
            </div>
            <div className="login_link_row">
              <button
                type="button"
                className="login_link_button"
                onClick={handleForgotPassword}
              >
                Forgot Password?
              </button>
            </div>
            {errorMsg && <p className="login_error">{errorMsg}</p>}
            <button type="submit" className="login_button">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="login_form">
            <input
              type="text"
              className="login_input"
              placeholder="OTP Code"
              value={resetCode}
              onChange={(e) => {
                setResetCode(e.target.value);
                setErrorMsg("");
              }}
              required
              style={{ marginBottom: "20px" }}
            />
            <input
              type="password"
              className="login_input"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrorMsg("");
              }}
              required
            />
            {errorMsg && <p className="login_error" style={{marginBottom:'0px'}}>{errorMsg}</p>}
            {/* {resetMsg && <p className="login_success">{resetMsg}</p>} */}

              <button type="submit" className="login_button" style={{
              marginTop:'30px'
            }}>
              Reset Password
            </button>
            <button
              type="button"
              className="login_link_button"
                onClick={() => setShowForgot(false)}
                style={{textAlign:'center',right:'0px',marginTop:'20px'}}
            >
              Back to Login
            </button>
          </form>
        )}

        {!showForgot && (
          <p className="login_text">
            Don't have an account?{" "}
            <Link to="/signup" className="login_link">
              Sign up
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
