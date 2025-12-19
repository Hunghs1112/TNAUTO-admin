# Cập nhật khẩn: Video URL Validation - Thêm hỗ trợ TikTok và các nền tảng khác

## ⚠️ Vấn đề hiện tại

Backend đang reject TikTok URLs với lỗi:
```
Invalid video URL format. Supported formats: YouTube embed/watch/short URL, Vimeo embed/URL, or direct video URL (.mp4, .webm, .ogg, .mov)
```

**Ví dụ URL bị reject:**
```
https://www.tiktok.com/@meo_choiwooje/video/7585533329835920648?is_from_webapp=1&sender_device=pc
```

## ✅ Giải pháp

### Cập nhật Validation Function

**Cần cập nhật function `validateVideoUrl()` trong backend để hỗ trợ:**

1. **TikTok URLs:**
   - `https://www.tiktok.com/@username/video/VIDEO_ID` (có thể có query params)
   - `https://vm.tiktok.com/CODE` (short URL)

2. **Facebook URLs:**
   - `https://facebook.com/...`
   - `https://fb.com/...`
   - `https://fb.watch/...`

3. **Instagram URLs:**
   - `https://instagram.com/p/POST_ID/`
   - `https://instagram.com/reel/REEL_ID/`

### Code mẫu cập nhật (JavaScript/Node.js)

```javascript
function validateVideoUrl(url) {
  if (!url || url.trim() === '') {
    return { valid: true, type: null }; // NULL is allowed
  }
  
  // Remove query params for validation (but keep original URL for storage)
  const cleanUrl = url.split('?')[0];
  
  // YouTube
  const youtubeEmbedRegex = /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/;
  const youtubeShortRegex = /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/;
  const youtubeWatchRegex = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
  
  // Vimeo
  const vimeoEmbedRegex = /^https?:\/\/player\.vimeo\.com\/video\/([0-9]+)/;
  const vimeoRegex = /^https?:\/\/(www\.)?vimeo\.com\/([0-9]+)/;
  
  // TikTok - THÊM VÀO
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/;
  const tiktokShortRegex = /^https?:\/\/vm\.tiktok\.com\/[a-zA-Z0-9]+/;
  
  // Facebook - THÊM VÀO
  const facebookRegex = /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\/.+/;
  
  // Instagram - THÊM VÀO
  const instagramPostRegex = /^https?:\/\/(www\.)?instagram\.com\/p\/([a-zA-Z0-9_-]+)/;
  const instagramReelRegex = /^https?:\/\/(www\.)?instagram\.com\/reel\/([a-zA-Z0-9_-]+)/;
  
  // Direct video
  const directVideoRegex = /^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$/i;
  
  // Check YouTube
  if (youtubeEmbedRegex.test(cleanUrl) || youtubeShortRegex.test(cleanUrl) || youtubeWatchRegex.test(cleanUrl)) {
    return { valid: true, type: 'youtube', url: url };
  }
  
  // Check Vimeo
  if (vimeoEmbedRegex.test(cleanUrl) || vimeoRegex.test(cleanUrl)) {
    return { valid: true, type: 'vimeo', url: url };
  }
  
  // Check TikTok - THÊM VÀO
  if (tiktokRegex.test(cleanUrl) || tiktokShortRegex.test(cleanUrl)) {
    return { valid: true, type: 'tiktok', url: url };
  }
  
  // Check Facebook - THÊM VÀO
  if (facebookRegex.test(cleanUrl)) {
    return { valid: true, type: 'facebook', url: url };
  }
  
  // Check Instagram - THÊM VÀO
  if (instagramPostRegex.test(cleanUrl) || instagramReelRegex.test(cleanUrl)) {
    return { valid: true, type: 'instagram', url: url };
  }
  
  // Check Direct video
  if (directVideoRegex.test(url)) {
    return { valid: true, type: 'direct', url: url };
  }
  
  return { 
    valid: false, 
    type: null, 
    error: 'Invalid video URL format. Supported: YouTube, Vimeo, TikTok, Facebook, Instagram, or direct video URL' 
  };
}
```

### Code mẫu cập nhật (PHP)

```php
function validateVideoUrl($url) {
    if (empty($url)) {
        return ['valid' => true, 'type' => null];
    }
    
    // Remove query params for validation
    $cleanUrl = explode('?', $url)[0];
    
    // YouTube
    if (preg_match('/^https?:\/\/(www\.)?youtube\.com\/(embed\/|watch\?v=)([a-zA-Z0-9_-]+)/', $cleanUrl) ||
        preg_match('/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)/', $cleanUrl)) {
        return ['valid' => true, 'type' => 'youtube', 'url' => $url];
    }
    
    // Vimeo
    if (preg_match('/^https?:\/\/(player\.)?vimeo\.com\/(video\/)?([0-9]+)/', $cleanUrl)) {
        return ['valid' => true, 'type' => 'vimeo', 'url' => $url];
    }
    
    // TikTok - THÊM VÀO
    if (preg_match('/^https?:\/\/(www\.)?tiktok\.com\/@([^\/]+)\/video\/(\d+)/', $cleanUrl) ||
        preg_match('/^https?:\/\/vm\.tiktok\.com\/[a-zA-Z0-9]+/', $cleanUrl)) {
        return ['valid' => true, 'type' => 'tiktok', 'url' => $url];
    }
    
    // Facebook - THÊM VÀO
    if (preg_match('/^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.watch)\/.+/', $cleanUrl)) {
        return ['valid' => true, 'type' => 'facebook', 'url' => $url];
    }
    
    // Instagram - THÊM VÀO
    if (preg_match('/^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/([a-zA-Z0-9_-]+)/', $cleanUrl)) {
        return ['valid' => true, 'type' => 'instagram', 'url' => $url];
    }
    
    // Direct video
    if (preg_match('/^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$/i', $url)) {
        return ['valid' => true, 'type' => 'direct', 'url' => $url];
    }
    
    return [
        'valid' => false,
        'type' => null,
        'error' => 'Invalid video URL format. Supported: YouTube, Vimeo, TikTok, Facebook, Instagram, or direct video URL'
    ];
}
```

