import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import UserSubscription from "../models/UserSubscription.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/token.js";
import { httpError, asyncHandler } from "../utils/httpError.js";

const publicUser = (u) => ({
  id: u._id,
  email: u.email,
  role: u.role,
  status: u.status,
  currentPlan: u.currentPlan,
  isLandlord: u.isLandlord,
  emailVerified: u.emailVerified,
  settings: u.settings,
});

export const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;

  if (await User.exists({ email })) throw httpError(409, "Email đã được sử dụng");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash });
  const profile = await Profile.create({ userId: user._id, displayName });
  await UserSubscription.create({
    userId: user._id,
    planCode: "basic",
    status: "active",
    startedAt: new Date(),
  });

  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user), profile, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw httpError(401, "Email hoặc mật khẩu không đúng");
  if (user.status !== "active") throw httpError(403, "Tài khoản đang bị khóa hoặc chưa kích hoạt");

  user.lastLoginAt = new Date();
  await user.save();

  const profile = await Profile.findOne({ userId: user._id });
  const token = signToken(user._id);
  setAuthCookie(res, token);
  res.json({ user: publicUser(user), profile, token });
});

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Đã đăng xuất" });
};

export const me = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  res.json({ user: publicUser(req.user), profile });
});