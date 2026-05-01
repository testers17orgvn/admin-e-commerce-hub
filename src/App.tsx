import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import { ThemeProvider } from "@/hooks/useTheme";
import { ThemeParticles } from "@/components/effects/ThemeParticles";
import { CustomMascotRenderer } from "@/components/effects/CustomMascotRenderer";
import { MobilePopup } from "@/components/effects/MobilePopup";
import { SEOHead } from "@/components/SEOHead";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookie = lazy(() => import("./pages/Cookie"));
const Chat = lazy(() => import("./pages/Chat"));
const Profile = lazy(() => import("./pages/Profile"));
const MyProducts = lazy(() => import("./pages/MyProducts"));

// Admin
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminBanners = lazy(() => import("./pages/admin/Banners"));
const AdminBlogs = lazy(() => import("./pages/admin/Blogs"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminHomepage = lazy(() => import("./pages/admin/Homepage"));
const AdminContacts = lazy(() => import("./pages/admin/Contacts"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminVouchers = lazy(() => import("./pages/admin/Vouchers"));
const AdminContactSettings = lazy(() => import("./pages/admin/ContactSettings"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const SellerProductReview = lazy(() => import("./pages/admin/SellerProductReview"));
const SellerRequests = lazy(() => import("./pages/admin/SellerRequests"));
const ShipperManagement = lazy(() => import("./pages/admin/ShipperManagement"));
const AdminChat = lazy(() => import("./pages/admin/Chat"));

// Seller
const SellerProducts = lazy(() => import("./pages/seller/SellerProducts"));
const SellerDashboard = lazy(() => import("./pages/seller/SellerDashboard"));
const SellerRevenue = lazy(() => import("./pages/seller/SellerRevenue"));

// Shipper
const ShipperDashboard = lazy(() => import("./pages/shipper/ShipperDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes  
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <ThemeParticles />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SEOHead />
                <CustomMascotRenderer />
                <MobilePopup />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:slug" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/cookie" element={<Cookie />} />
                    <Route path="/chat" element={<Chat />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/blogs" element={<AdminBlogs />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/homepage" element={<AdminHomepage />} />
                    <Route path="/admin/contacts" element={<AdminContacts />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/vouchers" element={<AdminVouchers />} />
                    <Route path="/admin/contact-settings" element={<AdminContactSettings />} />
                    <Route path="/admin/reviews" element={<AdminReviews />} />
                    <Route path="/admin/seller-products" element={<SellerProductReview />} />
                    <Route path="/admin/seller-requests" element={<SellerRequests />} />
                    <Route path="/admin/shipper" element={<ShipperManagement />} />
                    <Route path="/admin/chat" element={<AdminChat />} />
                    
                    {/* Seller Routes */}
                    <Route path="/seller/products" element={<SellerProducts />} />
                    <Route path="/seller/dashboard" element={<SellerDashboard />} />
                    <Route path="/seller/revenue" element={<SellerRevenue />} />
                    
                    {/* Shipper Routes */}
                    <Route path="/shipper" element={<ShipperDashboard />} />
                    <Route path="/shipper/orders" element={<ShipperDashboard />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
