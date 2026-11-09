import { PHOTOS } from "../config/photos";

// Khung chung cho Đăng nhập / Đăng ký: slogan phía trên, bên dưới là khung ảnh (màn hình lớn) + biểu mẫu
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto max-w-5xl">
      {/* Slogan Roomie: nằm ngoài khung, ngay dưới thanh menu */}
      <div className="enter mb-8 text-center sm:mb-10">
        <p className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-indigo-700 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-indigo-400">
            Roomie
          </span>
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Hợp gu trước, <span className="text-brand">hợp đồng sau</span>
        </p>
      </div>

      <div className="card grid overflow-hidden shadow-[var(--shadow-soft)] lg:grid-cols-2">
        <div className="photo kenburns relative hidden lg:block">
          <img
            src={PHOTOS.authRoom.src}
            srcSet={PHOTOS.authRoom.srcSet}
            sizes="40vw"
            width={PHOTOS.authRoom.width}
            height={PHOTOS.authRoom.height}
            alt={PHOTOS.authRoom.alt}
            className="absolute inset-0"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-950/70 to-transparent p-8 pt-24 text-white">
            <p className="text-2xl font-semibold leading-snug">Một người bạn mới,<br />Một căn phòng mới.</p>
          </div>
        </div>

        <div className="enter p-6 sm:p-10 lg:p-12">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
