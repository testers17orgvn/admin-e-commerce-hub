# Kế hoạch: Xóa hardcode, Trang Loading tuỳ biến & Tối ưu Mobile

## 1. Xóa hardcode cứng (fallback data)

Rà soát và loại bỏ các giá trị mặc định hardcode trong UI, thay bằng dữ liệu từ DB (kết hợp cache buffer đã có). Giữ lại chỉ **schema defaults** trong hook để cache trống không vỡ layout, nhưng UI không hiển thị chuỗi tiếng Việt cứng nếu admin chưa cấu hình.

Các vị trí xử lý:
- `HeroSection`, `FeaturedProducts`, `CategoriesSection`, `NewsletterSection`, `PromoBannerSection`, `FlashSaleSection`, `NewArrivalsSection`: chỉ render khi có dữ liệu thực (product/banner/category); ẩn section nếu rỗng thay vì hiện text placeholder.
- `Footer`, `Header`: lấy tên shop, mô tả, social từ `contact_settings` / `settings` (không hardcode "VSM").
- `AIChatBot` welcome/suggestions: đã có hook, đảm bảo không fallback chuỗi cứng khi admin để trống.
- `roleGuideDefaults.ts`: giữ làm seed cho lần đầu; UI đọc từ DB.
- Trang `NotFound`, `Auth`, `Cart` empty state: đưa các message vào `settings` key `ui_texts` (hoặc giữ i18n tối thiểu, không phải "mockup").

## 2. Trang Loading tuỳ biến (admin editable)

### Component mới
- `src/components/loading/AppLoader.tsx`: full-screen loader hiển thị khi app khởi động (chờ auth + settings load lần đầu).
- `src/components/loading/PageLoader.tsx`: loader nhẹ cho route chuyển trang (dùng trong `Suspense fallback`).
- `src/hooks/useLoadingSettings.ts`: hook đọc `settings.key = 'loading_settings'` (có cache + realtime giống pattern hiện tại).

### Cấu hình admin (`/admin/settings` thêm tab "Loading")
`src/components/admin/LoadingSettingsManager.tsx`:
- Logo/ảnh loading (upload qua `ImageUpload`).
- Text hiển thị (tagline).
- Chọn hiệu ứng: `spinner` | `pulse` | `wave` | `dots` | `progress-bar` | `logo-breath` | `particles`.
- Màu accent (color picker).
- Bật/tắt gradient background, chọn 2 màu gradient.
- Tốc độ animation (slider).
- Bật/tắt hiển thị % progress giả lập.
- Preview trực tiếp trong admin.

### Tích hợp
- `main.tsx` / `App.tsx`: bọc `Suspense` với `PageLoader`, hiển thị `AppLoader` cho lần load đầu.
- Loader đọc từ cache ngay lập tức (không nhấp nháy).

## 3. Tối ưu Mobile toàn bộ

### Layout & Header
- `Header.tsx`: bottom-nav cố định trên mobile (Home, Category, Cart, Chat, Profile) — kiểu Shopee.
- Ẩn/thu gọn search bar thành icon mở drawer trên mobile.
- Safe-area padding (`pb-[env(safe-area-inset-bottom)]`).

### Trang chính
- `Index.tsx`: giảm padding section trên mobile (`py-3` thay vì `py-6`), grid `grid-cols-2` cho product/category.
- `ProductCard`: thu nhỏ font, padding, hiển thị badge sale/price 1 dòng gọn.
- `ProductDetail`: sticky "Add to cart" bar dưới cùng trên mobile.
- `Cart`, `OrderDetail`, `Profile`: chuyển sang layout stack 1 cột, button full-width, tăng touch target ≥44px.
- Admin pages: giữ desktop-first nhưng thêm horizontal scroll cho bảng, sidebar chuyển thành drawer trên mobile (đã có sidebar shadcn).

### Chat/Floating widgets
- `ChatWidget`, `AIChatBot`, `BackToTop`: điều chỉnh vị trí tránh đè lên bottom-nav (offset `bottom-20` trên mobile).
- Panel chat: full-screen sheet trên mobile thay vì popup nhỏ.

### Utilities
- Sử dụng `useIsMobile()` sẵn có ở các component cần logic khác biệt.
- Thêm class helper `.container-mobile` trong `index.css` (px-3 md:px-6).

## 4. Database Migration

Thêm setting key mới (không tạo bảng):
```sql
INSERT INTO public.settings (key, value) VALUES
('loading_settings', '{"enabled":true,"logo_url":"","tagline":"Đang tải...","effect":"logo-breath","accent_color":"#3B82F6","gradient_from":"#0F172A","gradient_to":"#1E293B","speed":1,"show_progress":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

## Chi tiết kỹ thuật

- Cache pattern: dùng lại `getCache/setCache/subscribeCache` cho `useLoadingSettings`.
- Realtime: subscribe `settings` với filter `key=eq.loading_settings`.
- Loader render tách biệt khỏi React tree chính để hiển thị trước cả khi React mount (inject vào `index.html` skeleton, sau đó React tiếp quản).
- Mobile breakpoint: `md` (768px) — đã dùng trong `use-mobile.tsx`.
- Không thay đổi business logic (chỉ UI/presentation + 1 setting mới).

## Files sẽ thay đổi
- **Mới**: `src/hooks/useLoadingSettings.ts`, `src/components/loading/AppLoader.tsx`, `src/components/loading/PageLoader.tsx`, `src/components/admin/LoadingSettingsManager.tsx`, migration SQL.
- **Sửa**: `index.html` (skeleton loader), `src/main.tsx`, `src/App.tsx`, `src/pages/admin/Settings.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/Layout.tsx`, `src/pages/Index.tsx`, các section `home/*`, `ProductCard`, `ProductDetail`, `Cart`, các floating widget (`ChatWidget`, `AIChatBot`, `BackToTop`), `index.css`.
