// Default role guide content. Admin can override via /admin/guides (stored in settings table).
// Icons are referenced by name and mapped at render time in RoleGuide.tsx.

export interface GuideItem {
  icon: string;
  title: string;
  desc: string;
  tips?: string[];
}

export interface GuideSection {
  id: string;
  icon: string;
  title: string;
  gradient: string;
  items: GuideItem[];
}

export interface RoleGuideConfig {
  title: string;
  subtitle: string;
  accentIcon: string;
  headerGradient: string;
  sections: GuideSection[];
}

export const ADMIN_GUIDE_DEFAULT: RoleGuideConfig = {
  title: 'Hướng dẫn Admin',
  subtitle: 'Tổng quan các tính năng quản trị hệ thống',
  accentIcon: 'Crown',
  headerGradient: 'from-primary/10 via-accent/10 to-primary/10',
  sections: [
    {
      id: 'products', icon: 'Package', title: 'Quản lý Sản phẩm',
      gradient: 'from-blue-500 to-indigo-500',
      items: [
        { icon: 'Package', title: 'Thêm sản phẩm', desc: 'Sản phẩm → Thêm mới → Nhập tên, giá, mô tả, ảnh, biến thể (size/màu).', tips: ['Upload nhiều ảnh để tăng chuyển đổi', 'Điền đầy đủ SEO slug'] },
        { icon: 'FolderOpen', title: 'Quản lý danh mục', desc: 'Tạo danh mục để phân loại sản phẩm. Mỗi sản phẩm có thể thuộc nhiều danh mục.' },
        { icon: 'Star', title: 'Đánh dấu nổi bật', desc: 'Bật "Sản phẩm nổi bật" hoặc "HOT" để hiển thị trên trang chủ.' },
        { icon: 'PackageCheck', title: 'Duyệt sản phẩm Seller', desc: 'Vào "Duyệt SP Seller" để phê duyệt/từ chối/yêu cầu chỉnh sửa.' },
      ],
    },
    {
      id: 'orders', icon: 'ShoppingCart', title: 'Quản lý Đơn hàng & Giao vận',
      gradient: 'from-emerald-500 to-teal-500',
      items: [
        { icon: 'ShoppingCart', title: 'Xử lý đơn hàng', desc: 'Xem đơn mới → Xác nhận → Gán shipper → Theo dõi realtime.', tips: ['Kiểm tra thông tin khách trước khi xác nhận'] },
        { icon: 'Truck', title: 'Quản lý shipper', desc: 'Phân công đơn, xem vị trí GPS realtime, đánh giá hiệu suất.' },
        { icon: 'BarChart3', title: 'Thống kê', desc: 'Doanh thu theo tuần/tháng, biểu đồ xu hướng, top shipper, xuất Excel.' },
      ],
    },
    {
      id: 'content', icon: 'Image', title: 'Quản lý Nội dung',
      gradient: 'from-violet-500 to-purple-500',
      items: [
        { icon: 'Image', title: 'Banner & Trang chủ', desc: 'Thêm banner carousel, kéo thả sắp xếp section trang chủ.' },
        { icon: 'FileText', title: 'Blog', desc: 'Viết bài với editor Tiptap, ảnh cover 21:9, nhúng YouTube, SEO meta.' },
        { icon: 'Ticket', title: 'Voucher & Flash Sale', desc: 'Tạo mã giảm giá, flash sale countdown, simulator giảm giá.' },
      ],
    },
    {
      id: 'users', icon: 'Users', title: 'Quản lý Người dùng',
      gradient: 'from-amber-500 to-orange-500',
      items: [
        { icon: 'Users', title: 'Danh sách người dùng', desc: 'Xem, tìm kiếm, quản lý tài khoản và phân quyền theo role.' },
        { icon: 'UserCheck', title: 'Duyệt Seller', desc: 'Xét duyệt đăng ký bán hàng, kiểm tra giấy phép, phê duyệt/từ chối.' },
        { icon: 'Shield', title: 'Phân quyền', desc: 'Gán role: admin, seller, shipper, dealer, tester.' },
      ],
    },
    {
      id: 'communication', icon: 'MessageCircle', title: 'Giao tiếp & Hỗ trợ',
      gradient: 'from-sky-500 to-cyan-500',
      items: [
        { icon: 'MessageCircle', title: 'Chat trực tiếp', desc: '/admin/chat - giao diện messenger trả lời tin nhắn khách hàng realtime.' },
        { icon: 'Mail', title: 'Liên hệ', desc: 'Xem tin nhắn từ form liên hệ, đánh dấu đã đọc, phản hồi.' },
        { icon: 'Sparkles', title: 'AI Chatbot', desc: 'Cấu hình knowledge base, FAQ, ưu tiên trích dẫn.' },
      ],
    },
    {
      id: 'settings', icon: 'Settings', title: 'Cài đặt Hệ thống',
      gradient: 'from-rose-500 to-red-500',
      items: [
        { icon: 'Settings', title: 'Cấu hình chung', desc: 'Theme, mascot, hiệu ứng, popup mobile, thông tin cửa hàng.' },
        { icon: 'MapPin', title: 'Bản đồ & Liên hệ', desc: 'Pin vị trí cửa hàng trên bản đồ tương tác, cấu hình form liên hệ.' },
        { icon: 'BookOpen', title: 'Hướng dẫn', desc: '/admin/guides - chỉnh sửa nội dung hướng dẫn cho mọi role.' },
      ],
    },
  ],
};

