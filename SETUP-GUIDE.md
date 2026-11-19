# Yeni Bolt Hesabına Taşıma Rehberi

Bu dosya, projeyi GitHub üzerinden başka bir Bolt hesabına yüklediğinizde bilmeniz gerekenleri açıklar.

## Otomatik Olanlar (Migration'lar)

Projeyi yeni Bolt hesabına yüklediğinizde Bolt, yeni bir Supabase projesi oluşturur ve `supabase/migrations/` klasöründeki tüm `.sql` dosyalarını sırayla çalıştırır. Aşağıdakiler otomatik olarak yapılır:

- Tüm veritabanı tabloları (words, categories, word_library)
- Row Level Security (RLS) politikaları
- Kelime görselleri için storage bucket ("word-images")
- E-posta onayı olmadan kayıt ve giriş (auto-confirm trigger)
- Geri dönüşüm kutusu için `deleted_at` sütunu
- 17.570 Fince-Türkçe kelime içeren ortak kelime kütüphanesinin doldurulması
- AI görseller için herkese açık okuma izni

## Manuel Yapmanız Gerekenler

### 1. AI Görsel Üretimi (Cloudflare Secrets)

AI ile kelime görseli üretme özelliği Cloudflare Workers AI kullanır. Çalışması için şu secrets'ları eklemeniz gerekir:

Bolt'un Supabase panelinde Edge Functions > Secrets bölümüne gidin ve şunları ekleyin:

- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare hesap ID'niz
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token'ınız (Workers AI erişimi içermeli)

Bu secrets'lar eklenene kadar AI görsel üretimi çalışmaz, ancak uygulamanın geri kalanı sorunsuz çalışır. Kullanıcılar manuel olarak görsel yükleyebilir veya link verebilir.

### 2. Edge Function'ı Yeniden Deploy Edin

GitHub'a yüklediğinizde edge function kaynak kodu `supabase/functions/generate-word-image/` klasöründe gelir, ancak otomatik olarak deploy edilmez. Yeni Bolt hesabında "Deploy Edge Functions" adımını çalıştırmanız gerekir.

## Doğrulama

Yeni hesapta önizlemeyi açtığınızda:

1. Kayıt olun — anında giriş yapabilmelisiniz (e-posta onayı beklenmez)
2. Çıkış yapıp tekrar giriş yapın — sorunsuz çalışmalı
3. Kelime ekleyin — kalıcı olarak kaydedilmeli
4. Kelime kütüphanesinde arama yapın — 17.570 kelime görünmeli
5. Kategori oluşturup oyun oynayın — tüm 12 oyun çalışmalı
