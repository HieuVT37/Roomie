import { Link } from "react-router-dom";
import { COMPANY } from "../config/company";
import Icon from "./Icon";

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
const container = "container-page";
const listClass = "space-y-2 text-sm leading-6";
const linkClass = "link";
const titleClass = "mb-4 text-sm font-semibold leading-6 text-ink";

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
    <li className="flex items-start gap-3 text-muted">
      <span className="mt-[3px] text-indigo-500">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

export default function Footer() {
  const socials = COMPANY.socials.filter((s) => s.url);

  return (
    <footer className="mt-16 border-t border-line bg-surface max-md:pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className={`${container} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]`}>
        <div>
          <Link to="/" className="mb-4 flex w-fit items-center gap-2 text-lg font-semibold leading-6 tracking-tight text-ink">
            <img src="/roomie-logo.svg" alt="" width="28" height="28" className="rounded-[0.5rem]" />
            {COMPANY.name}
          </Link>
          <p className="max-w-xs text-sm leading-6 text-muted">{COMPANY.tagline}</p>
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
            <ContactRow icon="pin">{COMPANY.address}</ContactRow>
            <ContactRow icon="phone">
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className={linkClass}>{COMPANY.phone}</a>
            </ContactRow>
            <ContactRow icon="mail">
              <a href={`mailto:${COMPANY.email}`} className={linkClass}>{COMPANY.email}</a>
            </ContactRow>
            <ContactRow icon="clock">{COMPANY.workingHours}</ContactRow>
          </ul>
        </Column>
      </div>

      <div className="border-t border-line">
        <div className={`${container} flex flex-wrap items-center justify-between gap-2 py-5 text-xs leading-5 text-muted`}>
          <p>© {new Date().getFullYear()} {COMPANY.legalName}. Bảo lưu mọi quyền.</p>
          <p>Mã số thuế: {COMPANY.taxCode}</p>
        </div>
      </div>
    </footer>
  );
}