export const SELLER_GUIDE_DEFAULT: RoleGuideConfig = {
  title: 'Hướng dẫn Seller',
  subtitle: 'Các bước để bắt đầu bán hàng hiệu quả',
  accentIcon: 'Store',
  headerGradient: 'from-emerald-500/10 via-teal-500/10 to-emerald-500/10',
  sections: [
    {
      id: 'start', icon: 'Store', title: 'Bắt đầu bán hàng',
      gradient: 'from-emerald-500 to-teal-500',
      items: [
        { icon: 'FileText', title: 'Hoàn thiện hồ sơ', desc: 'Cập nhật thông tin doanh nghiệp, giấy phép, mã số thuế tại Hồ sơ.' },
        { icon: 'CheckCircle', title: 'Xác minh tài khoản', desc: 'Sau khi admin duyệt, bạn có thể bắt đầu đăng sản phẩm.' },
        { icon: 'CreditCard', title: 'Cấu hình thanh toán', desc: 'Vào Cài đặt ngân hàng để nhận tiền từ đơn hàng.' },
      ],
    },
    {
      id: 'products', icon: 'Package', title: 'Quản lý sản phẩm',
      gradient: 'from-blue-500 to-indigo-500',
      items: [
        { icon: 'Upload', title: 'Đăng sản phẩm mới', desc: 'Sản phẩm → Thêm mới. Nhập tên, giá, mô tả, ảnh (tối đa 10), biến thể.' },
        { icon: 'Clock', title: 'Chờ duyệt', desc: 'Sản phẩm ở trạng thái "Chờ duyệt". Admin xem xét trong 24-48h.' },
        { icon: 'Edit', title: 'Chỉnh sửa khi cần', desc: 'Nếu bị yêu cầu sửa, cập nhật theo góp ý và gửi lại.' },
        { icon: 'AlertCircle', title: 'Mẹo duyệt nhanh', desc: 'Ảnh rõ nét, mô tả chi tiết, slug SEO giúp duyệt nhanh hơn.' },
      ],
    },
    {
      id: 'analytics', icon: 'TrendingUp', title: 'Theo dõi hiệu quả',
      gradient: 'from-purple-500 to-pink-500',
      items: [
        { icon: 'BarChart3', title: 'Dashboard', desc: 'Tổng quan: đã duyệt, chờ duyệt, bị từ chối qua biểu đồ.' },
        { icon: 'TrendingUp', title: 'Thống kê doanh thu', desc: 'Biểu đồ chi tiết theo thời gian, xu hướng bán hàng.' },
        { icon: 'Eye', title: 'Theo dõi đơn hàng', desc: 'Số lượng mua, đánh giá khách hàng, sản phẩm hot.' },
        { icon: 'Star', title: 'Nâng hạng', desc: 'Sản phẩm chất lượng cao được ưu tiên hiển thị trang chủ.' },
      ],
    },
  ],
};

export const SHIPPER_GUIDE_DEFAULT: RoleGuideConfig = {
  title: 'Hướng dẫn Shipper',
  subtitle: 'Quy trình giao hàng và sử dụng GPS realtime',
  accentIcon: 'Truck',
  headerGradient: 'from-orange-500/10 via-amber-500/10 to-orange-500/10',
  sections: [
    {
      id: 'pickup', icon: 'Package', title: 'Nhận đơn',
      gradient: 'from-orange-500 to-amber-500',
      items: [
        { icon: 'Bell', title: 'Nhận thông báo', desc: 'Khi admin gán đơn, bạn nhận thông báo realtime trên app.' },
        { icon: 'MapPin', title: 'Xem địa chỉ', desc: 'Mở chi tiết đơn để xem địa chỉ giao và thông tin khách.' },
        { icon: 'CheckCircle', title: 'Xác nhận lấy hàng', desc: 'Cập nhật trạng thái "Đang lấy hàng" khi bắt đầu.' },
      ],
    },
    {
      id: 'deliver', icon: 'Truck', title: 'Giao hàng',
      gradient: 'from-blue-500 to-cyan-500',
      items: [
        { icon: 'Navigation', title: 'Bật GPS', desc: 'Bật chia sẻ vị trí - khách hàng sẽ theo dõi bạn trên bản đồ realtime.' },
        { icon: 'Truck', title: 'Cập nhật trạng thái', desc: 'Đang giao → Đã giao. Khách nhận thông báo từng bước.' },
        { icon: 'CheckCircle', title: 'Hoàn thành', desc: 'Đánh dấu "Đã giao thành công" khi khách nhận hàng.' },
      ],
    },
    {
      id: 'rating', icon: 'Star', title: 'Đánh giá & Thu nhập',
      gradient: 'from-pink-500 to-rose-500',
      items: [
        { icon: 'Star', title: 'Nhận đánh giá', desc: 'Khách hàng đánh giá 1-5 sao sau khi nhận hàng.' },
        { icon: 'TrendingUp', title: 'Bảng xếp hạng', desc: 'Top shipper sẽ được ưu tiên gán đơn mới.' },
        { icon: 'BarChart3', title: 'Thống kê', desc: 'Xem số đơn đã giao, doanh thu, tỉ lệ thành công.' },
      ],
    },
  ],
};

export const ROLE_GUIDES = {
  admin: ADMIN_GUIDE_DEFAULT,
  seller: SELLER_GUIDE_DEFAULT,
  shipper: SHIPPER_GUIDE_DEFAULT,
} as const;

export type GuideRole = keyof typeof ROLE_GUIDES;
