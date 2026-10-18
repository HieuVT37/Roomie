export const CRITERIA_LABELS = {
  budget: "Ngân sách",
  location: "Khu vực",
  schedule: "Giờ giấc",
  cleanliness: "Sạch sẽ",
  lifestyle: "Lối sống",
  privacy: "Riêng tư",
  sharedSpace: "Không gian chung",
  interests: "Sở thích",
};

export const GENDER_LABELS = { male: "Nam", female: "Nữ", other: "Khác", private: "Không tiết lộ" };
export const GUEST_LABELS = { never: "Không bao giờ", rarely: "Hiếm khi", sometimes: "Thỉnh thoảng", often: "Thường xuyên" };
export const SHARED_LABELS = { minimal: "Tối thiểu", moderate: "Vừa phải", open: "Cởi mở" };
export const PATTERN_LABELS = { student: "Sinh viên", office: "Giờ hành chính", freelance: "Tự do", shift: "Theo ca" };

export const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

export const formatVND = (n) =>
  n === null || n === undefined ? "—" : new Intl.NumberFormat("vi-VN").format(n) + "đ";

export const formatBudget = (b) => (b ? `${formatVND(b.min)} - ${formatVND(b.max)}` : "Đã ẩn");

export const ROOM_TYPE_LABELS = {
  single: "Phòng đơn",
  shared: "Ở ghép",
  studio: "Studio",
  apartment: "Căn hộ mini",
  house: "Nhà nguyên căn",
};

export const LISTING_STATUS_LABELS = { available: "Còn trống", rented: "Đã cho thuê", stopped: "Tạm ngưng" };
export const MODERATION_LABELS = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Bị từ chối" };

export const AMENITIES = [
  "Điều hòa", "Nóng lạnh", "Giường", "Tủ quần áo", "Tủ lạnh", "Máy giặt", "Máy giặt chung",
  "Bếp", "Bếp riêng", "Wifi", "Chỗ để xe", "Thang máy", "Bảo vệ 24/7", "Ban công",
];

export const PASS_TYPE_LABELS = { room: "Pass phòng", item: "Pass đồ" };
export const PASS_STATUS_LABELS = { active: "Đang đăng", completed: "Đã hoàn tất", closed: "Đã đóng" };
export const ITEM_CATEGORY_LABELS = {
  furniture: "Nội thất",
  appliance: "Đồ điện",
  kitchen: "Đồ bếp",
  storage: "Đồ lưu trữ",
  other: "Khác",
};
export const CONDITION_LABELS = { new: "Mới", like_new: "Như mới", good: "Tốt", fair: "Khá", old: "Cũ" };
export const DEAL_LABELS = { sell: "Bán", give_away: "Cho tặng", exchange: "Trao đổi" };

export const passPriceText = (p) => {
  if (p.type === "item" && (p.itemInfo?.dealType === "give_away" || p.price === 0)) return "Cho tặng";
  if (p.price === null || p.price === undefined) return "Thỏa thuận";
  return formatVND(p.price) + (p.type === "room" ? "/tháng" : "");
};

export const PLAN_LABELS = { basic: "Basic", plus: "Plus", pro: "Pro" };
export const PLAN_RANK = { basic: 0, plus: 1, pro: 2 };
export const PAYMENT_METHOD_LABELS = {
  momo: "Ví MoMo",
  vnpay: "VNPay",
  zalopay: "ZaloPay",
  bank_transfer: "Chuyển khoản ngân hàng",
  card: "Thẻ tín dụng / ghi nợ",
};
export const PAYMENT_STATUS_LABELS = {
  pending: "Đang chờ",
  success: "Thành công",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

export const REPORT_REASON_LABELS = {
  spam: "Spam / quảng cáo",
  scam: "Lừa đảo",
  fake_info: "Thông tin sai sự thật",
  harassment: "Quấy rối",
  inappropriate: "Nội dung không phù hợp",
  duplicate: "Đăng trùng lặp",
  other: "Lý do khác",
};
export const REPORT_STATUS_LABELS = {
  open: "Chờ xử lý",
  reviewing: "Đang xem xét",
  resolved: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};
export const REPORT_TARGET_LABELS = {
  user: "Người dùng",
  accommodation: "Tin cho thuê",
  pass: "Bài Pass",
  message: "Tin nhắn",
};
export const USER_STATUS_LABELS = {
  active: "Hoạt động",
  suspended: "Tạm khóa",
  banned: "Bị cấm",
  pending: "Chờ kích hoạt",
};
export const FAQ_CATEGORY_LABELS = {
  account: "Tài khoản",
  matching: "Matching",
  accommodation: "Tìm phòng",
  pass: "Pass",
  subscription: "Gói dịch vụ",
  safety: "An toàn",
};