import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, CalendarIcon, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface OrderReportOptions {
  startDate: Date;
  endDate: Date;
  statuses: string[];
  includeItems: boolean;
  includeCustomerInfo: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export function OrderReportExport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OrderReportOptions>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    statuses: ['pending', 'processing', 'shipping', 'completed'],
    includeItems: true,
    includeCustomerInfo: true,
  });

  const presetDates = [
    { label: 'Hôm nay', start: new Date(), end: new Date() },
    { label: 'Tuần này', start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) },
    { label: 'Tuần trước', start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) },
    { label: 'Tháng này', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { label: 'Tháng trước', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
    { label: 'Quý này', start: startOfMonth(subMonths(new Date(), 2)), end: endOfMonth(new Date()) },
    { label: 'Năm nay', start: startOfYear(new Date()), end: new Date() },
  ];

  const toggleStatus = (status: string) => {
    if (options.statuses.includes(status)) {
      setOptions({ ...options, statuses: options.statuses.filter(s => s !== status) });
    } else {
      setOptions({ ...options, statuses: [...options.statuses, status] });
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN').format(amount) + '₫';

  const handleExport = async () => {
    if (options.statuses.length === 0) {
      toast.error('Vui lòng chọn ít nhất một trạng thái');
      return;
    }

    setLoading(true);
    try {
      // Fetch orders within date range and selected statuses
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', options.startDate.toISOString())
        .lte('created_at', new Date(options.endDate.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .in('status', options.statuses)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.error('Không có đơn hàng nào trong khoảng thời gian này');
        setLoading(false);
        return;
      }

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

      const summaryData = [
        { 'Chỉ số': 'Tổng số đơn hàng', 'Giá trị': orders.length },
        { 'Chỉ số': 'Tổng doanh thu', 'Giá trị': formatCurrency(totalRevenue) },
        { 'Chỉ số': 'Đơn hoàn thành', 'Giá trị': completedOrders },
        { 'Chỉ số': 'Đơn đã hủy', 'Giá trị': cancelledOrders },
        { 'Chỉ số': 'Tỷ lệ hoàn thành', 'Giá trị': `${orders.length > 0 ? ((completedOrders / orders.length) * 100).toFixed(1) : 0}%` },
        { 'Chỉ số': 'Giá trị trung bình/đơn', 'Giá trị': formatCurrency(orders.length > 0 ? totalRevenue / orders.length : 0) },
        { 'Chỉ số': 'Khoảng thời gian', 'Giá trị': `${format(options.startDate, 'dd/MM/yyyy')} - ${format(options.endDate, 'dd/MM/yyyy')}` },
      ];

      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Tổng quan');

      // Orders detail sheet
      const statusMap: Record<string, string> = {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipping: 'Đang giao',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
      };

      const ordersData = orders.map((o, index) => {
        const baseData: Record<string, unknown> = {
          'STT': index + 1,
          'Mã đơn': o.id.slice(0, 8).toUpperCase(),
          'Ngày đặt': format(new Date(o.created_at || ''), 'dd/MM/yyyy HH:mm'),
          'Trạng thái': statusMap[o.status || 'pending'] || o.status,
          'Tổng tiền': o.total_amount,
        };

        if (options.includeCustomerInfo) {
          baseData['Khách hàng'] = o.customer_name;
          baseData['Email'] = o.customer_email;
          baseData['SĐT'] = o.customer_phone || '';
          baseData['Địa chỉ'] = o.customer_address || '';
        }

        if (o.notes) {
          baseData['Ghi chú'] = o.notes;
        }

        return baseData;
      });

      const ordersWs = XLSX.utils.json_to_sheet(ordersData);
      XLSX.utils.book_append_sheet(wb, ordersWs, 'Chi tiết đơn hàng');

      // Products breakdown sheet (if includeItems)
      if (options.includeItems) {
        const allItems: Record<string, unknown>[] = [];
        
        orders.forEach((order) => {
          const items = order.items as { name: string; quantity: number; price: number; product_id?: string }[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              allItems.push({
                'Mã đơn': order.id.slice(0, 8).toUpperCase(),
                'Ngày': format(new Date(order.created_at || ''), 'dd/MM/yyyy'),
                'Sản phẩm': item.name,
                'Số lượng': item.quantity,
                'Đơn giá': item.price,
                'Thành tiền': item.price * item.quantity,
              });
            });
          }
        });

        if (allItems.length > 0) {
          const itemsWs = XLSX.utils.json_to_sheet(allItems);
          XLSX.utils.book_append_sheet(wb, itemsWs, 'Chi tiết sản phẩm');
        }

        // Product summary (best sellers)
        const productSummary: Record<string, { name: string; quantity: number; revenue: number }> = {};
        
        orders.forEach((order) => {
          if (order.status === 'cancelled') return;
          const items = order.items as { name: string; quantity: number; price: number; product_id?: string }[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              const key = item.name;
              if (!productSummary[key]) {
                productSummary[key] = { name: item.name, quantity: 0, revenue: 0 };
              }
              productSummary[key].quantity += item.quantity;
              productSummary[key].revenue += item.price * item.quantity;
            });
          }
        });

        const productStats = Object.values(productSummary)
          .sort((a, b) => b.revenue - a.revenue)
          .map((p, i) => ({
            'STT': i + 1,
            'Sản phẩm': p.name,
            'Số lượng bán': p.quantity,
            'Doanh thu': p.revenue,
          }));

        if (productStats.length > 0) {
          const productStatsWs = XLSX.utils.json_to_sheet(productStats);
          XLSX.utils.book_append_sheet(wb, productStatsWs, 'Thống kê sản phẩm');
        }
      }

      // Status breakdown sheet
      const statusBreakdown = options.statuses.map(status => {
        const statusOrders = orders.filter(o => o.status === status);
        const revenue = statusOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        return {
          'Trạng thái': statusMap[status],
          'Số đơn': statusOrders.length,
          'Doanh thu': revenue,
          'Tỷ lệ': `${orders.length > 0 ? ((statusOrders.length / orders.length) * 100).toFixed(1) : 0}%`,
        };
      });

      const statusWs = XLSX.utils.json_to_sheet(statusBreakdown);
      XLSX.utils.book_append_sheet(wb, statusWs, 'Theo trạng thái');

      // Generate filename
      const dateRange = `${format(options.startDate, 'ddMMyyyy')}-${format(options.endDate, 'ddMMyyyy')}`;
      const filename = `Bao_cao_don_hang_${dateRange}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success(`Đã xuất ${orders.length} đơn hàng thành công!`);
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất báo cáo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Xuất báo cáo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Xuất báo cáo đơn hàng</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Quick date presets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Chọn nhanh khoảng thời gian</Label>
            <div className="flex flex-wrap gap-2">
              {presetDates.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className={cn(
                    options.startDate.getTime() === preset.start.getTime() &&
                    options.endDate.getTime() === preset.end.getTime()
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  )}
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

          {/* Custom date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Từ ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(options.startDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label className="text-sm font-medium">Đến ngày</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(options.endDate, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

          {/* Status filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Trạng thái đơn hàng</Label>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={status.value}
                    checked={options.statuses.includes(status.value)}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <label
                    htmlFor={status.value}
                    className="text-sm cursor-pointer"
                  >
                    {status.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Export options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tùy chọn xuất</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeItems"
                  checked={options.includeItems}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeItems: checked as boolean })
                  }
                />
                <label htmlFor="includeItems" className="text-sm cursor-pointer">
                  Bao gồm chi tiết sản phẩm
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCustomerInfo"
                  checked={options.includeCustomerInfo}
                  onCheckedChange={(checked) => 
                    setOptions({ ...options, includeCustomerInfo: checked as boolean })
                  }
                />
                <label htmlFor="includeCustomerInfo" className="text-sm cursor-pointer">
                  Bao gồm thông tin khách hàng
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleExport} disabled={loading} className="gap-2">
            <Download className="h-4 w-4" />
            {loading ? 'Đang xuất...' : 'Xuất Excel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
