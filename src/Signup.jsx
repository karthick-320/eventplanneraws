import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "./UserPool";
import "./Signup.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [signupError, setSignupError] = useState("");

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    setSignupError("");

    UserPool.signUp(email, password, [], null, (err, data) => {
      if (err) {
        if (err.code === "UsernameExistsException") {
          // User exists – check if unconfirmed
          const user = new CognitoUser({ Username: email, Pool: UserPool });

          user.resendConfirmationCode((resendErr, result) => {
            if (resendErr) {
              setSignupError(
                "This email is already registered and verified. Please log in."
              );
            } else {
              // User is unverified – show OTP screen
              setShowConfirmation(true);
              setIsExistingUser(true);
            }
          });
        } else {
          setSignupError(err.message || "Signup failed");
        }
      } else {
        // New user – show OTP screen
        setShowConfirmation(true);
      }
    });
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    setSignupError("");

    const user = new CognitoUser({ Username: email, Pool: UserPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        setSignupError(err.message || "OTP verification failed");
      } else {
        navigate("/EventPlannerForm");
      }
    });
  };

  return (
    <div className="signup_wrapper">
      <div className="signup_container">
        <h1 className="signup_heading">
          {showConfirmation ? "Verify your email" : "Create your account"}
        </h1>
        <p className="signup_subheading">
          {showConfirmation
            ? "Enter the verification code sent to your email."
            : "Set your credentials to continue"}
        </p>

        <form
          onSubmit={showConfirmation ? handleConfirm : handleSignup}
          className="signup_form"
        >
          {!showConfirmation ? (
            <>
              <input
                type="email"
                className="signup_input"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSignupError("");
                }}
                required
              />
              <input
                type="password"
                className="signup_input"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSignupError("");
                }}
                required
              />
            </>
          ) : (
            <>
              {/* <label className="signup_label">Verification Code</label> */}
              <input
                type="text"
                  className="signup_input"
                  placeholder="Code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setSignupError("");
                }}
                required
              />
            </>
          )}

          {signupError && <p className="signup_error">{signupError}</p>}

          <button className="signup_button" type="submit">
            Continue
          </button>
        </form>

        <p className="login_text">
          Already have an account?{" "}
          <Link to="/" className="login_link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
