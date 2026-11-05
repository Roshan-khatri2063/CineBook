import { asyncHandler } from "../utils/asyncHandler.js";
import { loginUser, registerCustomer } from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = await registerCustomer(req.body);
  res
    .status(201)
    .json({ success: true, message: "Account created successfully", data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  res
    .status(200)
    .json({ success: true, message: "Logged in successfully", data });
});

// JWTs are stateless, so the server has nothing to delete.
// The client removes its stored token; this endpoint confirms the request
// was authenticated (and is the place to add token revocation later).
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});
