import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
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
              Điều khoản dịch vụ
            </h1>
            <p className="text-lg md:text-xl text-white/80">
              Vui lòng đọc kỹ các điều khoản dưới đây trước khi sử dụng dịch vụ của chúng tôi
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

          {/* Terms Content */}
          <div className="prose prose-invert max-w-none space-y-6">
            {/* Section 1 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">1. Chấp nhận Điều khoản</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Bằng cách truy cập và sử dụng trang web này, bạn chấp nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi tất cả các điều khoản và điều kiện của dịch vụ. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
                </p>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">2. Sử dụng Giấy phép</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Chúng tôi cấp cho bạn giấy phép hạn chế, không độc quyền, không thể chuyển nhượng để truy cập và sử dụng trang web này cho các mục đích cá nhân, không thương mại.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Bạn không được:
                </p>
                <ul className="text-muted-foreground leading-relaxed space-y-2 mt-3 ml-4">
                  <li>• Sửa đổi hoặc sao chép tài liệu</li>
                  <li>• Sử dụng tài liệu cho mục đích thương mại hoặc công khai</li>
                  <li>• Cố gắng khỏa lộ bất kỳ mã bảo mật nào</li>
                  <li>• Chuyển nhượng tài liệu sang một người khác hoặc "phản ánh" trang web trên máy chủ khác</li>
                  <li>• Sử dụng trang web cho bất kỳ mục đích bất pháp hoặc không được phép</li>
                </ul>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">3. Miễn trừ trách nhiệm</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Các tài liệu trên trang web của chúng tôi được cung cấp trên cơ sở "như là". Chúng tôi không đưa ra bất kỳ bảo đảm, được diễn tả hay được ngụ ý. Chúng tôi từ chối tất cả các bảo đảm khác bao gồm nhưng không giới hạn ở các bảo đảm đối với tính phù hợp, tính hợp lệ cho một mục đích cụ thể, hoặc không vi phạm quyền sở hữu trí tuệ.
                </p>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">4. Giới hạn trách nhiệm</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Trong trường hợp nào chúng tôi hoặc các nhà cung cấp của chúng tôi sẽ chịu trách nhiệm về bất kỳ thiệt hại nào (bao gồm nhưng không giới hạn ở thiệt hại do lợi nhuận bị mất, dữ liệu bị mất hoặc gián đoạn kinh doanh) phát sinh từ việc sử dụng hoặc không thể sử dụng các tài liệu trên trang web của chúng tôi.
                </p>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">5. Độ chính xác của các vật liệu</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Các tài liệu xuất hiện trên trang web của chúng tôi có thể chứa các lỗi kỹ thuật, đánh máy hoặc lỗi chụp ảnh. Chúng tôi không đảm bảo rằng bất kỳ tài liệu nào trên trang web của chúng tôi đều chính xác, hoàn chỉnh hoặc hiện tại.
                </p>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">6. Liên kết</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi chưa xem xét tất cả các trang web được liên kết đến trang web của chúng tôi và không chịu trách nhiệm về nội dung của bất kỳ trang web được liên kết nào. Việc bao gồm bất kỳ liên kết nào không ngụ ý sự chứng thực bởi chúng tôi về trang web. Việc sử dụng bất kỳ trang web được liên kết nào là rủi ro của người dùng.
                </p>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">7. Sửa đổi</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Chúng tôi có thể sửa đổi các điều khoản dịch vụ của trang web của chúng tôi bất cứ lúc nào mà không cần thông báo. Bằng cách sử dụng trang web này, bạn đồng ý bị ràng buộc bởi phiên bản hiện tại của các điều khoản dịch vụ.
                </p>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">8. Luật Áp dụng</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Các điều khoản và điều kiện này và bất kỳ hợp đồng hoặc tài liệu bổ sung nào liên quan đến việc sử dụng trang web này sẽ được quản lý và được diễn giải theo luật pháp của Việt Nam, và bạn không thể phản đối sự thích hợp của các tòa án hoặc địa điểm tòa án trong các tòa án đó.
                </p>
              </CardContent>
            </Card>

            {/* Section 9 */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <h2 className="font-display text-2xl font-bold mb-4">9. Liên hệ</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Nếu bạn có bất kỳ câu hỏi về Điều khoản dịch vụ, vui lòng liên hệ với chúng tôi thông qua trang liên hệ của chúng tôi.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
