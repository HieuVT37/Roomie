import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import UserSubscription from "../models/UserSubscription.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/token.js";
import { httpError, asyncHandler } from "../utils/httpError.js";
import { issueCode, verifyCode } from "../services/otpService.js";

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

// Tài khoản vừa đăng ký, chưa nhập mã xác thực email
const isUnverified = (u) => u.status === "pending" && !u.emailVerified;

// Đăng nhập: cấp token, đặt cookie, trả thông tin
async function startSession(res, user) {
  user.lastLoginAt = new Date();
  await user.save();
  const profile = await Profile.findOne({ userId: user._id });
  const token = signToken(user._id);
  setAuthCookie(res, token);
  return { user: publicUser(user), profile, token };
}

// Đăng ký: tạo tài khoản ở trạng thái chờ xác thực và gửi mã 6 số về email (chưa đăng nhập)
export const register = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });
  if (existing && !isUnverified(existing)) throw httpError(409, "Email đã được sử dụng");

  if (existing) {
    // Đăng ký lại một email chưa từng xác thực: cập nhật thông tin và gửi mã mới
    existing.passwordHash = passwordHash;
    await existing.save();
    await Profile.updateOne({ userId: existing._id }, { displayName });
  } else {
    const user = await User.create({ email, passwordHash, status: "pending", emailVerified: false });
    await Profile.create({ userId: user._id, displayName });
    await UserSubscription.create({ userId: user._id, planCode: "basic", status: "active", startedAt: new Date() });
  }

  await issueCode(email, "register");
  res.status(201).json({ needVerification: true, email, message: "Đã gửi mã xác thực tới email của bạn" });
});

// Nhập mã xác thực: kích hoạt tài khoản và đăng nhập luôn
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw httpError(400, "Mã đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã", "OTP_EXPIRED");
  if (!isUnverified(user)) throw httpError(400, "Email này đã được xác thực, bạn có thể đăng nhập", "ALREADY_VERIFIED");

  await verifyCode(email, "register", code);
  user.status = "active";
  user.emailVerified = true;
  res.json(await startSession(res, user));
});

// Gửi lại mã xác thực đăng ký. Luôn trả cùng một thông báo để không lộ email nào đã đăng ký.
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user && isUnverified(user)) await issueCode(email, "register");
  res.json({ message: "Nếu email đang chờ xác thực, mã mới đã được gửi" });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw httpError(401, "Email hoặc mật khẩu không đúng");

  // Đúng mật khẩu nhưng chưa xác thực email: gửi mã (nếu đã qua thời gian chờ) và yêu cầu xác thực
  if (isUnverified(user)) {
    await issueCode(email, "register").catch((err) => {
      if (err.code !== "OTP_COOLDOWN") throw err;
    });
    throw httpError(403, "Email chưa được xác thực. Chúng tôi đã gửi mã tới email của bạn.", "EMAIL_NOT_VERIFIED");
  }
  if (user.status !== "active") throw httpError(403, "Tài khoản đang bị khóa hoặc chưa kích hoạt");

  res.json(await startSession(res, user));
});

// Quên mật khẩu: gửi mã đặt lại. Báo thẳng khi email chưa có tài khoản (theo yêu cầu sản phẩm:
// ưu tiên rõ ràng cho người dùng; đánh đổi là người ngoài có thể dò được email nào đã đăng ký).
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw httpError(404, "Email này chưa có tài khoản Roomie", "EMAIL_NOT_FOUND");
  if (!(user.status === "active" || isUnverified(user))) {
    throw httpError(403, "Tài khoản này đang bị khóa, vui lòng liên hệ hỗ trợ", "ACCOUNT_LOCKED");
  }
  await issueCode(email, "reset");
  res.json({ message: "Đã gửi mã đặt lại mật khẩu tới email của bạn" });
});

// Đặt lại mật khẩu bằng mã email
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(user.status === "active" || isUnverified(user))) {
    throw httpError(400, "Mã đã hết hạn hoặc không tồn tại, vui lòng gửi lại mã", "OTP_EXPIRED");
  }

  await verifyCode(email, "reset", code);
  user.passwordHash = await bcrypt.hash(password, 10);
  user.passwordChangedAt = new Date(); // đăng xuất mọi phiên cũ
  if (isUnverified(user)) {
    // Nhận được mã qua email nghĩa là đã chứng minh sở hữu email
    user.status = "active";
    user.emailVerified = true;
  }
  await user.save();
  clearAuthCookie(res);
  res.json({ message: "Đã đặt lại mật khẩu, vui lòng đăng nhập bằng mật khẩu mới" });
});

// Đổi mật khẩu khi đang đăng nhập: cần mật khẩu hiện tại
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw httpError(400, "Mật khẩu hiện tại không đúng", "WRONG_PASSWORD");
  }
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw httpError(400, "Mật khẩu mới phải khác mật khẩu hiện tại");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordChangedAt = new Date(); // các thiết bị khác bị đăng xuất
  await user.save();

  // Cấp token mới để thiết bị đang dùng vẫn đăng nhập
  setAuthCookie(res, signToken(user._id));
  res.json({ message: "Đã đổi mật khẩu" });
});

export const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Đã đăng xuất" });
};

export const me = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  res.json({ user: publicUser(req.user), profile });
});
