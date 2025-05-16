# Mengatasi Masalah Format Harga

Jika Anda mengalami masalah dengan format harga (misalnya, memasukkan 30000 tetapi dikonversi menjadi Rp. 0,30), itu menandakan adanya masalah konversi nilai. Untuk memperbaikinya:

## 1. Pastikan Struktur Database Sudah Benar

Pastikan kolom `price` di tabel `Books` adalah `DECIMAL(12,2)` dengan menjalankan SQL berikut:

```sql
USE book_management;
ALTER TABLE Books MODIFY COLUMN price DECIMAL(12,2) NOT NULL;
```

## 2. Perbaiki Data yang Sudah Ada di Database

Jika Anda sudah memiliki data di database dengan harga yang salah, jalankan SQL berikut:

```sql
UPDATE Books SET price = price * 100 WHERE price < 1 AND price > 0;
```

## 3. Cara Input Harga yang Benar

Saat input harga di aplikasi:
- Masukkan angka utuh tanpa titik/koma pemisah (contoh: 30000 untuk Rp. 30.000,00)
- Format ini akan diproses secara otomatis oleh aplikasi

## 4. Jika Masih Ada Masalah

1. Periksa Console di Browser Developer Tools untuk melihat log saat submit form
2. Jika masih bermasalah, coba restart server backend dan frontend

## Perubahan yang Telah Dilakukan

Kami telah memperbaiki:
1. Format pengolahan harga di backend (bookController.js)
2. Input handling di frontend form (BookForm.js)
3. Menambahkan skrip SQL untuk memperbaiki struktur database

Jika Anda membuat buku baru sekarang, harga seharusnya sudah ditampilkan dengan benar.
