import { useState, useEffect, useRef } from "react";
import { FiPhone, FiMessageCircle, FiFacebook, FiVolume2, FiVolumeX, FiChevronUp, FiChevronDown } from "react-icons/fi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { supabase } from "./lib/supabase";
import msgIllust from "./assets/message-app-illustration-svg-download-png-9910075.webp";
import callIllust from "./assets/boy-calling-on-mobile-phone-illustration-svg-download-png-6368375.webp";

// ============================================================
//  CONFIG – Chỉnh toàn bộ nội dung tại đây, không cần sửa code
// ============================================================
const CONFIG = {
  // ─── Countdown ───────────────────────────────────────────
  targetDate: "2026-06-16T09:00:00",

  // ─── Sự kiện & Địa điểm ──────────────────────────────────
  eventName: "GRADUATION PARTY",
  locationName: "XEM DẪN ĐƯỜNG",
  address: "120 Hoàng Minh Thảo, Hòa Khánh, Đà Nẵng",
  mapLink: "https://maps.app.goo.gl/grmMacdM3TXAi5m47",

  // ─── Lịch ────────────────────────────────────────────────
  calendarYear: 2026,
  calendarMonth: 5, // 0-indexed: 5 = tháng 6

  // ─── Lời chúc mẫu ────────────────────────────────────────
  defaultMessages: [
    { name: "Ngô Thị Minh", message: "Chúc mừng tốt nghiệp nhé! 🎓" },
    { name: "Ngô Tâm", message: "Tự hào về bạn ❤️" },
    { name: "Ngô Minh", message: "Cố gắng nhé! Tương lai rực rỡ đang chờ 🌟" },
  ],

  // ─── Footer ──────────────────────────────────────────────
  footerMessage:
    "Thank you! Những cố gắng của em/con/mình hôm nay cũng là nhờ có sự đồng hành của mọi người...",

  // ─── Liên hệ ─────────────────────────────────────────────
  contact: {
    phone: "0901162489",
    zalo: "https://zalo.me/0901162489",
    facebook: "https://fb.com/kien15112004",
    note: "Có khó khăn gì thì nhắn tin hoặc gọi điện cho mình nhé ❤️",
  },

  // ─── Tên chủ nhân ────────────────────────────────────────
  hostName: "Phạm Huỳnh Trung Kiên",

  // ─── Hero ────────────────────────────────────────────────
  heroImage: "/hero-card.png",

  // ─── Style chữ tên khách ─────────────────────────────────
  guestNameStyle: {
    color: "#0c2862",
    backgroundColor: "rgba(255,254,252,0.88)",
    padding: "0.6rem 2rem",
    borderRadius: "8px",
    border: "1.5px solid rgba(12,40,98,0.15)",
    /* Không dùng letterSpacing trên tiếng Việt – dễ vỡ dấu tổ hợp */
  },

  // ─── Tên mặc định khi không có param ─────────────────────
  defaultGuestName: "Bạn yêu quý",

  // ─── URL param key ────────────────────────────────────────
  guestParamKey: "guest",
};

// ── Brand colors ──────────────────────────────────────────────
const BRAND = {
  bg: "#fffefc",
  primary: "#0c2862",
  border: "rgba(12,40,98,0.18)",
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Đọc tên khách từ URL param, decode tiếng Việt (xử lý cả double-encode) */
function getGuestName() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(CONFIG.guestParamKey);
  if (!raw) return CONFIG.defaultGuestName;
  try {
    // Thử decode lần đầu
    const once = decodeURIComponent(raw);
    // Nếu vẫn còn ký tự % → double-encoded, decode lần 2
    try {
      return once.includes("%") ? decodeURIComponent(once) : once;
    } catch {
      return once;
    }
  } catch {
    return raw;
  }
}

/** Tạo ma trận lịch (hàng đầu = T2..CN) */
function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  // chuyển về 0=T2: (0→6, 1→0, 2→1,...)
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** Tính thời gian còn lại đến targetDate */
function calcCountdown(target) {
  const diff = new Date(target) - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Ô đếm ngược */
function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="text-4xl sm:text-5xl font-bold tabular-nums w-20 sm:w-24 py-4 rounded-2xl flex items-center justify-center"
        style={{
          color: BRAND.primary,
          background: "rgba(12,40,98,0.07)",
          border: `1.5px solid ${BRAND.border}`,
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <span
        className="mt-2 text-xs tracking-widest uppercase"
        style={{ color: BRAND.primary, opacity: 0.6 }}
      >
        {label}
      </span>
    </div>
  );
}

/** Format ngày giờ từ ISO string sang tiếng Việt dễ đọc */
function formatEventDate(isoString) {
  const d = new Date(isoString);
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = days[d.getDay()];
  const date = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${dayName}, ${date}/${month}/${year} lúc ${hours}:${minutes}`;
}

/** Section 1 – Hero */
function HeroSection({ guestName }) {
  const scrollToCalendar = () => {
    document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 snap-start"
      style={{ background: BRAND.bg }}
    >
      <div className="flex flex-col items-center text-center gap-4 sm:gap-6 w-full max-w-xl px-4 mt-[-5vh]">
        {/* Ảnh mũ tốt nghiệp */}
        <img
          src="/graduation-hat-illustration-svg-download-png-11710569.webp"
          alt="Graduation hat"
          className="w-32 h-32 sm:w-48 sm:h-48 object-contain mb-1 sm:mb-3"
          style={{ opacity: 0.85 }}
        />

        {/* Dòng 1: Please join us... */}
        <p
          className="text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.25em] uppercase px-2 leading-relaxed"
          style={{
            color: BRAND.primary,
            opacity: 0.55,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}
        >
          Please join us to celebrate the graduation of
        </p>

        {/* Dòng 2: Tên chủ nhân */}
        <h2
          className="text-lg sm:text-2xl md:text-3xl font-bold tracking-[0.15em] sm:tracking-widest uppercase mt-1 sm:mt-0"
          style={{
            color: BRAND.primary,
            fontFamily: "'Playfair Display', Georgia, serif",
            opacity: 0.85,
          }}
        >
          {CONFIG.hostName}
        </h2>

        {/* Đường kẻ mảnh */}
        <div
          className="w-12 sm:w-16 h-px my-1 sm:my-0"
          style={{ background: BRAND.primary, opacity: 0.2 }}
        />

        {/* Dòng 3: Tên khách mời – to nhất */}
        <div
          className="text-[2.5rem] leading-none sm:text-5xl md:text-6xl font-bold italic py-2 sm:py-0"
          style={{
            ...CONFIG.guestNameStyle,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {guestName}
        </div>

        {/* Đường kẻ mảnh */}
        <div
          className="w-12 sm:w-16 h-px my-1 sm:my-0"
          style={{ background: BRAND.primary, opacity: 0.2 }}
        />

        {/* Dòng 4: We would be honored */}
        <p
          className="text-[10px] sm:text-sm tracking-[0.1em] sm:tracking-[0.2em] uppercase mt-1 sm:mt-0 px-4 leading-relaxed"
          style={{
            color: BRAND.primary,
            opacity: 0.5,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}
        >
          We would be honored to have you there
        </p>
      </div>

      {/* Nút cuộn xuống */}
      <button
        onClick={scrollToCalendar}
        aria-label="Cuộn xuống"
        className="absolute bottom-10 flex flex-col items-center gap-1"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <span
          className="text-xs tracking-widest uppercase"
          style={{ color: BRAND.primary, opacity: 0.4 }}
        >
          Xem thêm
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="animate-bounce"
          style={{ color: BRAND.primary, opacity: 0.45 }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </section>
  );
}

/** Section 2 – Lịch & Countdown */
function CalendarSection() {
  const [countdown, setCountdown] = useState(calcCountdown(CONFIG.targetDate));

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(calcCountdown(CONFIG.targetDate));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const weeks = buildCalendar(CONFIG.calendarYear, CONFIG.calendarMonth);
  const dayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Xác định ngày target để highlight
  const target = new Date(CONFIG.targetDate);
  const isTargetMonth =
    target.getFullYear() === CONFIG.calendarYear &&
    target.getMonth() === CONFIG.calendarMonth;
  const targetDay = isTargetMonth ? target.getDate() : null;

  const monthName = new Date(CONFIG.calendarYear, CONFIG.calendarMonth, 1)
    .toLocaleString("vi-VN", { month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <section
      id="calendar"
      className="px-4 snap-start"
      style={{ background: BRAND.bg }}
    >
      <div className="max-w-2xl mx-auto w-full py-4 sm:py-12">
        {/* Title */}
        <h2
          className="text-center text-3xl sm:text-4xl font-bold mb-2 tracking-wide"
          style={{
            color: BRAND.primary,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Thời gian
        </h2>
        <div
          className="mx-auto mb-6 h-px w-24"
          style={{ background: BRAND.primary, opacity: 0.3 }}
        />

        {/* Ngày giờ sự kiện */}
        <p
          className="text-center text-sm sm:text-base mb-8 tracking-wide"
          style={{
            color: BRAND.primary,
            opacity: 0.65,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
          }}
        >
          {formatEventDate(CONFIG.targetDate)}
        </p>

        {/* Calendar */}
        <div
          className="rounded-2xl p-4 sm:p-6 mb-8 sm:mb-10 overflow-x-auto"
          style={{ border: `1.5px solid ${BRAND.border}` }}
        >
          <p
            className="text-center text-sm font-semibold tracking-widest mb-4"
            style={{ color: BRAND.primary, opacity: 0.55 }}
          >
            {monthName}
          </p>
          <table className="w-full min-w-[280px] border-collapse">
            <thead>
              <tr>
                {dayLabels.map((d) => (
                  <th
                    key={d}
                    className="pb-3 text-center text-xs font-semibold tracking-wider"
                    style={{ color: BRAND.primary, opacity: 0.45 }}
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {Array.from({ length: 7 }).map((_, di) => {
                    const day = week[di] ?? null;
                    const isTarget = day === targetDay;
                    return (
                      <td
                        key={di}
                        className="text-center py-2 text-sm"
                        style={{ color: BRAND.primary }}
                      >
                        {day && (
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${isTarget
                              ? "font-bold text-white"
                              : "hover:opacity-70"
                              }`}
                            style={
                              isTarget ? { background: BRAND.primary } : {}
                            }
                          >
                            {day}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Countdown */}
        <p
          className="text-center text-xs tracking-widest uppercase mb-6"
          style={{ color: BRAND.primary, opacity: 0.5 }}
        >
          Đếm ngược đến sự kiện
        </p>
        <div className="flex justify-center gap-4 sm:gap-6">
          <CountdownUnit value={countdown.days} label="Ngày" />
          <CountdownUnit value={countdown.hours} label="Giờ" />
          <CountdownUnit value={countdown.minutes} label="Phút" />
          <CountdownUnit value={countdown.seconds} label="Giây" />
        </div>
      </div>
    </section>
  );
}

