import { useState } from 'react';
import { 
  BookOpen, Package, ShoppingCart, Users, Image, FileText, 
  Settings, Ticket, Star, Truck, UserCheck, Mail, 
  ChevronDown, ChevronRight, Sparkles, Shield, BarChart3,
  FolderOpen, MessageSquare, Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideStep {
  icon: typeof BookOpen;
  title: string;
  description: string;
  tips?: string[];
}

interface GuideSection {
  id: string;
  icon: typeof BookOpen;
  title: string;
  gradient: string;
  steps: GuideStep[];
}

const guideSections: GuideSection[] = [
  {
    id: 'products',
    icon: Package,
    title: 'Quản lý Sản phẩm',
    gradient: 'from-blue-500 to-indigo-500',
    steps: [
      { icon: Package, title: 'Thêm sản phẩm', description: 'Vào Sản phẩm → Thêm mới → Nhập tên, giá, mô tả, ảnh, biến thể (size/màu).', tips: ['Upload nhiều ảnh để tăng chuyển đổi', 'Điền đầy đủ SEO slug'] },
      { icon: FolderOpen, title: 'Quản lý danh mục', description: 'Tạo danh mục để phân loại sản phẩm. Mỗi sản phẩm có thể thuộc nhiều danh mục.' },
      { icon: Star, title: 'Đánh dấu nổi bật', description: 'Bật "Sản phẩm nổi bật" hoặc "HOT" để hiển thị trên trang chủ.' },
    ],
  },
  {
    id: 'orders',
    icon: ShoppingCart,
    title: 'Quản lý Đơn hàng',
    gradient: 'from-emerald-500 to-teal-500',
    steps: [
      { icon: ShoppingCart, title: 'Xử lý đơn hàng', description: 'Xem đơn mới → Xác nhận → Giao cho shipper → Theo dõi trạng thái.', tips: ['Kiểm tra thông tin khách trước khi xác nhận', 'Ghi chú nội bộ nếu cần'] },
      { icon: Truck, title: 'Giao hàng', description: 'Chọn shipper → Gán đơn → Shipper cập nhật trạng thái realtime.' },
      { icon: BarChart3, title: 'Thống kê', description: 'Xem doanh thu theo tuần/tháng, biểu đồ xu hướng và top shipper.' },
    ],
  },
  {
    id: 'content',
    icon: Image,
    title: 'Quản lý Nội dung',
    gradient: 'from-violet-500 to-purple-500',
    steps: [
      { icon: Image, title: 'Banner & Trang chủ', description: 'Thêm banner carousel, điều chỉnh thứ tự sections trên trang chủ bằng kéo thả.' },
      { icon: FileText, title: 'Blog', description: 'Viết bài blog với editor WYSIWYG, thêm ảnh, video, SEO metadata.' },
      { icon: Ticket, title: 'Voucher & Flash Sale', description: 'Tạo mã giảm giá, thiết lập flash sale với countdown timer.' },
    ],
  },
  {
    id: 'users',
    icon: Users,
    title: 'Quản lý Người dùng',
    gradient: 'from-amber-500 to-orange-500',
    steps: [
      { icon: Users, title: 'Danh sách người dùng', description: 'Xem, tìm kiếm và quản lý tất cả tài khoản trong hệ thống.' },
      { icon: UserCheck, title: 'Duyệt Seller', description: 'Xét duyệt đăng ký bán hàng, kiểm tra giấy phép kinh doanh, phê duyệt/từ chối.' },
      { icon: Shield, title: 'Phân quyền', description: 'Gán role: admin, seller, shipper, dealer, tester cho từng người dùng.' },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Cài đặt Hệ thống',
    gradient: 'from-rose-500 to-red-500',
    steps: [
      { icon: Settings, title: 'Cấu hình chung', description: 'Theme, mascot, hiệu ứng, popup mobile, thông tin liên hệ cửa hàng.' },
      { icon: Mail, title: 'Quản lý liên hệ', description: 'Xem tin nhắn từ form liên hệ, đánh dấu đã đọc, phản hồi khách hàng.' },
      { icon: MessageSquare, title: 'Social & SEO', description: 'Cấu hình link mạng xã hội, thông tin SEO, Google Maps nhúng.' },
    ],
  },
];

export function AdminGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="relative p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-b">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Hướng dẫn sử dụng
              <Sparkles className="h-5 w-5 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tổng quan các tính năng quản trị hệ thống
            </p>
          </div>
          <Crown className="h-8 w-8 text-primary/20 ml-auto" />
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y">
        {guideSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm shrink-0",
                  section.gradient
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.steps.length} hướng dẫn</p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  {section.steps.map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border">
                          <StepIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{step.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                          {step.tips && (
                            <div className="mt-2 space-y-1">
                              {step.tips.map((tip, i) => (
                                <p key={i} className="text-xs text-primary flex items-center gap-1.5">
                                  <Sparkles className="h-3 w-3 shrink-0" />
                                  {tip}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
