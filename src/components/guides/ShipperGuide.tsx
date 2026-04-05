import { useState } from 'react';
import { 
  BookOpen, Package, MapPin, Navigation, CheckCircle, 
  Phone, Star, ChevronDown, ChevronRight, Sparkles,
  Truck, Play, Square, Clock, Shield, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const guideSteps = [
  {
    id: 'overview',
    icon: Truck,
    title: 'Tổng quan giao hàng',
    gradient: 'from-blue-500 to-indigo-500',
    items: [
      { icon: Package, title: 'Nhận đơn hàng', desc: 'Khi admin gán đơn, bạn nhận thông báo. Đơn mới hiển thị ở mục "Đơn hàng cần xử lý".' },
      { icon: Clock, title: 'Quy trình giao hàng', desc: 'Đã nhận → Đang lấy hàng → Đang giao → Đã giao thành công. Cập nhật trạng thái theo từng bước.' },
      { icon: Shield, title: 'Lưu ý quan trọng', desc: 'Luôn xác nhận thông tin khách hàng trước khi giao. Giữ liên lạc với khách.' },
    ]
  },
  {
    id: 'tracking',
    icon: Navigation,
    title: 'GPS & Theo dõi',
    gradient: 'from-emerald-500 to-teal-500',
    items: [
      { icon: Play, title: 'Bật tracking', desc: 'Mở chi tiết đơn hàng → Nhấn "Bắt đầu tracking" để bật GPS. Vị trí cập nhật realtime.' },
      { icon: MapPin, title: 'Bản đồ điều hướng', desc: 'Xem bản đồ với tuyến đường từ vị trí hiện tại đến địa chỉ giao hàng.' },
      { icon: Square, title: 'Dừng tracking', desc: 'Nhấn "Dừng tracking" khi hoàn tất giao hàng hoặc hủy đơn.' },
    ]
  },
  {
    id: 'tips',
    icon: Star,
    title: 'Mẹo đạt đánh giá cao',
    gradient: 'from-amber-500 to-orange-500',
    items: [
      { icon: Phone, title: 'Liên hệ trước', desc: 'Gọi điện hoặc nhắn tin xác nhận với khách trước khi giao 15-30 phút.' },
      { icon: CheckCircle, title: 'Giao đúng hẹn', desc: 'Cập nhật trạng thái kịp thời để khách hàng yên tâm theo dõi.' },
      { icon: Star, title: 'Thái độ chuyên nghiệp', desc: 'Lịch sự, cẩn thận với hàng hóa. Đánh giá tốt = được ưu tiên nhận đơn.' },
      { icon: AlertTriangle, title: 'Xử lý sự cố', desc: 'Nếu không giao được, báo ngay cho admin. Đừng tự ý hủy đơn.' },
    ]
  },
];

export function ShipperGuide() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="relative p-5 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-blue-500/5 border-b">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              Hướng dẫn Shipper
              <Sparkles className="h-4 w-4 text-blue-500" />
            </h2>
            <p className="text-xs text-muted-foreground">Hướng dẫn giao hàng chuyên nghiệp</p>
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
                          <ItemIcon className="h-3.5 w-3.5 text-blue-600" />
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
