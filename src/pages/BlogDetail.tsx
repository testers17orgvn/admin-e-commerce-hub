import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/lib/types';
import { Calendar, ChevronRight, ArrowLeft, Eye, Clock, Tag, User, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlog() {
      if (!slug) return;
      
      const { data } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      
      if (data) {
        setBlog(data as Blog);
        
        await supabase
          .from('blogs')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);
        
        if (data.category) {
          const { data: related } = await supabase
            .from('blogs')
            .select('*')
            .eq('is_published', true)
            .eq('category', data.category)
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(3);
          setRelatedBlogs((related || []) as Blog[]);
        } else {
          const { data: related } = await supabase
            .from('blogs')
            .select('*')
            .eq('is_published', true)
            .neq('id', data.id)
            .order('published_at', { ascending: false })
            .limit(3);
          setRelatedBlogs((related || []) as Blog[]);
        }
      }
      
      setLoading(false);
    }
    fetchBlog();
    window.scrollTo(0, 0);
  }, [slug]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép link');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl animate-fade-in">
          <div className="space-y-6">
            <div className="h-4 bg-muted animate-pulse rounded w-48" />
            <div className="h-12 bg-muted animate-pulse rounded w-3/4" />
            <div className="flex gap-4">
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
              <div className="h-4 bg-muted animate-pulse rounded w-24" />
            </div>
            <div className="aspect-[21/9] bg-muted animate-pulse rounded-2xl" />
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-6xl">📄</div>
            <h1 className="font-display text-2xl font-bold">Bài viết không tồn tại</h1>
            <p className="text-muted-foreground">Bài viết này có thể đã bị xóa hoặc đường dẫn không đúng.</p>
            <Link to="/blog">
              <Button variant="hero">Quay lại Blog</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b border-border/50">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground/70 line-clamp-1 max-w-[200px]">{blog.title}</span>
          </nav>
        </div>
      </div>

      <article className="container py-8 md:py-16 max-w-4xl animate-fade-in">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Quay lại Blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          {/* Category + Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {blog.category && (
              <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
                {blog.category}
              </Badge>
            )}
            {blog.tags?.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 animate-slide-up">
            {blog.title}
          </h1>

          {/* Excerpt */}
          {blog.excerpt && (
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 animate-slide-up stagger-1">
              {blog.excerpt}
            </p>
          )}

          {/* Author + Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-border/50 animate-slide-up stagger-2">
            <div className="flex items-center gap-4">
              {blog.author_name && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-accent/20">
                    <AvatarImage src={blog.author_avatar || ''} alt={blog.author_name} />
                    <AvatarFallback className="bg-accent/10 text-accent font-bold">
                      {blog.author_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{blog.author_name}</p>
                    {blog.published_at && (
                      <p className="text-xs text-muted-foreground">{formatDate(blog.published_at)}</p>
                    )}
                  </div>
                </div>
              )}
              {!blog.author_name && blog.published_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(blog.published_at)}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {blog.reading_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {blog.reading_time} phút
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {(blog.view_count || 0) + 1}
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {blog.image_url && (
          <div className="aspect-[21/9] overflow-hidden rounded-2xl mb-10 animate-slide-up stagger-3">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none 
            prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/30 prose-h2:pb-3
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-foreground/85
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-md
            prose-li:leading-relaxed
            prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground/80
            prose-pre:bg-charcoal prose-pre:rounded-xl
            prose-code:text-accent prose-code:bg-accent/10 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
            [&_iframe]:rounded-xl [&_iframe]:my-6 [&_iframe]:shadow-md
            [&_video]:rounded-xl [&_video]:my-6 [&_video]:shadow-md
            [&_mark]:px-1 [&_mark]:rounded
            dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: blog.content || '<p class="text-muted-foreground">Chưa có nội dung.</p>' }}
        />

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border/50">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="hover:bg-accent/10 transition-colors">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-10 pt-8 border-t border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm font-medium text-muted-foreground">Chia sẻ bài viết</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              >
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(blog.title)}`, '_blank')}
              >
                Twitter
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5" />
                Copy link
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedBlogs.length > 0 && (
        <section className="border-t border-border/50 bg-muted/20 py-16">
          <div className="container max-w-6xl">
            <div className="text-center mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">
                Bài viết liên quan
              </h2>
              <p className="text-muted-foreground">Khám phá thêm các bài viết cùng chủ đề</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-accent/30 hover:shadow-lg transition-all duration-500"
                >
                  <div className="aspect-video overflow-hidden">
                    {relatedBlog.image_url ? (
                      <img
                        src={relatedBlog.image_url}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-accent/10 to-muted flex items-center justify-center">
                        <span className="text-4xl opacity-30">📝</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    {relatedBlog.category && (
                      <Badge variant="secondary" className="mb-3 text-xs">{relatedBlog.category}</Badge>
                    )}
                    <h3 className="font-display font-bold line-clamp-2 group-hover:text-accent transition-colors mb-2">
                      {relatedBlog.title}
                    </h3>
                    {relatedBlog.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{relatedBlog.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {relatedBlog.published_at && <span>{formatDate(relatedBlog.published_at)}</span>}
                      {relatedBlog.reading_time && <span>· {relatedBlog.reading_time} phút đọc</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogDetail;