# Fish Tank 🐟

Hồ cá neon chạy nền trên màn hình Windows: cá bơi, bạn cho ăn được. Lớp phủ trong suốt, luôn nằm trên cùng, chuột bấm xuyên qua nên không cản việc khác.

## Cần cài

| Phần mềm | Dùng để | Tải |
|---|---|---|
| **Node.js** (bản LTS, 20 trở lên) | chạy app (đã kèm `npm`) | https://nodejs.org |
| **Git** | tải mã nguồn (không bắt buộc, có thể tải zip từ GitHub) | https://git-scm.com/download/win |

Cài xong, **mở lại** PowerShell rồi kiểm tra:

```powershell
node -v
npm -v
git --version
```

Mỗi lệnh phải in ra một số phiên bản. Báo "not recognized" nghĩa là cài chưa xong hoặc chưa mở lại terminal.

## Chạy app (từng bước)

**1. Tải mã nguồn**

```powershell
git clone https://github.com/HuuNgoc-2k4/fish-tank.git
cd fish-tank
```

Không dùng Git: vào trang repo → **Code → Download ZIP**, giải nén, rồi mở PowerShell trong thư mục đó.

**2. Cài thư viện** (lần đầu mất vài phút vì tải Electron)

```powershell
npm install
```

**3. Chạy**

```powershell
npm start
```

Cá hiện lên màn hình. Muốn dừng: chuột phải icon ở khay hệ thống (góc phải taskbar, có thể nằm sau mũi tên `^`) → **Thoát**, hoặc bấm `Ctrl+C` trong terminal.

## Cách chơi

| Thao tác | Kết quả |
|---|---|
| `Ctrl+Alt+F` | thả thức ăn từ trên xuống |
| Bấm nút tròn vàng ở góc dưới bên phải | thả thức ăn từ trên xuống |
| Menu tray → **Click để thả thức ăn** | bấm chỗ nào trên màn hình, thức ăn rơi chỗ đó (chế độ này chặn chuột của desktop, nhớ tắt khi xong) |
| Menu tray → **Thêm cá** | thêm 1 con (tối đa 12) |
| Menu tray → **Chạy cùng Windows** | tự mở khi bật máy |

Cá ăn thì to dần (tối đa cỡ 18). Thức ăn không ai ăn sẽ nằm đáy khoảng 12 giây rồi biến mất.

## Đóng gói thành file .exe (không bắt buộc)

```powershell
npm run build
```

Kết quả nằm ở `dist\FishTank-win32-x64\FishTank.exe`. Copy cả thư mục `FishTank-win32-x64` sang máy khác, bấm đúp `FishTank.exe` là chạy, máy đó không cần cài Node.js.

## Kiểm tra logic (không bắt buộc)

```powershell
npm test
```

## Lỗi thường gặp

- **`npm` is not recognized**: cài Node.js rồi mở lại PowerShell.
- **`npm install` treo lâu hoặc lỗi mạng**: Electron là file lớn, thử chạy lại; nếu dùng VPN/proxy công ty thì tắt thử.
- **`Ctrl+Alt+F` không có tác dụng**: phím tắt đang bị app khác chiếm, dùng nút vàng hoặc menu tray.
- **Không thấy icon ở tray**: bấm mũi tên `^` ở góc phải taskbar.
- **Không thấy cá**: app chỉ hiện trên màn hình chính.
