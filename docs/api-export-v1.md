# Dokumentasi API Export Artikel (v1)

Dokumen ini menjelaskan API publik untuk mengekspor artikel dari BlogUstad agar bisa diimpor ke website/aplikasi lain.

## Base URL

- Lokal: `http://localhost:4000`
- Prefix API: `/api/export/v1`

## Format & Konvensi

- Response format: JSON
- Waktu: RFC3339 (UTC)
- Artikel yang diekspor: hanya `status = "published"`

## Endpoint

### 1) List Artikel (pagination)

`GET /api/export/v1/articles`

#### Query Params

- `page` (int, default `1`): halaman.
- `limit` (int, default `20`, max `100`): jumlah item per halaman.
- `since` (string RFC3339, opsional): hanya artikel dengan `updated_at >= since`.
  - Contoh: `2026-06-01T00:00:00Z`
- `include_content` (`true|false`, default `false`): jika `true` maka field `content` ikut dikirim.

#### Response (200)

```json
{
  "version": "v1",
  "generated_at": "2026-06-01T16:11:49Z",
  "filters": {
    "since": "",
    "include_content": false,
    "status": "published"
  },
  "page": 1,
  "limit": 20,
  "next_page": 0,
  "total": 0,
  "items": [
    {
      "id": "577a626a-1b6d-46e3-82af-6690e2a31b75",
      "title": "Judul Artikel",
      "slug": "judul-artikel",
      "content": "",
      "excerpt": "Ringkasan",
      "cover_image": "/uploads/...",
      "categories": ["Umum"],
      "tags": ["tag1", "tag2"],
      "is_featured": false,
      "views": 0,
      "location_name": "",
      "latitude": 0,
      "longitude": 0,
      "youtube_url": "",
      "author": {
        "id": "5dbf6b3f-6a0c-4ac2-9e56-1b2a3c4d5e6f",
        "name": "Nama Penulis"
      },
      "canonical_path": "/artikel/judul-artikel",
      "created_at": "2026-06-01T16:00:00Z",
      "updated_at": "2026-06-01T16:00:00Z"
    }
  ]
}
```

#### Error

- `400`: `since` bukan RFC3339.
- `500`: gagal query database.

#### Contoh

Ambil 50 artikel, tanpa konten:

```bash
curl "http://localhost:4000/api/export/v1/articles?limit=50"
```

Ambil artikel incremental sejak waktu tertentu, termasuk konten:

```bash
curl "http://localhost:4000/api/export/v1/articles?since=2026-06-01T00:00:00Z&include_content=true"
```

### 2) Detail Artikel (by UUID atau slug)

`GET /api/export/v1/articles/:id`

`:id` bisa berupa:

- UUID artikel (contoh: `577a626a-1b6d-46e3-82af-6690e2a31b75`)
- slug artikel (contoh: `judul-artikel`)

#### Response (200)

```json
{
  "version": "v1",
  "generated_at": "2026-06-01T16:11:49Z",
  "item": {
    "id": "577a626a-1b6d-46e3-82af-6690e2a31b75",
    "title": "Judul Artikel",
    "slug": "judul-artikel",
    "content": "<p>Konten HTML...</p>",
    "excerpt": "Ringkasan",
    "cover_image": "/uploads/...",
    "categories": ["Umum"],
    "tags": ["tag1", "tag2"],
    "is_featured": false,
    "views": 0,
    "location_name": "",
    "latitude": 0,
    "longitude": 0,
    "youtube_url": "",
    "author": {
      "id": "5dbf6b3f-6a0c-4ac2-9e56-1b2a3c4d5e6f",
      "name": "Nama Penulis"
    },
    "canonical_path": "/artikel/judul-artikel",
    "created_at": "2026-06-01T16:00:00Z",
    "updated_at": "2026-06-01T16:00:00Z"
  }
}
```

#### Error

- `404`: artikel tidak ditemukan atau bukan `published`.
- `500`: gagal query database.

#### Contoh

```bash
curl "http://localhost:4000/api/export/v1/articles/judul-artikel"
```

## Catatan Integrasi Importer

- Untuk sinkronisasi incremental, simpan nilai `updated_at` terakhir dari item yang berhasil diproses, lalu panggil list endpoint dengan `since=<updated_at_terakhir>`.
- `canonical_path` adalah path relatif dari artikel di website sumber. Website tujuan bisa membentuk URL penuh sendiri (mis. `https://domain-sumber.com` + `canonical_path`).