### Code mẫu cập nhật (Python)

```python
import re

def validate_video_url(url):
    if not url or not url.strip():
        return {'valid': True, 'type': None}
    
    # Remove query params for validation
    clean_url = url.split('?')[0]
    
    # YouTube
    youtube_patterns = [
        r'^https?://(www\.)?youtube\.com/embed/([a-zA-Z0-9_-]+)',
        r'^https?://youtu\.be/([a-zA-Z0-9_-]+)',
        r'^https?://(www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]+)'
    ]
    if any(re.match(pattern, clean_url) for pattern in youtube_patterns):
        return {'valid': True, 'type': 'youtube', 'url': url}
    
    # Vimeo
    vimeo_patterns = [
        r'^https?://player\.vimeo\.com/video/([0-9]+)',
        r'^https?://(www\.)?vimeo\.com/([0-9]+)'
    ]
    if any(re.match(pattern, clean_url) for pattern in vimeo_patterns):
        return {'valid': True, 'type': 'vimeo', 'url': url}
    
    # TikTok - THÊM VÀO
    tiktok_patterns = [
        r'^https?://(www\.)?tiktok\.com/@([^/]+)/video/(\d+)',
        r'^https?://vm\.tiktok\.com/[a-zA-Z0-9]+'
    ]
    if any(re.match(pattern, clean_url) for pattern in tiktok_patterns):
        return {'valid': True, 'type': 'tiktok', 'url': url}
    
    # Facebook - THÊM VÀO
    if re.match(r'^https?://(www\.)?(facebook\.com|fb\.com|fb\.watch)/.+', clean_url):
        return {'valid': True, 'type': 'facebook', 'url': url}
    
    # Instagram - THÊM VÀO
    if re.match(r'^https?://(www\.)?instagram\.com/(p|reel)/([a-zA-Z0-9_-]+)', clean_url):
        return {'valid': True, 'type': 'instagram', 'url': url}
    
    # Direct video
    if re.match(r'^https?://.+\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)(\?.*)?$', url, re.IGNORECASE):
        return {'valid': True, 'type': 'direct', 'url': url}
    
    return {
        'valid': False,
        'type': None,
        'error': 'Invalid video URL format. Supported: YouTube, Vimeo, TikTok, Facebook, Instagram, or direct video URL'
    }
```

## 📝 Lưu ý quan trọng

### 1. Query Params trong TikTok URL

**TikTok URLs có thể có query params:**
```
https://www.tiktok.com/@username/video/VIDEO_ID?is_from_webapp=1&sender_device=pc
```

**Xử lý:**
- **Validation:** Chỉ check phần URL trước dấu `?` (loại bỏ query params khi validate)
- **Storage:** Lưu toàn bộ URL (bao gồm query params) vào database
- **Lý do:** Query params không ảnh hưởng đến việc embed, nhưng có thể cần thiết cho tracking

### 2. Regex Patterns

**TikTok pattern chính:**
```regex
^https?://(www\.)?tiktok\.com/@([^/]+)/video/(\d+)
```

**Giải thích:**
- `@([^/]+)` - Capture username (không chứa `/`)
- `video/(\d+)` - Capture video ID (chỉ số)
- Không cần check query params trong regex

### 3. Test Cases

**Các URL cần pass validation:**

```javascript
// TikTok - PASS
"https://www.tiktok.com/@meo_choiwooje/video/7585533329835920648"
"https://www.tiktok.com/@meo_choiwooje/video/7585533329835920648?is_from_webapp=1&sender_device=pc"
"https://tiktok.com/@user/video/1234567890"
"https://vm.tiktok.com/ABC123"

// YouTube - PASS (đã có)
"https://www.youtube.com/watch?v=dQw4w9WgXcQ"
"https://youtu.be/dQw4w9WgXcQ"

// Vimeo - PASS (đã có)
"https://vimeo.com/123456789"

// Facebook - PASS (mới)
"https://www.facebook.com/watch/?v=123456789"
"https://fb.watch/ABC123"

// Instagram - PASS (mới)
"https://www.instagram.com/p/ABC123/"
"https://instagram.com/reel/XYZ789/"

// Direct - PASS (đã có)
"https://example.com/video.mp4"
```

## 🚀 Ưu tiên

**HIGH** - Cần cập nhật ngay để người dùng có thể thêm TikTok videos.

## 📍 Vị trí cần sửa

Tìm function `validateVideoUrl()` hoặc validation cho `video_url` trong:
- Controller: `ProductsController` hoặc tương tự
- Service: `ProductService` hoặc tương tự
- Middleware: Validation middleware cho products

Sau khi cập nhật, test với URL:
```
https://www.tiktok.com/@meo_choiwooje/video/7585533329835920648?is_from_webapp=1&sender_device=pc
```

