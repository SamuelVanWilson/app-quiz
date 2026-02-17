# Custom Quiz Engine - Pretty URLs Setup

✅ **Pretty URLs berhasil dikonfigurasi!**

## Akses Aplikasi

Sekarang Anda bisa mengakses aplikasi dengan URL yang lebih bersih:

### ✅ Pretty URL (Recommended)
```
http://localhost/quiz smart/
http://localhost/quiz smart/index
```

### ❌ Old URL (akan redirect otomatis)
```
http://localhost/quiz smart/index.html
```

## Cara Kerja

File `.htaccess` sudah dikonfigurasi dengan:

1. **URL Rewriting**: Menghilangkan ekstensi `.html` dari URL
2. **301 Redirect**: Otomatis redirect dari `/index.html` ke `/index`
3. **Direct Access**: File `.html` tetap bisa diakses langsung oleh server

## Struktur File (Fully Separated)

```
quiz smart/
├── .htaccess          (Apache URL rewriting config)
├── index.html         (HTML structure only - no inline styles/scripts)
├── styles.css         (All CSS including utility classes)
├── script.js          (All JavaScript logic)
└── quiz-engine.html   (Legacy single-file version)
```

## Clean Separation Checklist

✅ **HTML (index.html)**
- Hanya struktur semantic
- Tidak ada inline `style` attributes
- Tidak ada inline `<script>` tags
- Tidak ada inline event handlers (semua di script.js)

✅ **CSS (styles.css)**
- Semua styling termasuk animations
- Utility classes (.svg-hidden, .sr-only)
- Progress bar initial states
- Responsive design

✅ **JavaScript (script.js)**
- Semua logic dan event handlers
- State management
- Timer functions
- Export functionality

## Testing

Untuk test pretty URLs:

1. Buka browser
2. Akses: `http://localhost/quiz smart/`
3. Pastikan halaman load dengan benar
4. Check browser console untuk error

## Notes

> [!IMPORTANT]
> **Apache mod_rewrite** harus aktif di Laragon. Biasanya sudah default aktif, tapi jika pretty URLs tidak bekerja, cek:
> 1. Laragon → Menu → Apache → httpd.conf
> 2. Cari `LoadModule rewrite_module`
> 3. Pastikan tidak di-comment (tidak ada # di depan)
> 4. Restart Apache

> [!TIP]
> Dengan pretty URLs, link internal dan external akan lebih SEO-friendly dan user-friendly!
