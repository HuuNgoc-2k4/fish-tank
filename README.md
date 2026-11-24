# Fish Tank 🐟🐱

Bể cá neon trên desktop Windows và các thú cưng hoạt hình (mèo, chó, cáo, mèo điệu, hoặc tự thêm từ ảnh) chạy dọc thanh taskbar. Cho cá ăn bằng lọ thức ăn, túm gáy nhấc thú cưng, ném, vuốt ve, cho ăn, chơi bóng; chỉnh mọi thứ trong cửa sổ cài đặt.

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

Đã clone từ trước và muốn cập nhật:

```powershell
git checkout package.json package-lock.json
git pull
npm install
```

(`git checkout` bỏ các thay đổi mà lệnh `npm install-scripts approve` tự ghi vào `package.json`, nếu không `git pull` sẽ báo "local changes would be overwritten".)

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

### Bể cá (trên desktop)

| Thao tác | Kết quả |
|---|---|
| Bấm vào **lọ thức ăn** (góc phải desktop) | bật chế độ cho ăn: con trỏ thành bình rắc |
| Đang ở chế độ cho ăn, bấm lên desktop | rắc thức ăn tại chỗ bấm |
| Chuột phải / bấm lọ lần nữa / 10 giây không rắc | thoát chế độ cho ăn |
| `Ctrl+Alt+F` hoặc khay hệ thống → **Thả thức ăn** | thả thức ăn từ trên xuống |
| Đưa chuột lên cá | xem tên và độ no |
| Bấm vào cá | cá bơi vụt đi hoặc nhả bong bóng; trêu nhiều quá thì dỗi ra góc |

Cá đói dần theo thời gian (nhấp nháy, kêu "đói..."), cá no thì không ăn nữa, cá đói được ăn sẽ lớn lên. Cá nhỏ bơi theo đàn, cua bò dưới đáy ăn thức ăn chìm. Lướt chuột nhanh qua thì cá giật mình, để chuột yên thì cá tò mò bơi lại. Từ 22h đến 6h cá ngủ.

### Thú cưng (luôn nằm trên cùng, đi trên mép taskbar)

| Thao tác | Kết quả |
|---|---|
| Bấm chuột trái | nhảy, kêu, lăn tròn, xoay đuổi đuôi |
| Giữ chuột và kéo | túm gáy nhấc lên mang đi chỗ khác; buông ra để thả |
| Kéo vung mạnh rồi buông | ném; rơi từ cao xuống sẽ choáng `@_@` |
| Đưa chuột qua lại trên người nó (không bấm) | vuốt ve: rừ rừ, thả tim; vuốt lúc đang dỗi để dỗ |
| Bấm chuột phải | menu: chỉ số no / năng lượng / vui, **Cho ăn** (bát thức ăn), **Chơi bóng** (bóng cũng kéo ném được), **Đuổi chấm đỏ** (chạy theo chuột), **Đi ngủ**, **Đuổi đi** |
| Trêu liên tục / ném nhiều | **dỗi**: ra góc nằm khoảng 25 giây, bấm chỉ nhận `💢` |

Thú cưng tự đói, tự buồn chán (đòi ăn, đòi chơi), mệt thì tự ngủ. Nhiều con gặp nhau thì chào nhau.

### Cửa sổ Cài đặt

- **Bể cá:** bật/tắt bể cá; thêm/xóa cá (Cá nhỏ, Cá vàng, Cá thần tiên, Cá nóc, Lươn neon, Sứa, Cua), đặt tên, chọn màu, có hình xem trước; bật/tắt từng món trang trí (rong biển, đá, lâu đài, rương báu, sủi bọt khí).
- **Thú cưng:** bật/tắt; tối đa 4 con (Mèo, Chó, Cáo, Mèo điệu, hoặc thú cưng từ ảnh), đặt tên, chọn màu; chỉnh kích thước; thêm thú cưng từ ảnh.
- **Chung:** hướng dẫn và nút khôi phục mặc định.

Cài đặt được lưu tự động (file `config.json` trong thư mục dữ liệu của app, `%APPDATA%\fish-tank`).

### Bể cá và thú cưng nằm ở đâu?

- **Bể cá** chỉ hiện ở desktop. Cửa sổ ứng dụng mở lên sẽ che nó.
- **Thú cưng** luôn nằm trên cùng. Lớp thú cưng phủ cả màn hình nhưng chỉ bắt chuột khi con trỏ nằm trên thú cưng, quả bóng hoặc menu; chỗ khác bấm xuyên qua bình thường.
- Chỉ hỗ trợ màn hình chính, thanh taskbar đặt ở dưới.

