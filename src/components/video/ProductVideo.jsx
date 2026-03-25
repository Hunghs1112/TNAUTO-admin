// src/components/video/ProductVideo.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * Component hiển thị video sản phẩm
 * Hỗ trợ: YouTube, Vimeo, TikTok, Facebook, Instagram, và direct video URLs
 */
export default function ProductVideo({ videoUrl, className = '' }) {
  if (!videoUrl) {
    return null;
  }

  // Normalize và detect loại video
  const normalizeVideoUrl = (url) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = null;
      
      // youtube.com/watch?v=VIDEO_ID
      if (url.includes('watch?v=')) {
        videoId = url.split('watch?v=')[1]?.split('&')[0];
      }
      // youtube.com/embed/VIDEO_ID (đã là embed format)
      else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1]?.split('?')[0];
      }
      // youtu.be/VIDEO_ID
      else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return {
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          aspectRatio: '16:9'
        };
      }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      let videoId = null;
      
      // player.vimeo.com/video/VIDEO_ID (đã là embed format)
      if (url.includes('player.vimeo.com/video/')) {
        videoId = url.split('player.vimeo.com/video/')[1]?.split('?')[0];
      }
      // vimeo.com/VIDEO_ID
      else if (url.includes('vimeo.com/')) {
        videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        return {
          type: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          aspectRatio: '16:9'
        };
      }
    }
    
    // TikTok
    if (url.includes('tiktok.com')) {
      // Extract video ID từ URL
      // Format: https://www.tiktok.com/@username/video/VIDEO_ID
      // Hoặc: https://vm.tiktok.com/CODE
      let videoId = null;
      let username = null;
      
      // tiktok.com/@username/video/VIDEO_ID
      const tiktokMatch = url.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/);
      if (tiktokMatch) {
        username = tiktokMatch[1];
        videoId = tiktokMatch[2];
        return {
          type: 'tiktok',
          embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
          aspectRatio: '9:16', // TikTok videos are vertical
          fallbackUrl: url // Fallback to original URL if embed doesn't work
        };
      }
      
      // vm.tiktok.com short URL - redirect to full URL first
      if (url.includes('vm.tiktok.com')) {
        return {
          type: 'tiktok',
          embedUrl: url,
          aspectRatio: '9:16',
          isShortUrl: true
        };
      }
    }
    
    // Facebook Video
    if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch')) {
      // Facebook videos need to be embedded using their embed API
      // Format: https://www.facebook.com/plugins/video.php?href=ENCODED_URL
      const encodedUrl = encodeURIComponent(url);
      return {
        type: 'facebook',
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&width=500`,
        aspectRatio: '16:9'
      };
    }
    
    // Instagram Video/Reel
    if (url.includes('instagram.com')) {
      // Instagram embed format
      // Format: https://www.instagram.com/p/POST_ID/embed/
      let postId = null;
      
      // instagram.com/p/POST_ID/
      const instagramMatch = url.match(/instagram\.com\/p\/([^\/\?]+)/);
      if (instagramMatch) {
        postId = instagramMatch[1];
        return {
          type: 'instagram',
          embedUrl: `https://www.instagram.com/p/${postId}/embed/`,
          aspectRatio: '1:1' // Instagram posts are usually square
        };
      }
      
      // instagram.com/reel/REEL_ID/
      const reelMatch = url.match(/instagram\.com\/reel\/([^\/\?]+)/);
      if (reelMatch) {
        postId = reelMatch[1];
        return {
          type: 'instagram',
          embedUrl: `https://www.instagram.com/reel/${postId}/embed/`,
          aspectRatio: '9:16' // Reels are vertical
        };
      }
    }
    
    // Direct video URLs
    if (/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$/i.test(url)) {
      return {
        type: 'direct',
        embedUrl: url,
        aspectRatio: '16:9'
      };
    }
    
    return null;
  };

  const videoInfo = normalizeVideoUrl(videoUrl);

  if (!videoInfo) {
    // Invalid video URL format
    return (
      <div className={`product-video-error ${className} p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800`}>
        <p className="text-red-600 dark:text-red-400 text-sm mb-2">
          URL video không hợp lệ hoặc không được hỗ trợ.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Hỗ trợ: YouTube, Vimeo, TikTok, Facebook, Instagram, hoặc direct video URL (.mp4, .webm, .ogg, .mov)
        </p>
      </div>
    );
  }

  // Calculate aspect ratio padding
  const getAspectRatioPadding = (ratio) => {
    const ratios = {
      '16:9': 56.25, // 9/16 * 100
      '9:16': 177.78, // 16/9 * 100
      '1:1': 100, // 1/1 * 100
      '4:3': 75, // 3/4 * 100
    };
    return ratios[ratio] || 56.25;
  };

  // TikTok oEmbed API - Fetch embed code
  const [tiktokEmbedHtml, setTiktokEmbedHtml] = useState('');
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [tiktokError, setTiktokError] = useState(null);
  const tiktokEmbedFetched = useRef(false);
  
  useEffect(() => {
    if (videoInfo?.type === 'tiktok' && !videoInfo.isShortUrl && !tiktokEmbedFetched.current) {
      const fetchTikTokEmbed = async () => {
        setTiktokLoading(true);
        setTiktokError(null);
        tiktokEmbedFetched.current = true;
        
        try {
          // Clean URL (remove query params for oEmbed API)
          const cleanUrl = videoUrl.split('?')[0];
          
          // TikTok oEmbed API endpoint
          const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`;
          
          const response = await fetch(oEmbedUrl);
          
          if (!response.ok) {
            throw new Error(`TikTok oEmbed API returned ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.html) {
            setTiktokEmbedHtml(data.html);
          } else {
            throw new Error('TikTok oEmbed API did not return HTML');
          }
        } catch (error) {
          console.error('Error fetching TikTok embed:', error);
          setTiktokError(error.message);
          // Fallback to blockquote method
          setTiktokEmbedHtml(null);
        } finally {
          setTiktokLoading(false);
        }
      };
      
      fetchTikTokEmbed();
    }
  }, [videoInfo?.type, videoUrl]);

  // TikTok special handling (use oEmbed API)
  if (videoInfo.type === 'tiktok' && !videoInfo.isShortUrl) {
    // Extract video ID and username from URL for fallback
    const cleanUrl = videoUrl.split('?')[0];
    const tiktokMatch = cleanUrl.match(/tiktok\.com\/@([^\/]+)\/video\/(\d+)/);
    const username = tiktokMatch ? tiktokMatch[1] : null;
    const videoId = tiktokMatch ? tiktokMatch[2] : null;
    
    if (!videoId) {
      return (
        <div className={`product-video-error ${className} p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800`}>
          <p className="text-red-600 dark:text-red-400 text-sm">
            Không thể parse TikTok URL. Vui lòng sử dụng format: https://www.tiktok.com/@username/video/VIDEO_ID
          </p>
        </div>
      );
    }
    
    // Loading state
    if (tiktokLoading) {
      return (
        <div className={`product-video ${className} flex items-center justify-center p-8`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải video TikTok...</p>
          </div>
        </div>
      );
    }
    
    // Error state with fallback
    if (tiktokError && !tiktokEmbedHtml) {
      // Fallback to blockquote method
      return (
        <div className={`product-video ${className}`}>
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-600 dark:text-yellow-400">
            Không thể tải embed từ TikTok API. Đang sử dụng phương pháp dự phòng.
          </div>
          <div className="flex justify-center w-full">
            <blockquote 
              className="tiktok-embed" 
              cite={cleanUrl}
              data-video-id={videoId}
              style={{ 
                maxWidth: '605px',
                minWidth: '325px',
                width: '100%'
              }}
            >
              <section>
                <a 
                  target="_blank" 
                  title={`@${username}`}
                  href={`https://www.tiktok.com/@${username}?refer=embed`}
                >
                  @{username}
                </a>
              </section>
            </blockquote>
          </div>
          {/* Load TikTok embed script for fallback */}
          {!document.querySelector('script[src="https://www.tiktok.com/embed.js"]') && (
            <script async src="https://www.tiktok.com/embed.js"></script>
          )}
        </div>
      );
    }
    
    // Use oEmbed HTML if available
    if (tiktokEmbedHtml) {
      return (
        <div className={`product-video ${className} flex justify-center w-full`}>
          <div 
            dangerouslySetInnerHTML={{ __html: tiktokEmbedHtml }}
            style={{ maxWidth: '100%', width: '100%' }}
          />
        </div>
      );
    }
    
    // Final fallback to blockquote
    return (
      <div className={`product-video ${className} flex justify-center w-full`}>
        <blockquote 
          className="tiktok-embed" 
          cite={cleanUrl}
          data-video-id={videoId}
          style={{ 
            maxWidth: '605px',
            minWidth: '325px',
            width: '100%'
          }}
        >
          <section>
            <a 
              target="_blank" 
              title={`@${username}`}
              href={`https://www.tiktok.com/@${username}?refer=embed`}
            >
              @{username}
            </a>
          </section>
        </blockquote>
        {/* Load TikTok embed script for fallback */}
        {!document.querySelector('script[src="https://www.tiktok.com/embed.js"]') && (
          <script async src="https://www.tiktok.com/embed.js"></script>
        )}
      </div>
    );
  }

  // TikTok short URL - show link
  if (videoInfo.type === 'tiktok' && videoInfo.isShortUrl) {
    return (
      <div className={`product-video ${className} p-4 bg-gray-100 dark:bg-slate-700 rounded-lg`}>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          TikTok short URL được phát hiện. Vui lòng sử dụng URL đầy đủ để embed.
        </p>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-sm"
        >
          Mở video trên TikTok →
        </a>
      </div>
    );
  }

  // Direct video
  if (videoInfo.type === 'direct') {
    return (
      <div className={`product-video ${className}`}>
        <video
          src={videoInfo.embedUrl}
          controls
          className="w-full rounded-lg"
          style={{ maxHeight: '500px' }}
        >
          Trình duyệt của bạn không hỗ trợ thẻ video.
        </video>
      </div>
    );
  }

  // Embed videos (YouTube, Vimeo, Facebook, Instagram)
  return (
    <div className={`product-video ${className}`}>
      <div className="relative w-full" style={{ paddingBottom: `${getAspectRatioPadding(videoInfo.aspectRatio)}%` }}>
        <iframe
          src={videoInfo.embedUrl}
          className="absolute top-0 left-0 w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Video sản phẩm"
        />
      </div>
    </div>
  );
}

