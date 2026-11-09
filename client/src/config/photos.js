// Ảnh minh họa tạm thời (Wikimedia Commons, có giấy phép) — thay bằng ảnh thật của Roomie khi có.
const R = "/assets/img/rooms";

export const PHOTOS = {
  // Hero trang chủ: phòng khách căn hộ
  // Ảnh của Roomie (chungcu.jpg): phòng khách liền bếp căn hộ chung cư
  livingRoom: {
    src: `${R}/chungcu.jpg`,
    srcSet: `${R}/chungcu.jpg 1500w`,
    width: 1500, height: 1071,
    alt: "Phòng khách căn hộ chung cư liền bếp, sofa trắng, bàn kính tròn và sàn gỗ",
  },
  // Thẻ "Tìm phòng trọ": bếp và bàn ăn
  kitchen: {
    src: `${R}/photo-f195256265-960.jpg`,
    srcSet: `${R}/photo-f195256265-500.jpg 500w, ${R}/photo-f195256265-960.jpg 960w, ${R}/photo-f195256265.jpg 1280w`,
    width: 960, height: 640,
    alt: "Bếp trắng hiện đại liền khu bàn ăn trong căn hộ sáng sủa",
  },
  // Thẻ "Pass đồ": đồ dùng (giữ ảnh đồ vật, không phải ảnh phòng)
  lampBooks: {
    src: "/assets/img/photo-f131376731-960.jpg",
    srcSet: "/assets/img/photo-f131376731-500.jpg 500w, /assets/img/photo-f131376731-960.jpg 960w",
    width: 960, height: 1440,
    alt: "Đèn bàn kim loại bên chồng sách cũ",
  },
  // Lời kêu gọi cuối trang: phòng ngủ hai giường
  bedroom: {
    src: `${R}/photo-f195256275-960.jpg`,
    srcSet: `${R}/photo-f195256275-500.jpg 500w, ${R}/photo-f195256275-960.jpg 960w, ${R}/photo-f195256275.jpg 1280w`,
    width: 960, height: 640,
    alt: "Phòng ngủ hai giường đơn trong căn hộ hiện đại",
  },
  // Trang đăng nhập / đăng ký: phòng ngủ có bàn học
  // Ảnh của Roomie (noithat.jpg): phòng khách căn hộ cao cấp
  authRoom: {
    src: `${R}/noithat.jpg`,
    srcSet: `${R}/noithat.jpg 796w`,
    width: 796, height: 550,
    alt: "Phòng khách căn hộ cao cấp với sàn đá, rèm cao và ghế bọc nhung",
  },
};

// Một dòng ghi công tác giả ảnh (bắt buộc theo giấy phép CC BY / CC BY-SA), hiển thị ở chân trang
export const PHOTO_CREDITS =
  "Ảnh minh họa: Shixart1985 (CC BY 2.0), Aaaatu (CC BY-SA 4.0), Paikan06 (CC0), Chính quyền USVI (public domain), freestocks.org (CC0), qua Wikimedia Commons.";
