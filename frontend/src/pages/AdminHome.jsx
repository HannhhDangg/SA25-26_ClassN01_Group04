import { useState, useEffect } from "react";
import { FaUsers, FaUserInjured } from "react-icons/fa";
import { io } from "socket.io-client"; // Import thư viện socket client

const AdminHome = () => {
  // --- 1. KHAI BÁO CÁC TRẠNG THÁI (STATE) ---
  const [stats, setStats] = useState({ totalUsers: 0, absentToday: 0 }); // Lưu số lượng thống kê
  const [user] = useState(JSON.parse(localStorage.getItem("user"))); // Lấy thông tin Admin đăng nhập
  const [notify, setNotify] = useState(""); // Lưu thông báo real-time khi có đơn mới

  // --- 2. HÀM LẤY DỮ LIỆU THỐNG KÊ TỪ API ---
  const fetchStats = () => {
    // Gọi API để lấy tổng nhân sự và số người vắng mặt [cite: 32]
    fetch("/api/leave_ser/stats/admin-summary")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Lỗi lấy thống kê:", err));
  };

  // --- 3. HIỆU ỨNG EFFECT ĐỂ KHỞI TẠO VÀ KẾT NỐI REAL-TIME ---
  useEffect(() => {
    // Gọi lấy dữ liệu lần đầu khi vừa mở trang [cite: 32]
    fetchStats();

    // Thiết lập kết nối Socket.io qua Nginx (Gateway cổng 80) [cite: 13, 59]
    const socket = io("/", {
      transports: ["websocket", "polling"],
      upgrade: true,
    });

    // Lắng nghe sự kiện kết nối thành công
    socket.on("connect", () => {
      console.log("🟢 AdminHome đã kết nối Socket thành công!");
    });

    // 🔥 XỬ LÝ REAL-TIME: Nhận thông báo khi nhân viên nộp đơn nghỉ [cite: 20, 31, 37]
    socket.on("new_leave_request", (data) => {
      console.log("🔔 Thông báo mới nhận được tại Home:", data);

      setNotify(data.message); // Hiển thị nội dung thông báo nổi (Toast)

      // Quan trọng: Cập nhật lại con số vắng mặt ngay lập tức mà không cần F5
      fetchStats();

      // Tự động ẩn thông báo sau 5 giây
      setTimeout(() => setNotify(""), 5000);
    });

    // Hàm dọn dẹp: Ngắt kết nối socket khi Admin chuyển sang trang khác [cite: 5]
    return () => socket.disconnect();
  }, []);

  // --- 4. GIAO DIỆN TRÌNH BÀY ---
  return (
    <div className="card" style={{ position: "relative" }}>
      {/* HIỂN THỊ THÔNG BÁO NỔI (TOAST) KHI CÓ SỰ KIỆN MỚI  */}
      {notify && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#10b981",
            color: "white",
            padding: "15px 25px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontWeight: "bold",
            zIndex: 9999,
            animation: "slideIn 0.5s ease",
          }}
        >
          🔔 {notify}
        </div>
      )}

      <h2 style={{ color: "var(--primary-color)" }}>
        Xin chào Quản trị viên, {user?.full_name || "Admin"}!
      </h2>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Đây là tình hình nhân sự hôm nay.
      </p>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Card 1: Tổng nhân sự */}
        <div
          style={{
            ...cardStyle,
            background: "#e0f2fe",
            border: "1px solid #bae6fd",
          }}
        >
          <div style={{ fontSize: "40px", color: "#0284c7" }}>
            <FaUsers />
          </div>
          <div>
            <div
              style={{ fontSize: "14px", color: "#0369a1", fontWeight: "bold" }}
            >
              TỔNG NHÂN SỰ
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#0c4a6e" }}
            >
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: "12px", color: "#0369a1" }}>
              Nhân viên trong hệ thống
            </div>
          </div>
        </div>

        {/* Card 2: Vắng mặt hôm nay  */}
        <div
          style={{
            ...cardStyle,
            background: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          <div style={{ fontSize: "40px", color: "#dc2626" }}>
            <FaUserInjured />
          </div>
          <div>
            <div
              style={{ fontSize: "14px", color: "#b91c1c", fontWeight: "bold" }}
            >
              VẮNG MẶT HÔM NAY
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "bold", color: "#7f1d1d" }}
            >
              {stats.absentToday}
            </div>
            <div style={{ fontSize: "12px", color: "#b91c1c" }}>
              Đang nghỉ phép
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation cho thông báo nổi */}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
};

// --- STYLE CHO CÁC CARD THỐNG KÊ ---
const cardStyle = {
  flex: 1,
  padding: "20px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  gap: "20px",
};

export default AdminHome;
