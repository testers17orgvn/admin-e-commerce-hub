import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/lib/types';
import { Calendar, ChevronRight, ArrowLeft, Eye, Clock, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

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
        
        // Increment view count
        await supabase
          .from('blogs')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);
        
        // Fetch related blogs (same category or tags)
        const { data: related } = await supabase
          .from('blogs')
          .select('*')
          .eq('is_published', true)
          .neq('id', data.id)
          .limit(3);
        
        // Filter by category or tags if available
        let filteredRelated = related || [];
        if (data.category) {
          const categoryMatches = filteredRelated.filter(b => b.category === data.category);
          if (categoryMatches.length > 0) {
            filteredRelated = categoryMatches;
          }
        }
        
        setRelatedBlogs(filteredRelated.slice(0, 3) as Blog[]);
      }
      
      setLoading(false);
    }
    fetchBlog();
  }, [slug]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 max-w-4xl">
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
            <div className="aspect-video bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!blog) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Bài viết không tồn tại</h1>
          <Link to="/blog">
            <Button>Quay lại Blog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground line-clamp-1">{blog.title}</span>
          </nav>
        </div>
      </div>

      <article className="container py-12 max-w-4xl">
        {/* Back button */}
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Quay lại Blog
        </Link>

        {/* Category Badge */}
        {blog.category && (
          <Badge variant="secondary" className="mb-4">
            {blog.category}
          </Badge>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {blog.title}
          </h1>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {blog.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.published_at)}
              </div>
            )}
            {blog.reading_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {blog.reading_time} phút đọc
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {(blog.view_count || 0) + 1} lượt xem
            </div>
          </div>
        </header>

        {/* Author Info */}
        {blog.author_name && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg mb-8">
            <Avatar className="h-12 w-12">
              <AvatarImage src={blog.author_avatar || ''} alt={blog.author_name} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{blog.author_name}</p>
              <p className="text-sm text-muted-foreground">Tác giả</p>
            </div>
          </div>
        )}

        {/* Featured Image */}
        {blog.image_url && (
          <div className="aspect-video overflow-hidden rounded-lg mb-8">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Excerpt */}
        {blog.excerpt && (
          <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 mb-8">
            {blog.excerpt}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg">
          {blog.content ? (
            <div dangerouslySetInnerHTML={{ __html: blog.content }} />
          ) : (
            <p className="text-muted-foreground">Chưa có nội dung.</p>
          )}
        </div>

        {/* Tags */}
        {blog.tags && blog.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {blog.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share section */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Chia sẻ bài viết:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank')}
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${blog.title}`, '_blank')}
            >
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
            >
              Sao chép link
            </Button>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedBlogs.length > 0 && (
        <section className="bg-muted/30 py-12">
          <div className="container">
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
              Bài viết liên quan
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.id}
                  to={`/blog/${relatedBlog.slug}`}
                  className="group bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video overflow-hidden">
                    {relatedBlog.image_url ? (
                      <img
                        src={relatedBlog.image_url}
                        alt={relatedBlog.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
                    )}
                  </div>
                  <div className="p-4">
                    {relatedBlog.category && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {relatedBlog.category}
                      </Badge>
                    )}
                    <h3 className="font-display font-bold line-clamp-2 group-hover:text-primary transition-colors">
                      {relatedBlog.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {relatedBlog.published_at && (
                        <span>{formatDate(relatedBlog.published_at)}</span>
                      )}
                      {relatedBlog.reading_time && (
                        <span>{relatedBlog.reading_time} phút đọc</span>
                      )}
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
