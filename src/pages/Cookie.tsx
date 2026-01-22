import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const Cookie = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-charcoal via-charcoal-light to-charcoal overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--accent)/0.2),transparent_40%)]" />
        </div>
        <div className="container py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Chính sách Cookie
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              Hiểu rõ cách chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Last Updated */}
          <div className="text-center text-muted-foreground text-sm">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </div>

          {/* Cookie Content */}
          <div className="prose prose-invert max-w-none space-y-6">
            {/* Section 1 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">1. Cookie là gì?</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Cookie là những tệp tin nhỏ được lưu trữ trên thiết bị của bạn (máy tính, điện thoại, máy tính bảng) khi bạn truy cập trang web. Chúng được sử dụng để lưu trữ thông tin về sở thích của bạn, giúp cải thiện trải nghiệm duyệt web của bạn.
                </p>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">2. Loại Cookie chúng tôi sử dụng</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cookie Thiết yếu</h3>
                    <p className="text-muted-foreground">
                      Những cookie này là cần thiết để trang web hoạt động đúng. Chúng cho phép bạn đăng nhập vào tài khoản, thêm sản phẩm vào giỏ hàng và hoàn thành thanh toán.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cookie Hiệu suất</h3>
                    <p className="text-muted-foreground">
                      Những cookie này giúp chúng tôi hiểu cách khách truy cập sử dụng trang web bằng cách thu thập và báo cáo thông tin ẩn danh. Điều này giúp chúng tôi cải thiện hiệu suất trang web.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cookie Chức năng</h3>
                    <p className="text-muted-foreground">
                      Những cookie này cho phép trang web ghi nhớ các lựa chọn của bạn (như tên người dùng, ngôn ngữ hoặc khu vực bạn ở) để cung cấp các tính năng nâng cao và được cá nhân hóa.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Cookie Tiếp thị</h3>
                    <p className="text-muted-foreground">
                      Những cookie này được sử dụng để theo dõi khách truy cập trên các trang web. Mục đích là hiển thị quảng cáo có liên quan và hấp dẫn cho từng người dùng riêng lẻ.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">3. Cookies của bên thứ ba</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Ngoài cookie của riêng chúng tôi, chúng tôi cũng có thể sử dụng cookie của bên thứ ba từ các nhà cung cấp dịch vụ khác, chẳng hạn như:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 mt-3 ml-4">
                  <li>• Google Analytics để phân tích hành vi người dùng</li>
                  <li>• Facebook Pixel cho quảng cáo lại</li>
                  <li>• Các nhà cung cấp thanh toán để xử lý giao dịch</li>
                  <li>• Các nhà cung cấp dịch vụ khác nhằm cải thiện dịch vụ</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">4. Cách kiểm soát Cookie</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Bạn có thể kiểm soát và xóa cookie bất cứ lúc nào. Hầu hết các trình duyệt web đều cho phép bạn:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 ml-4">
                  <li>• Xem cookie đã được đặt</li>
                  <li>• Xóa tất cả hoặc một số cookie</li>
                  <li>• Chặn các cookie mới được đặt</li>
                  <li>• Xóa cookie khi đóng trình duyệt</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Xin lưu ý rằng việc vô hiệu hóa cookie có thể ảnh hưởng đến chức năng của trang web.
                </p>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">5. Do Not Track</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Một số trình duyệt web bao gồm tính năng Do Not Track (DNT). Hiện tại, chưa có tiêu chuẩn ngành được thiết lập về cách nhận dạng và phản hồi tín hiệu DNT.
                </p>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">6. Sự thay đổi của Chính sách này</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi có thể cập nhật Chính sách Cookie của mình bất cứ lúc nào. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi nào bằng cách đăng Chính sách mới trên trang này.
                </p>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">7. Liên hệ với chúng tôi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nếu bạn có bất kỳ câu hỏi nào về Chính sách Cookie này, vui lòng liên hệ với chúng tôi thông qua trang liên hệ của chúng tôi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cookie;
