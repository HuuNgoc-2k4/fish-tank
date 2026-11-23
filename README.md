# Fish Tank 🐟🐱

Bể cá neon trên desktop Windows và một chú mèo/chó chạy dọc thanh taskbar. Cho cá ăn, trêu thú cưng, chỉnh loại cá và màu sắc trong cửa sổ cài đặt.

## Cần cài

| Phần mềm | Dùng để | Tải |
|---|---|---|
| **Node.js** (bản LTS, 20 trở lên) | chạy app (đã kèm `npm`) | https://nodejs.org |
| **Git** | tải mã nguồn (không bắt buộc, có thể tải zip từ GitHub) | https://git-scm.com/download/win |

### Cài bằng lệnh (Windows 10/11, dùng `winget` có sẵn)

Mở **PowerShell** và chạy lần lượt:

```powershell
winget install OpenJS.NodeJS.LTS
```

```powershell
winget install Git.Git
```

Node.js đã kèm `npm`, không cần cài riêng. Nếu hỏi đồng ý điều khoản thì gõ `Y` rồi Enter; nếu hiện bảng UAC thì bấm **Yes**.

Máy không có `winget` (Windows cũ)? Cài bằng Chocolatey: mở PowerShell **bằng quyền Administrator**, cài Chocolatey theo hướng dẫn ở https://chocolatey.org/install, rồi chạy:

```powershell
choco install nodejs-lts git -y
```

### Kiểm tra

Cài xong **đóng PowerShell, mở lại** (để nhận lệnh mới), rồi chạy:

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

Đã clone từ trước và muốn cập nhật? Chạy `git pull`. Nếu Git báo "local changes would be overwritten" ở `package.json` (do lệnh `npm install-scripts approve` tự sửa file này), chạy `git checkout package.json` rồi `git pull` lại.

**2. Cài thư viện** (lần đầu mất vài phút vì tải Electron)

```powershell
npm install
```

**3. Chạy**

```powershell
npm start
```

Cửa sổ **Cài đặt** hiện lên, bể cá xuất hiện ở desktop và thú cưng chạy trên thanh taskbar. Đóng cửa sổ cài đặt thì app vẫn chạy nền; mở lại bằng icon ở khay hệ thống (góc phải taskbar, có thể nằm sau mũi tên `^`): bấm đúp, hoặc chuột phải → **Mở cài đặt**. Thoát hẳn: chuột phải icon → **Thoát**.

## Cách chơi

| Thao tác | Kết quả |
|---|---|
| Giữ `Ctrl` + bấm chuột lên màn hình desktop | thả thức ăn tại chỗ bấm (con trỏ đổi thành dấu `+`) |
| `Ctrl+Alt+F` | thả thức ăn từ trên xuống (dự phòng khi không bắt được phím giữ) |
| Bấm chuột trái vào cá | cá phản ứng: bơi vụt đi hoặc nhả bong bóng |
| Bấm chuột trái vào thú cưng | nhảy cẫng lên hoặc kêu `Meo!` / `Gâu!` |
| Bấm chuột phải vào thú cưng | đuổi, thú cưng chạy sang chỗ khác |
| Trêu liên tục (khoảng 4 lần liền) | cá/thú cưng **dỗi**: chạy ra góc, nằm im khoảng 25 giây, bấm vào lúc này chỉ nhận được `💢` |

Ở cửa sổ **Cài đặt** bạn có thể:
- Bật/tắt **Bể cá** và **Thú cưng** bằng hai ô tick.
- Thêm/xóa cá, chọn loại (Cá nhỏ, Cá nóc, Lươn neon, Sứa) và màu từng con (tối đa 20 con).
- Chọn thú cưng (Mèo hoặc Chó) và màu.

Cài đặt được lưu tự động (file `config.json` trong thư mục dữ liệu của app).

### Bể cá và thú cưng nằm ở đâu?

- **Bể cá** chỉ hiện ở desktop. Cửa sổ ứng dụng mở lên sẽ che nó, và khi đó giữ `Ctrl` + bấm sẽ đi vào ứng dụng chứ không thả thức ăn.
- **Thú cưng** luôn nằm trên cùng, đi trên mép trên của thanh taskbar, kể cả khi bạn đang dùng ứng dụng khác.
- Chỉ hỗ trợ màn hình chính, thanh taskbar đặt ở dưới.

## Đóng gói thành file .exe (không bắt buộc)

```powershell
npm run build
```

Kết quả nằm ở `dist\FishTank-win32-x64\FishTank.exe`. Copy cả thư mục `FishTank-win32-x64` sang máy khác, bấm đúp `FishTank.exe` là chạy, máy đó không cần cài Node.js. Với bản `.exe`, menu khay hệ thống có thêm mục **Chạy cùng Windows**.

## Cấu trúc thư mục

```
assets/            icon khay hệ thống
src/core/          logic và cách vẽ: cá (fish.js), thú cưng (pet.js), trạng thái dỗi (mood.js), nét neon (neon.js)
src/main/          tiến trình chính: cửa sổ, khay hệ thống, cấu hình (config.js), bắt phím Ctrl (input.js)
src/preload/       cầu nối an toàn giữa main và các cửa sổ
src/renderer/      3 cửa sổ: aquarium/ (bể cá), pet/ (thú cưng), settings/ (cài đặt)
test/              test tự động
```

Kiểm tra logic: `npm test`.

## Lỗi thường gặp

- **`npm` is not recognized**: cài Node.js rồi mở lại PowerShell.
- **`npm install` treo lâu hoặc lỗi mạng**: Electron là file lớn, thử chạy lại; nếu dùng VPN/proxy công ty thì tắt thử.
- **`Electron failed to install correctly`** khi `npm start`: Electron tải về nhưng giải nén dở (thư mục `node_modules\electron\dist` chỉ có vài file, không có `electron.exe`). Tự giải nén bằng PowerShell trong thư mục dự án:

  ```powershell
  $v = (Get-Content node_modules\electron\package.json | ConvertFrom-Json).version
  Invoke-WebRequest "https://github.com/electron/electron/releases/download/v$v/electron-v$v-win32-x64.zip" -OutFile electron.zip
  Expand-Archive electron.zip -DestinationPath node_modules\electron\dist -Force
  Set-Content -NoNewline -Path node_modules\electron\path.txt -Value "electron.exe"
  Remove-Item electron.zip
  ```

  Nếu `electron.exe` biến mất sau vài giây là Windows Defender cách ly nó: khôi phục ở Windows Security → Protection history, hoặc thêm thư mục dự án vào danh sách loại trừ rồi làm lại.
- **Cửa sổ cài đặt hiện nhưng không thấy cá**: tắt tăng tốc đồ họa rồi chạy lại: `$env:FISH_NOGPU=1; npm start`. Log của các cửa sổ (`[aquarium]`, `[pet]`, `[settings]`) in ra ngay trong terminal; gửi chúng khi cần báo lỗi.
- **Giữ `Ctrl` + bấm không thả được thức ăn**: app dùng một hook bàn phím toàn cục để biết bạn đang giữ `Ctrl`; một số phần mềm diệt virus có thể chặn hoặc cảnh báo hook này. Khi không bắt được, cửa sổ cài đặt hiện cảnh báo và bạn dùng `Ctrl+Alt+F`.
- **`Ctrl+Alt+F` không có tác dụng**: phím tắt đang bị app khác chiếm.
- **Không thấy icon ở tray**: bấm mũi tên `^` ở góc phải taskbar.
- **Mở app lần hai không thấy gì**: app chỉ cho chạy một bản; bản thứ hai chỉ mở lại cửa sổ cài đặt của bản đang chạy.
