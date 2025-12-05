import { useEffect, useState } from 'react';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, MailOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const fetchData = async () => {
    const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const markAsRead = async (contact: Contact) => {
    if (!contact.is_read) {
      await supabase.from('contacts').update({ is_read: true }).eq('id', contact.id);
      fetchData();
    }
    setSelectedContact(contact);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa liên hệ này?')) return;
    await supabase.from('contacts').delete().eq('id', id);
    toast.success('Đã xóa');
    fetchData();
  };

  const unreadCount = contacts.filter(c => !c.is_read).length;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Liên hệ</h1>
          {unreadCount > 0 && <Badge className="bg-accent text-accent-foreground">{unreadCount} chưa đọc</Badge>}
        </div>
      </div>

      <div className="bg-card rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Trạng thái</th>
              <th className="text-left p-3 text-sm font-medium">Người gửi</th>
              <th className="text-left p-3 text-sm font-medium">Chủ đề</th>
              <th className="text-left p-3 text-sm font-medium">Ngày gửi</th>
              <th className="text-right p-3 text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className={`border-t ${!c.is_read ? 'bg-accent/5' : ''}`}>
                <td className="p-3">
                  {c.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-accent" />}
                </td>
                <td className="p-3">
                  <div>
                    <p className={`${!c.is_read ? 'font-semibold' : 'font-medium'}`}>{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                  </div>
                </td>
                <td className="p-3">
                  <p className={`${!c.is_read ? 'font-semibold' : ''} line-clamp-1`}>{c.subject || 'Không có chủ đề'}</p>
                </td>
                <td className="p-3 text-muted-foreground text-sm">{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => markAsRead(c)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {contacts.length === 0 && <div className="p-8 text-center text-muted-foreground">Chưa có liên hệ nào</div>}
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết liên hệ</DialogTitle></DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Tên</label>
                  <p className="font-medium">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedContact.email}</p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <label className="text-sm text-muted-foreground">Điện thoại</label>
                    <p className="font-medium">{selectedContact.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground">Ngày gửi</label>
                  <p className="font-medium">{format(new Date(selectedContact.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              {selectedContact.subject && (
                <div>
                  <label className="text-sm text-muted-foreground">Chủ đề</label>
                  <p className="font-medium">{selectedContact.subject}</p>
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Nội dung</label>
                <p className="mt-1 p-3 bg-muted/30 rounded-lg whitespace-pre-wrap">{selectedContact.message}</p>
              </div>
              <Button variant="hero" className="w-full" onClick={() => window.open(`mailto:${selectedContact.email}`)}>
                <Mail className="h-4 w-4 mr-2" /> Gửi email phản hồi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
