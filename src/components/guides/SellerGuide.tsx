import { useState } from 'react';
import { 
  BookOpen, Package, Upload, Clock, CheckCircle, Edit, 
  TrendingUp, BarChart3, ChevronDown, ChevronRight, 
  Sparkles, Store, Star, Eye, FileText, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const guideSteps = [
  {
    id: 'start',
    icon: Store,
    title: 'Bắt đầu bán hàng',
    gradient: 'from-emerald-500 to-teal-500',
    items: [
      { icon: FileText, title: 'Hoàn thiện hồ sơ', desc: 'Cập nhật thông tin doanh nghiệp, giấy phép kinh doanh, mã số thuế tại trang Hồ sơ.' },
      { icon: CheckCircle, title: 'Xác minh tài khoản', desc: 'Sau khi admin duyệt đăng ký, bạn có thể bắt đầu đăng sản phẩm.' },
    ]
  },
  {
    id: 'products',
    icon: Package,
    title: 'Quản lý sản phẩm',
    gradient: 'from-blue-500 to-indigo-500',
    items: [
      { icon: Upload, title: 'Đăng sản phẩm mới', desc: 'Vào Sản phẩm → Thêm mới. Nhập tên, giá, mô tả chi tiết, ảnh sản phẩm (tối đa 10 ảnh).' },
      { icon: Clock, title: 'Chờ duyệt', desc: 'Sản phẩm sẽ ở trạng thái "Chờ duyệt". Admin xem xét trong 24-48h.' },
      { icon: Edit, title: 'Chỉnh sửa khi cần', desc: 'Nếu bị yêu cầu sửa, cập nhật theo góp ý và gửi lại.' },
      { icon: AlertCircle, title: 'Lưu ý', desc: 'Ảnh rõ nét, mô tả chi tiết giúp sản phẩm được duyệt nhanh hơn.' },
    ]
  },
  {
    id: 'analytics',
    icon: TrendingUp,
    title: 'Theo dõi hiệu quả',
    gradient: 'from-purple-500 to-pink-500',
    items: [
      { icon: BarChart3, title: 'Dashboard', desc: 'Xem tổng quan sản phẩm: đã duyệt, chờ duyệt, bị từ chối qua biểu đồ tròn.' },
      { icon: TrendingUp, title: 'Thống kê doanh thu', desc: 'Truy cập trang Thống kê doanh thu để xem biểu đồ chi tiết theo thời gian.' },
      { icon: Eye, title: 'Theo dõi đơn hàng', desc: 'Xem sản phẩm của bạn được mua bao nhiêu, đánh giá từ khách hàng.' },
      { icon: Star, title: 'Nâng hạng', desc: 'Sản phẩm chất lượng cao sẽ được ưu tiên hiển thị trên trang chủ.' },
    ]
  },
];

export function SellerGuide() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="relative p-5 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Hướng dẫn Seller
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground">Các bước để bắt đầu bán hàng hiệu quả</p>
          </div>
        </div>
      </div>

      <div className="divide-y">
        {guideSteps.map((section, sIdx) => {
          const isExpanded = expandedId === section.id;
          const Icon = section.icon;
          return (
            <div key={section.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {sIdx + 1}
                </div>
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", section.gradient)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-sm flex-1 text-left">{section.title}</span>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {section.items.map((item, idx) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0 border">
                          <ItemIcon className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
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
