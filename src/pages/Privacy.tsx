import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
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
              Chính sách bảo mật
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              Chúng tôi cam kết bảo vệ quyền riêng tư của bạn
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

          {/* Privacy Content */}
          <div className="prose prose-invert max-w-none space-y-6">
            {/* Section 1 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">1. Giới thiệu</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, công khai và bảo vệ thông tin của bạn khi bạn sử dụng trang web, ứng dụng di động và các dịch vụ khác của chúng tôi (được gọi chung là "Dịch vụ").
                </p>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">2. Thông tin chúng tôi thu thập</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Chúng tôi có thể thu thập thông tin về bạn theo những cách sau:
                </p>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Thông tin do bạn cung cấp trực tiếp:</h3>
                    <ul className="text-muted-foreground leading-relaxed space-y-2 ml-4">
                      <li>• Tên, địa chỉ email, số điện thoại và địa chỉ</li>
                      <li>• Thông tin thanh toán (số thẻ tín dụng, tài khoản ngân hàng)</li>
                      <li>• Lịch sử mua hàng và sở thích</li>
                      <li>• Thông tin hồ sơ và mật khẩu</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Thông tin thu thập tự động:</h3>
                    <ul className="text-muted-foreground leading-relaxed space-y-2 ml-4">
                      <li>• Địa chỉ IP, loại trình duyệt và hệ điều hành</li>
                      <li>• Trang được truy cập và thời gian dành cho mỗi trang</li>
                      <li>• Cookie và công nghệ theo dõi tương tự</li>
                      <li>• Vị trí địa lý (nếu được cấp phép)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">3. Cách chúng tôi sử dụng thông tin của bạn</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Chúng tôi sử dụng thông tin được thu thập cho các mục đích sau:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 ml-4">
                  <li>• Xử lý và hoàn thành các đơn hàng của bạn</li>
                  <li>• Gửi thông tin đơn hàng, cập nhật và tin tức liên quan</li>
                  <li>• Cải thiện dịch vụ và trải nghiệm người dùng</li>
                  <li>• Giữ tài khoản của bạn an toàn và chống gian lận</li>
                  <li>• Tuân thủ các yêu cầu pháp lý</li>
                  <li>• Gửi các email tiếp thị (có thể từ chối)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">4. Chia sẻ thông tin của bạn</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi không bán, không trao đổi hoặc cho thuê thông tin cá nhân của bạn cho bên thứ ba. Tuy nhiên, chúng tôi có thể chia sẻ thông tin với:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 mt-3 ml-4">
                  <li>• Nhà cung cấp dịch vụ giúp chúng tôi vận hành dịch vụ</li>
                  <li>• Các nhà cung cấp thanh toán để xử lý giao dịch</li>
                  <li>• Công ty giao hàng để vận chuyển đơn hàng của bạn</li>
                  <li>• Khi được yêu cầu bởi pháp luật hoặc quyền tư pháp</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">5. Bảo vệ dữ liệu</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi sử dụng các biện pháp bảo mật thích hợp để bảo vệ thông tin cá nhân của bạn khỏi truy cập, sửa đổi, công khai hoặc phá hủy trái phép. Tuy nhiên, không có phương pháp truyền qua Internet hoặc lưu trữ điện tử nào hoàn toàn an toàn.
                </p>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">6. Cookie</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi sử dụng cookie để cải thiện trải nghiệm của bạn. Cookie là những tập tin nhỏ được lưu trữ trên thiết bị của bạn. Bạn có thể kiểm soát cookie thông qua cài đặt trình duyệt của mình.
                </p>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">7. Quyền của bạn</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bạn có quyền:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 mt-3 ml-4">
                  <li>• Truy cập thông tin cá nhân của bạn</li>
                  <li>• Yêu cầu sửa chữa thông tin không chính xác</li>
                  <li>• Yêu cầu xóa thông tin của bạn</li>
                  <li>• Từ chối liên lạc tiếp thị</li>
                  <li>• Lấy một bản sao dữ liệu của bạn</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">8. Liên hệ với chúng tôi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nếu bạn có câu hỏi về Chính sách bảo mật này hoặc cách chúng tôi xử lý dữ liệu của bạn, vui lòng liên hệ với chúng tôi thông qua trang liên hệ hoặc gửi email cho chúng tôi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Privacy;