## Thêm thú cưng bằng ảnh

### Cách 1: trong app (không cần sửa code)

Cài đặt → tab **Thú cưng** → **Thêm từ ảnh…** → chọn một hoặc nhiều ảnh PNG / WebP / SVG **nền trong suốt** (ảnh có nền màu sẽ hiện cả khung nền).

- Một ảnh là đủ. App tự tạo chuyển động: nảy khi đi, đung đưa khi bị nhấc, xoay khi bị ném, nằm nghiêng khi ngủ.
- Muốn có hoạt ảnh riêng thì đặt tên file bắt đầu bằng tên trạng thái: `walk1.png`, `walk2.png`, `sit.png`, `sleep.png`, `held.png`, `happy.png`… File không khớp trạng thái nào sẽ thành `idle`.
- Ảnh được chép vào `%APPDATA%\fish-tank\pets\<tên>\` kèm file `pet.json`. Nút **Mở thư mục** mở chỗ này để sửa tay; sửa xong bấm **Tải lại**.

### Cách 2: cho dev (đóng gói sẵn trong app)

Tạo thư mục `assets/pets/<tên>/` chứa ảnh và `pet.json` (xem mẫu `assets/pets/slime/`):

```json
{
  "name": "Slime (mẫu)",
  "height": 34,
  "facing": "right",
  "sounds": ["Bloop!", "Puyo~"],
  "animations": {
    "idle":  { "frames": ["idle.svg"], "fps": 2 },
    "walk":  { "frames": ["walk1.svg", "walk2.svg"], "fps": 6 },
    "sleep": { "frames": ["sleep.svg"] },
    "held":  { "frames": ["held.svg"] },
    "happy": { "frames": ["happy.svg"] }
  }
}
```

- `height`: chiều cao khi vẽ, cùng đơn vị với mèo có sẵn (mèo khoảng 50).
- `facing`: ảnh gốc quay mặt sang `right` hay `left`; app tự lật khi đổi hướng.
- `animations`: bắt buộc có ít nhất một hoạt ảnh. Tên hợp lệ: `idle walk run sit sleep held fall happy eat play chase dizzy sulk groom purr greet roll stretch spin land goEat`. Trạng thái thiếu sẽ dùng hoạt ảnh gần nhất (`run`/`play`/`chase` → `walk`, `fall` → `held`, `purr`/`greet` → `happy`, còn lại → `idle`).
- `frames`: tên file trong cùng thư mục, chạy lần lượt theo `fps`.

Thư mục của người dùng ghi đè thư mục `assets/pets` có cùng tên. Thú cưng vẽ bằng code (mèo, chó, cáo, mèo điệu) nằm trong `src/core/pet-draw.js`.

## Đóng gói thành file .exe (không bắt buộc)

```powershell
npm run build
```

Kết quả nằm ở `dist\FishTank-win32-x64\FishTank.exe`. Copy cả thư mục `FishTank-win32-x64` sang máy khác, bấm đúp `FishTank.exe` là chạy, máy đó không cần cài Node.js. Với bản `.exe`, menu khay hệ thống có thêm mục **Chạy cùng Windows**.

## Cấu trúc thư mục

```
assets/            icon khay hệ thống, pets/ (thú cưng bằng ảnh, có mẫu slime)
src/core/          logic và cách vẽ: cá (fish.js), trang trí (decor.js), thú cưng (pet.js = mô phỏng, pet-draw.js = vẽ),
                   trạng thái dỗi (mood.js), nét neon (neon.js)
src/main/          tiến trình chính: cửa sổ, khay hệ thống, cấu hình (config.js), thư mục thú cưng ảnh (petpacks.js)
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
- **Bấm vào lọ thức ăn không được**: lọ nằm trên desktop, phải thu nhỏ các cửa sổ (`Win+D`) cho lộ desktop ra. Dùng `Ctrl+Alt+F` để thả thức ăn mà không cần lọ.
- **Thú cưng từ ảnh hiện cả khung nền**: ảnh chưa tách nền; dùng công cụ xóa nền rồi lưu PNG.
- **`Ctrl+Alt+F` không có tác dụng**: phím tắt đang bị app khác chiếm.
- **Không thấy icon ở tray**: bấm mũi tên `^` ở góc phải taskbar.
- **Mở app lần hai không thấy gì**: app chỉ cho chạy một bản; bản thứ hai chỉ mở lại cửa sổ cài đặt của bản đang chạy.
