const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

// ===== BIẾN TOÀN CỤC =====
let lastData = null;
let history = []; // lưu {phien, du_doan, du_doan_nguoc, ket_qua, danh_gia}
let tongDung = 0;
let tongSai = 0;

/* ===== HÀM ĐẢO DỰ ĐOÁN ===== */
function reversePrediction(prediction) {
  if (!prediction || typeof prediction !== "string") return "";
  const p = prediction.trim();

  if (p === "Tài") return "Xỉu";
  if (p === "Xỉu") return "Tài";
  if (p === "Chẵn") return "Lẻ";
  if (p === "Lẻ") return "Chẵn";
  return p;
}

/* ===== GỌI API GỐC ===== */
async function fetchSicboSunWin() {
  try {
    const res = await axios.get("https://sicokk.onrender.com/predict");
    const data = res.data;

    // Chuẩn hóa dữ liệu
    const current = {
      Phien: data.Phien,
      Xuc_xac_1: data.Xuc_xac_1,
      Xuc_xac_2: data.Xuc_xac_2,
      Xuc_xac_3: data.Xuc_xac_3,
      Tong: data.Tong,
      Ket_qua: data.Ket_qua,
      du_doan_goc: data.du_doan,
      dudoan_vi_goc: data.dudoan_vi,
      du_doan: reversePrediction(data.du_doan),       // ✅ đảo cho API chính
      dudoan_vi: reversePrediction(data.dudoan_vi),   // ✅ đảo cho API chính
      do_tin_cay: data.do_tin_cay,
      phien_hien_tai: data.phien_hien_tai,
      Ghi_chu: data.Ghi_chu,
      id: "@LostmyS4lf"
    };

    // Nếu có phiên mới
    if (!lastData || current.Phien !== lastData.Phien) {
      if (lastData) {
        // Đánh giá đúng/sai dự đoán của phiên trước (dựa theo dự đoán ngược)
        const danh_gia =
          lastData.du_doan === current.Ket_qua ? "ĐÚNG" : "SAI";

        if (danh_gia === "ĐÚNG") tongDung++;
        else tongSai++;

        history.unshift({
          phien: lastData.Phien,
          du_doan_goc: lastData.du_doan_goc,
          dudoan_vi_goc: lastData.dudoan_vi_goc,
          du_doan: lastData.du_doan,               // đảo
          dudoan_vi: lastData.dudoan_vi,           // đảo
          ket_qua: current.Ket_qua,
          danh_gia
        });

        if (history.length > 50) history.pop();
      }
      lastData = current;
    }
  } catch (err) {
    console.error("❌ Lỗi fetch API SicboSunWin:", err.message);
  }
}

// Gọi API liên tục 5s/lần
setInterval(fetchSicboSunWin, 5000);
fetchSicboSunWin();

/* ===== ROUTES ===== */

// API cho frontend (luôn trả dự đoán ngược)
app.get("/sicbosunwin/apisex", (req, res) => {
  if (!lastData) return res.json({ error: "Chưa có dữ liệu" });

  res.json({
    Phien: lastData.Phien,
    Xuc_xac_1: lastData.Xuc_xac_1,
    Xuc_xac_2: lastData.Xuc_xac_2,
    Xuc_xac_3: lastData.Xuc_xac_3,
    Tong: lastData.Tong,
    Ket_qua: lastData.Ket_qua,
    du_doan: lastData.du_doan,         // ✅ dự đoán ngược
    dudoan_vi: lastData.dudoan_vi,     // ✅ dự đoán ngược
    do_tin_cay: lastData.do_tin_cay,
    tong_dung: tongDung,
    tong_sai: tongSai
  });
});

// API trả về lịch sử (có cả gốc + ngược)
app.get("/sicbosunwin/historysex", (req, res) => {
  res.json(history);
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server SicboSunWin chạy tại http://localhost:${PORT}`);
});
