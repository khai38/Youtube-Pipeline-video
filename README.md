# AI YouTube Creator - Hệ Thống Tạo Video Tự Động Với Gemini AI

**AI YouTube Creator** là một nền tảng Web-app hiện đại, cho phép người dùng biến ý tưởng hoặc tóm tắt sách thành video chuyên nghiệp (YouTube/TikTok) chỉ trong vài phút. Hệ thống tận dụng tối đa sức mạnh của mô hình Gemini 3 và công nghệ xử lý video trực tiếp trên trình duyệt.

## 🚀 Chức Năng Chính

### 1. Sáng Tạo Nội Dung Thông Minh
- **Chế độ Chủ đề (Topic-to-Script):** Tự động phân tích chủ đề hoặc tóm tắt sách để viết kịch bản chi tiết, phân cảnh và gợi ý từ khóa hình ảnh.
- **Chế độ Kịch bản (Raw Script):** Xử lý và cấu trúc lại kịch bản có sẵn của người dùng thành định dạng chuẩn hóa cho AI xử lý.
- **Đa định dạng:** Hỗ trợ xuất video ngang (16:9 cho YouTube) và video dọc (9:16 cho TikTok/Reels/Shorts).

### 2. Hệ Thống Giọng Đọc Cao Cấp (Gemini TTS)
- **Công nghệ Chirp 2.5:** Sử dụng các giọng đọc AI thế hệ mới nhất với chất lượng HD và Studio.
- **Tùy chỉnh sắc thái:** Cho phép áp dụng các Style cảm xúc như: *Truyền cảm hứng, Trầm ấm, Điện ảnh, Chữa lành, Podcast...*
- **Cá nhân hóa:** Điều chỉnh tốc độ (Speed) và tông giọng (Pitch) linh hoạt cho từng nhân vật trong kịch bản.

### 3. Xử Lý Tài Nguyên Hình Ảnh & Video
- **Tìm kiếm tự động:** Tích hợp API từ **Pixabay** và **Pexels** để tìm kiếm stock video phù hợp với nội dung từng cảnh.
- **Xử lý song song (Paid Tier Optimization):** Khởi tạo đồng thời tất cả các cảnh (hình ảnh + âm thanh) để giảm thiểu tối đa thời gian chờ đợi.
- **Chỉnh sửa linh hoạt:** Cho phép người dùng thay đổi từ khóa (Prompt) và tìm kiếm lại tài nguyên cho từng phân đoạn cụ thể.

### 4. Trình Xem Trước & Biên Tập Trực Tuyến
- **Real-time Preview:** Xem trước video với hiệu ứng chuyển cảnh mượt mà.
- **Karaoke Subtitles:** Phụ đề tự động chạy chữ theo giọng nói (progressive highlighting).
- **Safe Zone Layout:** Phụ đề được tự động chia 2 dòng và đặt vào "vùng an toàn", đảm bảo không bị che bởi UI của mạng xã hội.
- **Audio Management:** Cho phép tải lên nhạc nền (Background Music) và điều chỉnh âm lượng hòa âm với giọng đọc.

### 5. Xuất Bản & Lưu Trữ
- **FFmpeg.wasm:** Ghép nối video, audio và render phụ đề trực tiếp trên trình duyệt người dùng mà không cần server trung gian.
- **YouTube Integration:** Hỗ trợ quy trình kết nối Google OAuth và tải video trực tiếp lên kênh YouTube.
- **Lịch sử dự án:** Lưu trữ các video đã tạo vào bộ nhớ cục bộ để quản lý và xem lại.

---

## 🛠 Công Nghệ Sử Dụng

### Core Frameworks
- **React 19:** Thư viện giao diện người dùng mạnh mẽ nhất.
- **TypeScript:** Đảm bảo tính nhất quán và an toàn về dữ liệu.
- **Tailwind CSS:** Thiết kế giao diện hiện đại, responsive và tối ưu trải nghiệm người dùng (UX).

### AI & Cloud Services
- **@google/genai:** SDK chính thức để tương tác với mô hình Gemini.
- **Gemini 3 Pro Preview:** Xử lý logic kịch bản và suy luận hình ảnh.
- **Gemini 2.5 Flash Native Audio:** Công nghệ TTS (Text-to-Speech) tạo giọng nói tự nhiên nhất hiện nay.

### Video & Audio Processing
- **FFmpeg.wasm (@ffmpeg/ffmpeg):** Bộ thư viện xử lý video (convert, muxing) mạnh mẽ nhất thế giới chạy trên WebAssembly.
- **Web Audio API:** Xử lý phân tích sóng âm (AnalyserNode) và hòa âm thời gian thực.
- **Canvas API:** Render phụ đề, hiệu ứng thị giác và overlay video.

### Integration APIs
- **Pixabay & Pexels API:** Nguồn cung cấp stock video chất lượng cao (HD/4K).
- **Google YouTube Data API v3:** Hỗ trợ xuất bản nội dung lên YouTube.

---

## 📈 Quy Trình Hoạt Động (Workflow)

1. **Input:** Người dùng nhập chủ đề/tóm tắt sách.
2. **AI Logic:** Gemini Pro tạo kịch bản JSON (Title, Scenes, English Prompt).
3. **Voice Prep:** Người dùng chọn giọng đọc và sắc thái cho từng nhân vật.
4. **Asset Mining:** Hệ thống tự động tìm video từ Pixabay/Pexels và gen audio từ Gemini TTS cùng lúc.
5. **Editing:** Người dùng kiểm tra, thêm nhạc nền, chỉnh âm lượng.
6. **Rendering:** FFmpeg.wasm tổng hợp các thành phần thành file `.mp4`.
7. **Publishing:** Tải về máy hoặc upload lên YouTube.

---

*Phát triển bởi Senior Frontend Engineer - Tối ưu cho hiệu suất và trải nghiệm AI hàng đầu.*