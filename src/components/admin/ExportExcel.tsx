import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, CalendarIcon, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';

type ReportType = 'products' | 'orders' | 'revenue' | 'customers' | 'shipper_reviews';

interface ExportOptions {
  type: ReportType;
  startDate?: Date;
  endDate?: Date;
}

export function ExportExcel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    type: 'orders',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const exportProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('name, price, original_price, stock, is_active, is_featured, created_at');

    if (error) throw error;

    const rows = data?.map(p => ({
      'Tên sản phẩm': p.name,
      'Giá bán': p.price,
      'Giá gốc': p.original_price || '',
      'Tồn kho': p.stock || 0,
      'Đang bán': p.is_active ? 'Có' : 'Không',
      'Nổi bật': p.is_featured ? 'Có' : 'Không',
      'Ngày tạo': format(new Date(p.created_at || ''), 'dd/MM/yyyy'),
    })) || [];

    return { data: rows, name: 'Danh sách sản phẩm' };
  };

  const exportOrders = async () => {
    let query = supabase.from('orders').select('*');
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const statusMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
    };

    const rows = data?.map(o => ({
      'Mã đơn': o.id.slice(0, 8).toUpperCase(),
      'Khách hàng': o.customer_name,
      'Email': o.customer_email,
      'SĐT': o.customer_phone || '',
      'Địa chỉ': o.customer_address || '',
      'Tổng tiền': o.total_amount,
      'Trạng thái': statusMap[o.status || 'pending'] || o.status,
      'Ngày đặt': format(new Date(o.created_at || ''), 'dd/MM/yyyy HH:mm'),
    })) || [];

    return { data: rows, name: 'Đơn hàng' };
  };

  const exportRevenue = async () => {
    let query = supabase.from('orders').select('*').neq('status', 'cancelled');
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const totalRevenue = data?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
    const totalOrders = data?.length || 0;
    const deliveredOrders = data?.filter(o => o.status === 'delivered').length || 0;

    const rows = [
      { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': formatPrice(totalRevenue) },
      { 'Chỉ số': 'Số đơn hàng', 'Giá trị': totalOrders.toString() },
      { 'Chỉ số': 'Đơn đã giao', 'Giá trị': deliveredOrders.toString() },
      { 'Chỉ số': 'Tỷ lệ hoàn thành', 'Giá trị': `${totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : 0}%` },
      { 'Chỉ số': 'Giá trị trung bình', 'Giá trị': formatPrice(totalOrders > 0 ? totalRevenue / totalOrders : 0) },
    ];

    // Add detailed breakdown
    const detailRows = data?.map(o => ({
      'Mã đơn': o.id.slice(0, 8).toUpperCase(),
      'Khách hàng': o.customer_name,
      'Tổng tiền': o.total_amount,
      'Trạng thái': o.status,
      'Ngày': format(new Date(o.created_at || ''), 'dd/MM/yyyy'),
    })) || [];

    return { 
      data: rows, 
      name: 'Báo cáo doanh thu',
      additionalSheets: [{ data: detailRows, name: 'Chi tiết đơn hàng' }]
    };
  };

  const exportShipperReviews = async () => {
    let query = supabase.from('shipper_reviews').select('*');
    
    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Get unique shipper IDs and fetch profiles
    const shipperIds = [...new Set(data?.map(r => r.shipper_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .in('id', shipperIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Detail rows
    const detailRows = data?.map(r => {
      const profile = profileMap.get(r.shipper_id);
      return {
        'Shipper': profile?.full_name || 'Không rõ',
        'Email': profile?.email || '',
        'Đánh giá (sao)': r.rating,
        'Nhận xét': r.comment || '',
        'Ngày đánh giá': format(new Date(r.created_at), 'dd/MM/yyyy HH:mm'),
      };
    }) || [];

    // Summary per shipper
    const shipperMap = new Map<string, { name: string; ratings: number[] }>();
    data?.forEach(r => {
      const profile = profileMap.get(r.shipper_id);
      const name = profile?.full_name || 'Không rõ';
      if (!shipperMap.has(r.shipper_id)) {
        shipperMap.set(r.shipper_id, { name, ratings: [] });
      }
      shipperMap.get(r.shipper_id)!.ratings.push(r.rating);
    });

    const summaryRows = Array.from(shipperMap.entries()).map(([, info]) => {
      const avg = info.ratings.reduce((a, b) => a + b, 0) / info.ratings.length;
      return {
        'Shipper': info.name,
        'Số đánh giá': info.ratings.length,
        'Điểm TB': Number(avg.toFixed(1)),
        '5 sao': info.ratings.filter(r => r === 5).length,
        '4 sao': info.ratings.filter(r => r === 4).length,
        '3 sao': info.ratings.filter(r => r === 3).length,
        '2 sao': info.ratings.filter(r => r === 2).length,
        '1 sao': info.ratings.filter(r => r === 1).length,
      };
    }).sort((a, b) => b['Điểm TB'] - a['Điểm TB']);

    return {
      data: summaryRows,
      name: 'Tổng hợp shipper',
      additionalSheets: [{ data: detailRows, name: 'Chi tiết đánh giá' }],
    };
  };

  const exportCustomers = async () => {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (pErr) throw pErr;

    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, total_amount');

    const customerStats = profiles?.map(p => {
      const userOrders = orders?.filter(o => o.user_id === p.id) || [];
      const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      
      return {
        'Họ tên': p.full_name || 'Chưa cập nhật',
        'Email': p.email || '',
        'SĐT': p.phone || '',
        'Địa chỉ': p.address || '',
        'Số đơn hàng': userOrders.length,
        'Tổng chi tiêu': totalSpent,
        'Ngày đăng ký': format(new Date(p.created_at || ''), 'dd/MM/yyyy'),
      };
    }) || [];

    return { data: customerStats, name: 'Khách hàng' };
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      let result: { data: Record<string, unknown>[]; name: string; additionalSheets?: { data: Record<string, unknown>[]; name: string }[] };
      
      switch (options.type) {
        case 'products':
          result = await exportProducts();
          break;
        case 'orders':
          result = await exportOrders();
          break;
        case 'revenue':
          result = await exportRevenue();
          break;
        case 'customers':
          result = await exportCustomers();
          break;
        case 'shipper_reviews':
          result = await exportShipperReviews();
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.data);
      XLSX.utils.book_append_sheet(wb, ws, result.name);

      // Add additional sheets if any
      if (result.additionalSheets) {
        result.additionalSheets.forEach(sheet => {
          const additionalWs = XLSX.utils.json_to_sheet(sheet.data);
          XLSX.utils.book_append_sheet(wb, additionalWs, sheet.name);
        });
      }

      // Generate filename with date
      const dateStr = format(new Date(), 'dd-MM-yyyy');
      const filename = `${result.name.replace(/\s+/g, '_')}_${dateStr}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success('Xuất file Excel thành công!');
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất file');
    } finally {
      setLoading(false);
    }
  };

  const presetDates = [
    { label: 'Tháng này', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { label: 'Tháng trước', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: '3 tháng gần nhất', start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xuất báo cáo Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Loại báo cáo</label>
            <Select 
              value={options.type} 
              onValueChange={(v) => setOptions({ ...options, type: v as ReportType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Danh sách sản phẩm</SelectItem>
                <SelectItem value="orders">Đơn hàng</SelectItem>
                <SelectItem value="revenue">Báo cáo doanh thu</SelectItem>
                <SelectItem value="customers">Khách hàng</SelectItem>
                <SelectItem value="shipper_reviews">Đánh giá shipper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(options.type === 'orders' || options.type === 'revenue' || options.type === 'shipper_reviews') && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn nhanh</label>
                <div className="flex flex-wrap gap-2">
                  {presetDates.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setOptions({ 
                        ...options, 
                        startDate: preset.start, 
                        endDate: preset.end 
                      })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Từ ngày</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {options.startDate ? format(options.startDate, 'dd/MM/yyyy') : 'Chọn'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={options.startDate}
                        onSelect={(date) => date && setOptions({ ...options, startDate: date })}
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Đến ngày</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {options.endDate ? format(options.endDate, 'dd/MM/yyyy') : 'Chọn'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={options.endDate}
                        onSelect={(date) => date && setOptions({ ...options, endDate: date })}
                        locale={vi}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? 'Đang xuất...' : 'Xuất file'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}