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

import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OrderHistory from "./pages/OrderHistory";
import Wishlist from "./pages/Wishlist";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookie from "./pages/Cookie";

import Profile from "./pages/Profile";

import Dashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCategories from "./pages/admin/Categories";
import AdminBanners from "./pages/admin/Banners";
import AdminBlogs from "./pages/admin/Blogs";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminHomepage from "./pages/admin/Homepage";
import AdminContacts from "./pages/admin/Contacts";
import AdminSettings from "./pages/admin/Settings";
import AdminVouchers from "./pages/admin/Vouchers";
import AdminContactSettings from "./pages/admin/ContactSettings";
import AdminReviews from "./pages/admin/Reviews";
import SellerProductReview from "./pages/admin/SellerProductReview";
import SellerRequests from "./pages/admin/SellerRequests";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerDashboard from "./pages/seller/SellerDashboard";

const queryClient = new QueryClient();

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
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/cookie" element={<Cookie />} />
                  
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
                  
                  {/* Seller Routes */}
                  <Route path="/seller/products" element={<SellerProducts />} />
                  <Route path="/seller/dashboard" element={<SellerDashboard />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
