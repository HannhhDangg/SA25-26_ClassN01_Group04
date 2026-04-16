import { useState, useEffect, useCallback } from "react";
import { FaCalendarCheck, FaChartPie } from "react-icons/fa";
// --- 1. THÊM IMPORT ---
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const EmployeeHome = () => {
  const [user] = useState(JSON.parse(localStorage.getItem("user")));
  const [leaveCount, setLeaveCount] = useState(0);
  const [balance, setBalance] = useState({ used: 0, max: 12, remaining: 12 });

  // --- 2. TÁCH HÀM FETCH DATA RA ĐỂ DÙNG LẠI ---
  const fetchData = useCallback(() => {
    // Lấy thống kê hôm nay
    fetch("/api/leave_ser/stats/today")
      .then((res) => res.json())
      .then((data) => setLeaveCount(data.count))
      .catch((err) => console.error(err));

    // Lấy quỹ phép cá nhân
    if (user?.id) {
      fetch(`/api/leave_ser/balance/${user.id}`)
        .then((res) => res.json())
        .then((data) => setBalance(data))
        .catch((err) => console.error(err));
    }
  }, [user]);

  // Gọi fetch lần đầu
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 3. THÊM SOCKET ĐỂ NHẬN THÔNG BÁO ---
  useEffect(() => {
    const socket = io("/", {
      transports: ["websocket", "polling"],
      upgrade: true,
    });

    socket.on("leave_status_update", (data) => {
      // Kiểm tra đúng người nhận
      if (data.target_user_id == user.id) {
        console.log("🔔 Trang chủ nhận thông báo:", data);

        // Hiện Toastify
        if (data.status === "APPROVED") {
          toast.success(data.message);
        } else if (data.status === "REJECTED") {
          toast.error(data.message);
        } else {
          toast.info(data.message);
        }

        // 🔥 QUAN TRỌNG: Tải lại dữ liệu để cập nhật số dư phép ngay lập tức
        fetchData();
      }
    });

    return () => socket.disconnect();
  }, [user.id, fetchData]);

  // --- PHẦN GIAO DIỆN GIỮ NGUYÊN ---
  const percentage = Math.min((balance.used / balance.max) * 100, 100);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="card" style={{ textAlign: "center", padding: "40px" }}>
        <h1 style={{ color: "var(--primary-color)", marginBottom: "10px" }}>
          Xin chào, {user?.full_name || user?.username}!
        </h1>
        <p style={{ color: "var(--text-light)", fontSize: "18px" }}>
          Chúc bạn một ngày làm việc hiệu quả!
        </p>

        <div
          style={{
            margin: "40px 0",
            display: "flex",
            justifyContent: "center",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          {/* CARD 1: THỐNG KÊ HÔM NAY */}
          <div style={cardStyle}>
            <FaCalendarCheck size={40} color="#0284c7" />
            <h3 style={{ margin: "10px 0", color: "#0369a1" }}>
              Số người nghỉ hôm nay
            </h3>
            <div
              style={{ fontSize: "40px", fontWeight: "bold", color: "#0284c7" }}
            >
              {leaveCount}{" "}
              <span style={{ fontSize: "18px", color: "#7dd3fc" }}>/ 5</span>
            </div>
            {leaveCount >= 5 ? (
              <div style={{ color: "#ef4444", fontWeight: "bold" }}>
                ⚠️ Đã đầy lịch!
              </div>
            ) : (
              <div style={{ color: "#16a34a", fontWeight: "bold" }}>
                ✅ Có thể xin nghỉ
              </div>
            )}
          </div>

          {/* CARD 2: QUỸ PHÉP CÁ NHÂN */}
          <div
            style={{
              ...cardStyle,
              border: "1px solid #d8b4fe",
              background: "#f3e8ff",
            }}
          >
            <FaChartPie size={40} color="#9333ea" />
            <h3 style={{ margin: "10px 0", color: "#7e22ce" }}>
              Quỹ phép năm nay
            </h3>

            <div
              style={{ fontSize: "40px", fontWeight: "bold", color: "#9333ea" }}
            >
              {balance.used}{" "}
              <span style={{ fontSize: "18px", color: "#d8b4fe" }}>
                / {balance.max}
              </span>
            </div>

            {/* Thanh tiến độ */}
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#e9d5ff",
                borderRadius: "4px",
                marginTop: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  background: percentage >= 100 ? "#ef4444" : "#a855f7",
                  transition: "width 0.5s ease",
                }}
              ></div>
            </div>

            <div
              style={{ marginTop: "5px", fontSize: "14px", color: "#6b21a8" }}
            >
              Còn lại: <b>{balance.remaining}</b> ngày
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const cardStyle = {
  background: "#f0f9ff",
  padding: "20px",
  borderRadius: "16px",
  width: "300px",
  border: "1px solid #bae6fd",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
};

export default EmployeeHome;
