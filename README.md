# 🚀 Bypass DNU E-Learning Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://javascript.info/)

**Browser Extension hỗ trợ tự động hoàn thành bài học và trắc nghiệm trên hệ thống E-Learning của Trường Đại học Đại Nam**

![Demo](https://via.placeholder.com/800x400/4285F4/FFFFFF?text=Bypass+DNU+E-Learning+Demo)

---

## 📋 **Mục lục**

- [✨ Tính năng](#-tính-năng)
- [🎯 Hệ thống hỗ trợ](#-hệ-thống-hỗ-trợ)
- [📦 Cài đặt](#-cài-đặt)
- [🎮 Cách sử dụng](#-cách-sử-dụng)
- [⚡ Demo nhanh](#-demo-nhanh)
- [🔧 Phát triển](#-phát-triển)
- [⚠️ Lưu ý quan trọng](#️-lưu-ý-quan-trọng)
- [📜 Giấy phép](#-giấy-phép)
- [👨‍💻 Tác giả](#-tác-giả)

---

## ✨ **Tính năng**

### 🎬 **Hoàn thành Video/Bài giảng**
- ✅ Tự động đánh dấu hoàn thành các video bài giảng
- ✅ Cập nhật trạng thái `completed` và `passed` trong SCORM API
- ✅ Chờ xác nhận từ server và hiển thị icon hoàn thành

### 📝 **Vượt qua Trắc nghiệm**
- ✅ Tự động đạt điểm tối đa (100/100)
- ✅ Cập nhật tất cả thông số điểm số trong hệ thống
- ✅ Đánh dấu trắc nghiệm là `passed` và `completed`

### 🎨 **Giao diện thân thiện**
- ✅ GUI panel có thể kéo thả và di chuyển
- ✅ Giao diện đẹp mắt với gradient màu xanh
- ✅ Lưu vị trí panel giữa các phiên làm việc
- ✅ Hiển thị trạng thái real-time của các thao tác

### 🛡️ **Tính năng bảo mật**
- ✅ Bypass các biện pháp anti-debugging
- ✅ Tự động vô hiệu hóa debugger traps
- ✅ Hoạt động ở chế độ ẩn danh

### 🚀 **Trải nghiệm người dùng**
- ✅ Auto-inject với loading animation đẹp mắt
- ✅ Manual injection guide với copy-paste dễ dàng
- ✅ Hỗ trợ keyboard shortcuts (Ctrl+Shift+B/L/Q)
- ✅ Thông báo trạng thái chi tiết

---

## 🎯 **Hệ thống hỗ trợ**

| Trang web | Trạng thái | Ghi chú |
|-----------|------------|---------|
| `elearning.dainam.edu.vn` | ✅ **Đầy đủ** | Hỗ trợ tất cả tính năng |
| `dainam.edu.vn` | ✅ **Cơ bản** | Một số tính năng có thể bị giới hạn |

**Yêu cầu hệ thống:**
- 🌐 Google Chrome/Chromium v88+
- 🌐 Microsoft Edge v88+
- 🌐 Brave Browser
- 🌐 Opera v74+

---

## 📦 **Cài đặt**

### **Phương pháp 1: Tải từ GitHub (Khuyến nghị)**

1. **Clone repository:**
   ```bash
   git clone https://github.com/yourusername/bypass-dnu-elearning.git
   cd bypass-dnu-elearning
   ```

2. **Mở Chrome Extension Manager:**
   - Mở Chrome → Menu (⋮) → **More tools** → **Extensions**
   - Hoặc truy cập: `chrome://extensions/`

3. **Bật Developer Mode:**
   - Toggle **"Developer mode"** ở góc trên bên phải

4. **Load Extension:**
   - Nhấp **"Load unpacked"**
   - Chọn thư mục `bypass-dnu-elearning` vừa clone

5. **Xác nhận cài đặt:**
   - Extension icon 🚀 sẽ xuất hiện trên thanh công cụ
   - Thông báo **"Extension sẵn sàng hoạt động!"**

### **Phương pháp 2: Tải file ZIP**

1. [**Tải ZIP từ GitHub**](https://github.com/yourusername/bypass-dnu-elearning/archive/main.zip)
2. Giải nén file ZIP
3. Làm theo bước 2-5 ở phương pháp 1

---

## 🎮 **Cách sử dụng**

### **🚀 Kích hoạt tự động (Khuyến nghị)**

1. **Truy cập trang học:**
   ```
   https://elearning.dainam.edu.vn/...
   ```

2. **Mở Extension:**
   - Nhấp icon 🚀 trên thanh công cụ
   - Loading animation sẽ xuất hiện full-screen

3. **Thực hiện theo hướng dẫn:**
   - Nhấn `F12` mở Developer Tools
   - Chuyển sang tab **Console**
   - Copy code từ textarea
   - Paste vào Console và nhấn `Enter`

4. **Sử dụng GUI Panel:**
   - Panel sẽ xuất hiện góc trên phải
   - Kéo thả để di chuyển panel
   - Nhấp nút tương ứng với hành động mong muốn

### **⌨️ Keyboard Shortcuts**

| Phím tắt | Chức năng |
|----------|-----------|
| `Ctrl + Shift + B` | Toggle GUI Panel |
| `Ctrl + Shift + L` | Hoàn thành Bài giảng |
| `Ctrl + Shift + Q` | Vượt qua Trắc nghiệm |

### **🎯 Sử dụng từng tính năng**

#### **Hoàn thành Video/Bài giảng:**
1. Mở bài giảng/video cần hoàn thành
2. Nhấp **🎬 Hoàn thành Video/Bài giảng**
3. Đợi thông báo ✅ **"Bài học đã hoàn thành!"**

#### **Vượt qua Trắc nghiệm:**
1. Mở bài trắc nghiệm
2. Nhấp **📝 Vượt qua bài trắc nghiệm**
3. Đợi thông báo ✅ **"Trắc nghiệm hoàn thành 100%!"**

---

## 🔧 **Phát triển**

### **🏗️ Cấu trúc dự án**
```
bypass-dnu-elearning/
├── 📄 manifest.json          # Extension manifest
├── 📄 popup.html             # Popup UI
├── 📄 popup.js               # Popup logic + Manual Guide
├── 📄 content.js             # Content script (legacy)
├── 📄 extension_console.js   # Core bypass logic
├── 📄 obf.js                 # Obfuscated code
├── 🗂️ icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── 📄 README.md              # Documentation
```

### **🛠️ Công nghệ sử dụng**
- **Chrome Extension API** (Manifest V3)
- **SCORM API** - Tương tác với LMS
- **Vanilla JavaScript** - Logic core
- **CSS3** - Styling và animations
- **HTML5** - UI structure

### **🔄 Workflow Development**
1. **Code changes** → Test locally
2. **Reload extension** → Test on target site
3. **Debug issues** → Check console logs
4. **Update version** → Push changes

### **🐛 Debug Mode**
Bật debug mode trong `popup.js`:
```javascript
const DEBUG_MODE = true; // Set to true for detailed logs
```

---

## ⚠️ **Lưu ý quan trọng**

### **📋 Disclaimer**
> ⚠️ **Extension này chỉ dành cho mục đích giáo dục và nghiên cứu**
> 
> - Sử dụng có trách nhiệm và tuân thủ quy định của nhà trường
> - Tác giả không chịu trách nhiệm về việc sử dụng sai mục đích
> - Extension có thể ngừng hoạt động nếu hệ thống thay đổi

### **🔒 Bảo mật & Quyền riêng tư**
- ✅ **Không thu thập dữ liệu cá nhân**
- ✅ **Hoạt động offline hoàn toàn**
- ✅ **Không kết nối server bên ngoài**
- ✅ **Mã nguồn mở và minh bạch**

### **🚨 Rủi ro tiềm ẩn**
- Có thể được phát hiện bởi hệ thống anti-cheat
- Cần cập nhật khi hệ thống LMS thay đổi
- Một số tính năng có thể không ổn định

---

## 📜 **Giấy phép**

```
MIT License

Copyright (c) 2024 vanhxyz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 **Tác giả**

<div align="center">

**🌟 Được phát triển bởi [vanhxyz](https://github.com/vanhxyz)**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/vanhxyz)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:vanhxyz@example.com)

</div>

### **🤝 Đóng góp**
Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### **🐛 Báo cáo lỗi**
Gặp vấn đề? [Tạo Issue mới](https://github.com/yourusername/bypass-dnu-elearning/issues)

### **⭐ Hỗ trợ dự án**
Nếu extension hữu ích, hãy cho 1 ⭐ để động viên tác giả!

---

<div align="center">

**📚 Made with ❤️ for DNU Students**

*Cùng nhau học tập và phát triển! 🚀*

</div>