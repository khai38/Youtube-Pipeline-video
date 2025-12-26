# AI YouTube Creator - Hệ Thống Tạo Video Tự Động Với Gemini AI

**AI YouTube Creator** là một nền tảng Web-app hiện đại, cho phép biến ý tưởng hoặc tóm tắt sách thành video chuyên nghiệp (YouTube/TikTok) chỉ trong vài phút. 

> **Dự án được xây dựng và orchestration bởi Google AI Studio.**

---

## 1. Thông tin dự án
- **Tên dự án:** AI YouTube Video Creator
- **Mô tả:** Ứng dụng AI tích hợp quy trình từ viết kịch bản, tạo giọng đọc HD đến tìm kiếm và ghép nối video stock hoàn toàn tự động.
- **Mục tiêu:** Tối ưu hóa thời gian sản xuất nội dung cho các Content Creator, đặc biệt là mảng video động lực và tóm tắt sách.
- **Đối tượng sử dụng:** YouTuber, TikToker, người làm Affiliate Marketing, giáo viên và nhà sáng tạo nội dung số.

---

## 2. Kiến trúc tổng thể (Architecture Overview)

Hệ thống hoạt động theo mô hình **Client-side Orchestration**, nơi trình duyệt đóng vai trò là trung tâm điều phối và xử lý dữ liệu nặng:

```ascii
[ Ý tưởng/Tóm tắt ] 
       |
       v
[ Gemini 3 Pro ] ----> [ Kịch bản JSON & Image Prompts ]
       |
       +-------------> [ Gemini 2.5 Native Audio (TTS Chirp 3 HD) ]
       |
       +-------------> [ Mining API: Pixabay / Pexels ]
       v
[ Browser UI ] <----- [ Pre-fetching & local Blob Storage ]
       |
       v
[ FFmpeg.wasm ] ----> [ Render Video + Audio + Subtitles ]
       |
       v
[ Video Hoàn Chỉnh (.mp4) ]
```

- **TTS (Giọng đọc):** Sử dụng `gemini-2.5-flash-preview-tts` để tạo giọng nói HD có cảm xúc và nhịp thở tự nhiên.
- **AI Research Agent:** Phân tích nội dung để tìm kiếm video phù hợp từ Pixabay và Pexels.
- **Inspirational Prioritization:** Hệ thống ưu tiên các cảnh quay hùng vĩ (thiên nhiên, vũ trụ) cho các video mang tính truyền cảm hứng.
- **Client-side Rendering:** Sử dụng WebAssembly (FFmpeg.wasm) để ghép nối video, audio và vẽ phụ đề mà không cần server backend tốn kém.

---

## 3. Danh sách thư viện & công nghệ sử dụng

### AI & Media
- **Google AI Studio (Gemini API):** Trái tim của hệ thống xử lý logic và ngôn ngữ.
- **Google Text-to-Speech (Chirp 3 / HD voices):** Tạo giọng đọc cao cấp qua Modality.AUDIO.
- **Google Search Grounding:** (Tùy chọn) Tìm kiếm thông tin cập nhật cho kịch bản.

### Video & Media Processing
- **FFmpeg.wasm (@ffmpeg/ffmpeg):** Xử lý muxing video/audio trực tiếp trên trình duyệt.
- **Canvas API:** Render phụ đề progressive, hiệu ứng lớp phủ (overlays) và visualizer.
- **Web Audio API:** Phân tích sóng âm và hòa âm thời gian thực.

### API & Nguồn dữ liệu
- **Pixabay API:** Nguồn video stock đa dạng, an toàn bản quyền.
- **Pexels API:** Nguồn video cinematic chất lượng cao (HD/4K).
- **Google OAuth 2.0:** Tích hợp đăng nhập và upload YouTube.

### Frontend Framework
- **React 19 & TypeScript:** Đảm bảo hiệu suất và độ tin cậy của mã nguồn.
- **Tailwind CSS:** Giao diện hiện đại, responsive hoàn toàn.

---

## 4. Quy trình hoạt động (Workflow)

1. **Nhận đầu vào:** Người dùng nhập chủ đề hoặc dán kịch bản thô.
2. **Phân tích & Tối ưu:** Gemini Pro chuyển đổi input thành kịch bản phân cảnh chuyên nghiệp.
3. **Cá nhân hóa giọng nói:** Người dùng chọn giọng đọc (Studio, Podcast, Home Mic) và sắc thái.
4. **Khai thác tài nguyên (Asset Mining):** Hệ thống tìm video stock và tạo file âm thanh HD đồng thời.
5. **Biên tập trực tuyến:** Người dùng thêm nhạc nền, chỉnh âm lượng và chọn hiệu ứng chuyển cảnh.
6. **Đồng bộ hóa:** Hệ thống tính toán thời lượng video dựa trên độ dài của giọng đọc AI.
7. **Xuất bản:** FFmpeg thực hiện đóng gói tài nguyên thành file `.mp4` chuẩn YouTube/TikTok.

---

## 5. Yêu cầu hệ thống (System Requirements)

Dành cho việc triển khai ứng dụng trên **VPS Ubuntu**:

- **Hệ điều hành:** Ubuntu 22.04 LTS hoặc cao hơn.
- **CPU:** Tối thiểu 2 Cores (Ưu tiên CPU có hiệu suất đơn nhân tốt cho FFmpeg.wasm).
- **RAM:** Tối thiểu 4GB (Do quá trình render diễn ra trên trình duyệt, VPS chỉ cần đủ để phục vụ file tĩnh và proxy).
- **Dung lượng:** 5GB trống để lưu trữ dependencies và build files.
- **Quyền:** Sudo access để cài đặt Node.js và Nginx.

---

## 6. Hướng dẫn cài đặt trên Ubuntu (Step-by-step)

### Bước 1: Cập nhật hệ thống và cài đặt môi trường
```bash
sudo apt update && sudo apt upgrade -y
# Cài đặt Node.js (Version 20+)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Cài đặt FFmpeg (Dành cho các tác vụ xử lý command-line nếu cần)
sudo apt install -y ffmpeg
```

### Bước 2: Clone dự án và cài đặt Dependencies
```bash
git clone https://github.com/your-username/ai-youtube-creator.git
cd ai-youtube-creator
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc:
```bash
nano .env
```
Nội dung file:
```env
# API Key từ Google AI Studio (https://aistudio.google.com/app/apikey)
API_KEY=your_gemini_api_key_here
```

### Bước 4: Build và Triển khai với Nginx
```bash
# Tạo bản build production
npm run build

# Cài đặt Nginx để serve dự án
sudo apt install -y nginx
sudo cp -r dist/* /var/www/html/

# Cấu hình Nginx (Quan trọng: Cần Headers cho SharedArrayBuffer của FFmpeg.wasm)
sudo nano /etc/nginx/sites-available/default
```

**Lưu ý:** Thêm các headers sau vào cấu hình Nginx để FFmpeg.wasm hoạt động:
```nginx
location / {
    add_header Cross-Origin-Embedder-Policy require-corp;
    add_header Cross-Origin-Opener-Policy same-origin;
    try_files $uri $uri/ /index.html;
}
```
Khởi động lại Nginx:
```bash
sudo systemctl restart nginx
```

---
*Phát triển bởi đội ngũ kỹ sư Frontend cao cấp - Tối ưu cho kỷ nguyên nội dung AI.*