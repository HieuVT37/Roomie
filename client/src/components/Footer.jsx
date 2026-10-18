import { Link } from "react-router-dom";
import { COMPANY } from "../config/company";

const EXPLORE = [
  { to: "/matching", label: "Tìm bạn cùng phòng" },
  { to: "/accommodation", label: "Tìm phòng trọ" },
  { to: "/pass", label: "Pass phòng & đồ dùng" },
  { to: "/pricing", label: "Gói dịch vụ" },
];

const SUPPORT = [
  { to: "/help", label: "Câu hỏi thường gặp" },
  { to: "/pricing", label: "Bảng giá" },
];

// Mọi khối dùng chung các lớp này để khoảng cách luôn đều nhau
const container = "mx-auto w-full max-w-[75rem] px-6";
const listClass = "space-y-1 text-sm leading-6";
const linkClass = "text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400";
const titleClass = "mb-4 text-sm font-semibold uppercase leading-6 tracking-wide";

function Column({ title, children }) {
  return (
    <div>
      <h3 className={titleClass}>{title}</h3>
      {children}
    </div>
  );
}

// Biểu tượng có chiều rộng cố định để chữ ở các dòng luôn thẳng cột
function ContactRow({ icon, children }) {
  return (
    <li className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
      <span aria-hidden="true" className="w-5 shrink-0 text-center">{icon}</span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export default function Footer() {
  const socials = COMPANY.socials.filter((s) => s.url);

  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-950 max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]" >
      <div className={`${container} grid gap-10 py-5 sm:grid-cols-2 lg:grid-cols-4`}>
        <div>
          <Link to="/" className="mb-4 block text-xl font-bold leading-6 text-indigo-600 dark:text-indigo-400">
            {COMPANY.name}
          </Link>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">{COMPANY.tagline}</p>
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-6">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className={linkClass}>{s.label}</a>
              ))}
            </div>
          )}
        </div>

        <Column title="Khám phá">
          <ul className={listClass}>
            {EXPLORE.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </Column>

        <Column title="Hỗ trợ">
          <ul className={listClass}>
            {SUPPORT.map((l) => (
              <li key={l.label}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </Column>

        <Column title="Liên hệ">
          <ul className={listClass}>
            <ContactRow icon="📍">{COMPANY.address}</ContactRow>
            <ContactRow icon="📞">
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className={linkClass}>{COMPANY.phone}</a>
            </ContactRow>
            <ContactRow icon="✉️">
              <a href={`mailto:${COMPANY.email}`} className={linkClass}>{COMPANY.email}</a>
            </ContactRow>
            <ContactRow icon="🕒">{COMPANY.workingHours}</ContactRow>
          </ul>
        </Column>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700">
        <div className={`${container} flex flex-wrap items-center justify-between gap-2 py-4 text-xs leading-5 text-gray-500 dark:text-gray-400`}>
          <p>© {new Date().getFullYear()} {COMPANY.legalName}. Bảo lưu mọi quyền.</p>
          <p>Mã số thuế: {COMPANY.taxCode}</p>
        </div>
      </div>
    </footer>
  );
}