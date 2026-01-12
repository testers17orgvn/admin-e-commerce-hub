import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, MapPin, Phone, User, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Address {
  id: string;
  full_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string | null;
  address_detail: string;
  is_default: boolean;
}

const initialAddress = {
  full_name: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  address_detail: '',
  is_default: false,
};

export function AddressBook() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState(initialAddress);

  const fetchAddresses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    
    if (error) {
      console.error('Error fetching addresses:', error);
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.full_name || !formData.phone || !formData.province || !formData.district || !formData.address_detail) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);

    // If setting as default, unset other defaults first
    if (formData.is_default) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const addressData = {
      user_id: user.id,
      full_name: formData.full_name,
      phone: formData.phone,
      province: formData.province,
      district: formData.district,
      ward: formData.ward || null,
      address_detail: formData.address_detail,
      is_default: formData.is_default,
    };

    let error;
    if (editingAddress) {
      const result = await supabase.from('user_addresses').update(addressData).eq('id', editingAddress.id);
      error = result.error;
    } else {
      const result = await supabase.from('user_addresses').insert([addressData]);
      error = result.error;
    }

    if (error) {
      toast.error('Lỗi lưu địa chỉ');
    } else {
      toast.success(editingAddress ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công');
      setIsDialogOpen(false);
      resetForm();
      fetchAddresses();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    
    const { error } = await supabase.from('user_addresses').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi xóa địa chỉ');
    } else {
      toast.success('Xóa địa chỉ thành công');
      fetchAddresses();
    }
  };

  const setAsDefault = async (address: Address) => {
    if (address.is_default) return;
    
    await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user?.id);
    await supabase.from('user_addresses').update({ is_default: true }).eq('id', address.id);
    toast.success('Đã đặt làm địa chỉ mặc định');
    fetchAddresses();
  };

  const resetForm = () => {
    setFormData(initialAddress);
    setEditingAddress(null);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      full_name: address.full_name,
      phone: address.phone,
      province: address.province,
      district: address.district,
      ward: address.ward || '',
      address_detail: address.address_detail,
      is_default: address.is_default,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Sổ địa chỉ ({addresses.length})</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" /> Thêm địa chỉ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                {editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Họ tên *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0909123456"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tỉnh/Thành phố *</Label>
                  <Input
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="TP. Hồ Chí Minh"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quận/Huyện *</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Quận 1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phường/Xã</Label>
                <Input
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="Phường Bến Nghé"
                />
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ chi tiết *</Label>
                <Textarea
                  value={formData.address_detail}
                  onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                  placeholder="Số nhà, tên đường, tòa nhà..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label>Đặt làm địa chỉ mặc định</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                  {saving ? 'Đang lưu...' : (editingAddress ? 'Cập nhật' : 'Thêm địa chỉ')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-2">Chưa có địa chỉ nào</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Thêm địa chỉ giao hàng để đặt hàng nhanh hơn
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={`relative overflow-hidden transition-all ${address.is_default ? 'ring-2 ring-accent' : ''}`}>
              {address.is_default && (
                <div className="absolute top-0 right-0 bg-accent text-white text-xs px-3 py-1 rounded-bl-lg">
                  <Star className="h-3 w-3 inline mr-1" />
                  Mặc định
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{address.full_name}</span>
                      <span className="text-muted-foreground">|</span>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{address.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {address.address_detail}, {address.ward && `${address.ward}, `}{address.district}, {address.province}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {!address.is_default && (
                      <Button variant="ghost" size="sm" onClick={() => setAsDefault(address)}>
                        Đặt mặc định
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(address)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(address.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