/** Section 3 – Địa điểm */
function LocationSection() {
  const [rideKey, setRideKey] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const container = document.querySelector(".app-container");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Tăng key mỗi lần section vào viewport → reset animation
          setRideKey((k) => k + 1);
        }
      },
      { root: container, threshold: 0.3 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="location"
      className="px-4 snap-start relative"
      style={{ background: "#f5f0e8" }}
    >
      <div className="max-w-2xl mx-auto w-full py-4 sm:py-8 z-10 relative">
        <h2
          className="text-center text-3xl sm:text-4xl font-bold mb-2 tracking-wide"
          style={{
            color: BRAND.primary,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Địa điểm
        </h2>
        <div
          className="mx-auto mb-6 h-px w-24"
          style={{ background: BRAND.primary, opacity: 0.3 }}
        />

        <div
          className="rounded-2xl p-4 sm:p-6"
          style={{
            background: BRAND.bg,
            border: `1.5px solid ${BRAND.border}`,
          }}
        >
          {/* Location name */}
          <p
            className="text-2xl font-bold mb-1"
            style={{
              color: BRAND.primary,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {CONFIG.locationName}
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: BRAND.primary, opacity: 0.65 }}
          >
            {CONFIG.address}
          </p>

          {/* Google Maps embed */}
          <div
            className="w-full rounded-xl overflow-hidden mb-4 sm:mb-5 h-[220px] sm:h-[280px]"
            style={{
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 8px 24px rgba(12, 40, 98, 0.08)"
            }}
          >
            <iframe
              title="Bản đồ địa điểm"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${encodeURIComponent(CONFIG.address)}&output=embed`}
            />
          </div>

          {/* Nút xem bản đồ lớn */}
          <a
            href={CONFIG.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold tracking-wide"
            style={{
              color: BRAND.bg,
              background: BRAND.primary,
              border: `1.5px solid ${BRAND.primary}`,
            }}
          >
            Xem bản đồ
          </a>
        </div>
      </div>

      {/* Motorcycle animation – Chạy xuôi ở dưới */}
      <div
        className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none"
        style={{ height: 160 }}
      >
        {rideKey > 0 && (
          <div
            key={rideKey}
            className="motorcycle-ride"
            style={{ display: "inline-block", width: 220 }}
          >
            <DotLottieReact
              src="/motor cycle.lottie"
              autoplay
              loop={false}
              style={{ width: 220, height: 160 }}
            />
          </div>
        )}
      </div>

      {/* Motorcycle animation – Chạy ngược ở trên */}
      <div
        className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none"
        style={{ height: 160 }}
      >
        {rideKey > 0 && (
          <div
            key={`top-${rideKey}`}
            className="motorcycle-ride"
            style={{
              display: "inline-block",
              width: 220,
              animationDirection: "reverse"
            }}
          >
            <div style={{ transform: "scaleX(-1)" }}>
              <DotLottieReact
                src="/motor cycle.lottie"
                autoplay
                loop={false}
                style={{ width: 220, height: 160 }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function GuestbookSection() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial messages and set up realtime subscription
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        setMessages(data.length > 0 ? data : CONFIG.defaultMessages);
      }
      setIsLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('guestbook_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guestbook'
        },
        (payload) => {
          setMessages((currentMessages) => [payload.new, ...currentMessages]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const newMessage = { name: name.trim(), message: message.trim() };

    // Insert into Supabase (optimistic update is handled by the subscription, but we wait for insert)
    const { error } = await supabase
      .from('guestbook')
      .insert([newMessage]);

    if (error) {
      console.error("Error inserting message:", error);
      return;
    }

    setName("");
    setMessage("");
    setSubmitted(true);
    setShowConfetti(true);
    setTimeout(() => setSubmitted(false), 3000);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <section
      id="guestbook"
      className="px-4 snap-start relative"
      style={{ background: BRAND.bg }}
    >
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <DotLottieReact
            src="/e8f8e440-1170-11ee-9699-cfd4f80c32a4.lottie"
            autoplay
            loop={false}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}
      {/* Layout: flex column – toàn bộ nằm trong 100vh */}
      <div className="max-w-2xl mx-auto w-full h-full flex flex-col py-6 sm:py-8">
        {/* ── Tiêu đề (thu nhỏ trên mobile) ── */}
        <h2
          className="text-center text-2xl sm:text-3xl font-bold mb-1 tracking-wide flex-shrink-0"
          style={{
            color: BRAND.primary,
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Gửi lời chúc
        </h2>
        <div
          className="mx-auto mb-4 h-px w-16 flex-shrink-0"
          style={{ background: BRAND.primary, opacity: 0.3 }}
        />

        {/* ── Form (cố định, không co) ── */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-4 mb-4 space-y-3 flex-shrink-0"
          style={{ border: `1.5px solid ${BRAND.border}` }}
        >
          {/* Tên + lời chúc nằm ngang trên sm+ để tiết kiệm chiều cao */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label
                htmlFor="guestbook-name"
                className="block text-xs tracking-widest uppercase mb-1 font-semibold"
                style={{ color: BRAND.primary, opacity: 0.6 }}
              >
                Tên
              </label>
              <input
                id="guestbook-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn ạ"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  color: BRAND.primary,
                  background: "rgba(12,40,98,0.04)",
                  border: `1.5px solid ${BRAND.border}`,
                }}
              />
            </div>
            <div className="flex-[2]">
              <label
                htmlFor="guestbook-msg"
                className="block text-xs tracking-widest uppercase mb-1 font-semibold"
                style={{ color: BRAND.primary, opacity: 0.6 }}
              >
                Lời chúc
              </label>
              <input
                id="guestbook-msg"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Viết lời chúc..."
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  color: BRAND.primary,
                  background: "rgba(12,40,98,0.04)",
                  border: `1.5px solid ${BRAND.border}`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-full font-semibold text-sm tracking-wide flex-shrink-0"
              style={{ background: BRAND.primary, color: BRAND.bg }}
            >
              Gửi lời chúc
            </button>

          </div>
        </form>

        {/* ── Danh sách lời chúc – scroll nội bộ, không mở rộng section ── */}
        <div
          className="flex-1 overflow-y-auto space-y-3 pr-1"
          style={{ minHeight: 0 }} /* quan trọng: cho phép flex child co lại */
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className="guestbook-card rounded-lg px-4 py-3 flex gap-3 items-start"
              style={{
                background: i === 0 ? "rgba(12,40,98,0.05)" : "transparent",
                border: `1.5px solid ${BRAND.border}`,
              }}
            >
              {/* Avatar */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                style={{ background: BRAND.primary, color: BRAND.bg }}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="font-semibold text-sm mb-0.5"
                  style={{ color: BRAND.primary }}
                >
                  {m.name}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: BRAND.primary, opacity: 0.75 }}
                >
                  {m.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 5 – Liên hệ */
function ContactSection() {
  const items = [
    {
      icon: <FiPhone size={20} color={BRAND.primary} />,
      label: "Điện thoại",
      text: CONFIG.contact.phone,
      href: `tel:${CONFIG.contact.phone}`,
    },
    {
      icon: <FiMessageCircle size={20} color={BRAND.primary} />,
      label: "Zalo",
      text: "Nhắn tin Zalo",
      href: CONFIG.contact.zalo,
    },
    {
      icon: <FiFacebook size={20} color={BRAND.primary} />,
      label: "Facebook",
      text: "Nhắn tin Messenger",
      href: CONFIG.contact.facebook,
    },
  ];

  return (
    <section
      id="contact"
      className="snap-start flex flex-col relative"
      style={{ background: "#f5f0e8" }}
    >
      {/* Layout: 3 cột ở desktop, 1 cột ở mobile */}
      <div className="px-4 max-w-3xl mx-auto w-full flex-1 flex items-center justify-center">
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 py-6 sm:py-8 mt-4 md:mt-0">

          {/* Ảnh trái – ẩn trên mobile */}
          <div className="hidden md:flex flex-1 justify-end">
            <img
              src={msgIllust}
              alt="Message illustration"
              style={{ width: 200, height: 200, objectFit: "contain" }}
            />
          </div>

          {/* Nội dung chính */}
          <div className="flex flex-col items-center text-center w-full md:w-auto md:flex-none" style={{ maxWidth: 400 }}>
            {/* Tiêu đề */}
            <h2
              className="text-3xl sm:text-4xl font-bold mb-2 tracking-wide"
              style={{
                color: BRAND.primary,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              Liên hệ
            </h2>
            <div
              className="mx-auto mb-6 h-px w-24"
              style={{ background: BRAND.primary, opacity: 0.3 }}
            />

            {/* 3 ô liên hệ */}
            <div className="flex flex-col gap-3 w-full">
              {items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 px-5 py-3.5 transition-opacity hover:opacity-70"
                  style={{
                    background: "rgba(255,254,252,0.88)",
                    border: `1.5px solid ${BRAND.border}`,
                    borderRadius: "12px",
                    textDecoration: "none",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(12,40,98,0.07)" }}
                  >
                    {item.icon}
                  </div>
                  {/* Text */}
                  <div className="flex flex-col items-start">
                    <span
                      className="text-xs tracking-widest uppercase font-semibold mb-0.5"
                      style={{ color: BRAND.primary, opacity: 0.5 }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="text-base font-semibold"
                      style={{ color: BRAND.primary }}
                    >
                      {item.text}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Ghi chú */}
            <p
              className="mt-5 text-sm"
              style={{ color: BRAND.primary, opacity: 0.45 }}
            >
              {CONFIG.contact.note}
            </p>

            {/* Ảnh dưới – chỉ hiện trên mobile */}
            <div className="flex md:hidden mt-4">
              <img
                src={callIllust}
                alt="Calling illustration"
                style={{ width: 140, height: 140, objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Ảnh phải – ẩn trên mobile */}
          <div className="hidden md:flex flex-1 justify-start">
            <img
              src={callIllust}
              alt="Calling illustration"
              style={{ width: 200, height: 200, objectFit: "contain" }}
            />
          </div>

        </div>
      </div>

      {/* Footer nhúng thẳng vào cuối section Liên hệ */}
      <footer
        className="w-full text-center py-6 sm:py-8 px-4 flex-shrink-0"
        style={{ background: BRAND.primary }}
      >
        <p
          className="text-sm sm:text-base font-medium leading-relaxed max-w-xl mx-auto"
          style={{ color: BRAND.bg, opacity: 0.9 }}
        >
          {CONFIG.footerMessage}
        </p>
      </footer>
    </section>
  );
}



// ─────────────────────────────────────────────────────────────
// Navigation Dots
// ─────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "calendar", label: "Thời gian" },
  { id: "location", label: "Địa điểm" },
  { id: "guestbook", label: "Lời chúc" },
  { id: "contact", label: "Liên hệ" },
];

function NavDots() {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const container = document.querySelector(".app-container");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      {
        root: container,
        threshold: 0.5, // section phải chiếm >50% container mới tính active
      }
    );

    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    // Ẩn trên màn hình nhỏ hơn md
    <div
      className="hidden md:flex flex-col items-center gap-3"
      style={{
        position: "fixed",
        right: 20,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 100,
      }}
    >
      {NAV_SECTIONS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            title={label}
            onClick={() => handleClick(id)}
            style={{
              width: isActive ? 10 : 8,
              height: isActive ? 10 : 8,
              borderRadius: "50%",
              background: BRAND.primary,
              opacity: isActive ? 1 : 0.3,
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.25s ease",
              boxShadow: isActive
                ? `0 0 0 3px rgba(12,40,98,0.15)`
                : "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.opacity = "0.6";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.opacity = "0.3";
            }}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Music Player
// ─────────────────────────────────────────────────────────────
function MusicPlayer() {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const attemptedAutoplay = useRef(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // Track active section (for mobile nav)
  useEffect(() => {
    const container = document.querySelector(".app-container");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = NAV_SECTIONS.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) setActiveSectionIdx(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (idx) => {
    const clamped = Math.max(0, Math.min(NAV_SECTIONS.length - 1, idx));
    const container = document.querySelector(".app-container");
    const el = document.getElementById(NAV_SECTIONS[clamped].id);
    if (el && container) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (attemptedAutoplay.current) return;
    attemptedAutoplay.current = true;

    const audio = audioRef.current;
    if (!audio) return;

    // Set volume default & start time
    audio.volume = 0.3;
    audio.currentTime = 38;

    // Cố gắng autoplay
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Autoplay prevented:", err);
          setAutoplayBlocked(true);
        });
    }
  }, []);

  useEffect(() => {
    if (!autoplayBlocked) return;

    const handleGlobalClick = () => {
      const audio = audioRef.current;
      if (audio && audio.paused) {
        audio.play().then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        }).catch(() => { });
      }
      document.removeEventListener("click", handleGlobalClick);
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [autoplayBlocked]);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      }).catch(console.error);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/vo-tay.mp3" loop autoPlay />

      {/* Mobile nav: nút lên/xuống – chỉ hiện trên mobile */}
      <div
        className="md:hidden fixed right-5 z-50 flex flex-col gap-2"
        style={{ bottom: "calc(20px + 40px + 12px)" }} /* ngay trên nút loa */
      >
        <button
          onClick={() => scrollToSection(activeSectionIdx - 1)}
          disabled={activeSectionIdx === 0}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 hover:opacity-80 active:scale-90 active:shadow-sm disabled:opacity-25"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(4px)",
            border: `1px solid ${BRAND.border}`,
            color: BRAND.primary,
          }}
          title="Section trước"
        >
          <FiChevronUp size={18} />
        </button>
        <button
          onClick={() => scrollToSection(activeSectionIdx + 1)}
          disabled={activeSectionIdx === NAV_SECTIONS.length - 1}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 hover:opacity-80 active:scale-90 active:shadow-sm disabled:opacity-25"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(4px)",
            border: `1px solid ${BRAND.border}`,
            color: BRAND.primary,
          }}
          title="Section tiếp theo"
        >
          <FiChevronDown size={18} />
        </button>
      </div>

      {/* Nút loa – hiện trên mọi màn hình */}
      <button
        onClick={togglePlay}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-80"
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(4px)",
          border: `1px solid ${BRAND.border}`,
          color: BRAND.primary
        }}
        title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
      >
        {isPlaying ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────
export default function App() {
  const guestName = getGuestName();

  // ─── Scroll-reveal: fade-up khi section vào viewport ───────
  useEffect(() => {
    // Hero (section đầu) hiển thị ngay khi load
    const hero = document.getElementById("hero");
    if (hero) hero.classList.add("visible");

    // Dùng .app-container làm root – đúng container scroll, không phải viewport của html
    const container = document.querySelector(".app-container");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // Chỉ chạy 1 lần
          }
        });
      },
      {
        root: container, // ← quan trọng: observe theo scroll container
        threshold: 0.12, // Kích hoạt khi 12% section vào view
      },
    );

    // Observe tất cả section trừ hero (đã visible rồi)
    document.querySelectorAll("section:not(#hero)").forEach((s) => {
      observer.observe(s);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <NavDots />
      <div
        className="app-container h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth"
        style={{
          fontFamily:
            "'Inter', 'Playfair Display', Georgia, system-ui, sans-serif",
        }}
      >
        {/* Section 1 – Hero */}
        <HeroSection guestName={guestName} />

        {/* Section 2 – Lịch & Countdown */}
        <CalendarSection />

        {/* Section 3 – Địa điểm */}
        <LocationSection />

        {/* Section 4 – Guest book */}
        <GuestbookSection />

        {/* Section 5 – Liên hệ & Footer */}
        <ContactSection />

        {/* Nhạc nền */}
        <MusicPlayer />
      </div>
    </>
  );
}
