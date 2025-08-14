// src/Confirm.jsx
import React, { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "./UserPool";

function Confirm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    user.confirmRegistration(code, true, (err, result) => {
      if (err) {
       
        alert(err.message || "Confirmation failed");
      } else {

        alert("✅ Email confirmed! You can now log in.");
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Confirm Email</h2>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email used during signup"
        required
      />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter OTP code from email"
        required
      />
      <button type="submit">Confirm</button>
    </form>
  );
}

export default Confirm;
