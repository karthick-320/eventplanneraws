import React from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify"; // make sure to install this
import "react-toastify/dist/ReactToastify.css";

const PrivateRoute = ({ children }) => {
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    toast.error("Login first");
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;
