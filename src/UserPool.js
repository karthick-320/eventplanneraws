// src/UserPool.js
import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.REACT_APP_USER_POOL_ID,
  ClientId: process.env.REACT_APP_CLIENT_ID,
};

if (!poolData.UserPoolId || !poolData.ClientId) {
  throw new Error("Both UserPoolId and ClientId are required.");
}

const userPool = new CognitoUserPool(poolData);
export default userPool;
