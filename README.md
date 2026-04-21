# Prime Prints

Next.js app with MongoDB-backed catalog collections for a printing product website.

## Run

```bash
pnpm install
pnpm dev
```

## Required Environment

Set these in `.env.local`:

```dotenv
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?appName=<app>
ADMIN_SESSION_SECRET=<long-random-secret>
ADMIN_SESSION_TTL_SECONDS=28800
```

Optional:

```dotenv
MONGODB_DB_NAME=primeprints
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Dev-only TLS fallbacks (only if your machine has SSL cert issues)
# MONGODB_TLS_INSECURE=true
# MONGODB_TLS_ALLOW_INVALID_HOSTNAMES=true
```

## MongoDB Collections

### categories

```json
{
  "_id": "ObjectId",
  "slug": "business-cards",
  "name": "Business Cards",
  "shortDescription": "Premium printed business cards.",
  "description": { "type": "doc", "content": [] },
  "image": {
    "url": "https://img.yourdomain.com/categories/business-cards.webp",
    "alt": "Business cards category image"
  },
  "parentId": null,
  "seo": {
    "title": "Business Cards Printing UK",
    "description": "Order premium business cards in the UK.",
    "keywords": ["business cards", "printing", "UK"],
    "image": "https://img.yourdomain.com/seo/business-cards.webp"
  },
  "isActive": true,
  "sortOrder": 1,
  "createdAt": "2026-04-14T00:00:00.000Z",
  "updatedAt": "2026-04-14T00:00:00.000Z"
}
```

### products

```json
{
  "_id": "ObjectId",
  "slug": "premium-matte-business-card",
  "name": "Premium Matte Business Card",
  "shortDescription": { "type": "doc", "content": [] },
  "description": { "type": "doc", "content": [] },
  "images": [
    {
      "url": "https://img.yourdomain.com/products/business-card-1.webp",
      "alt": "Front view of premium matte business card"
    },
    {
      "url": "https://img.yourdomain.com/products/business-card-2.webp",
      "alt": "Back view of premium matte business card"
    }
  ],
  "badges": ["Popular", "Best Seller"],
  "categoryIds": ["ObjectId-category1", "ObjectId-category2"],
  "seo": {
    "title": "Premium Matte Business Card Printing",
    "description": "High-quality matte business cards printed in the UK.",
    "keywords": ["matte business cards", "business card printing"],
    "image": "https://img.yourdomain.com/seo/premium-business-card.webp"
  },
  "isFeatured": true,
  "isActive": true,
  "sortOrder": 1,
  "createdAt": "2026-04-14T00:00:00.000Z",
  "updatedAt": "2026-04-14T00:00:00.000Z"
}
```

## Indexes

```js
products.createIndex({ slug: 1 }, { unique: true })
products.createIndex({ categoryIds: 1 })
products.createIndex({ isFeatured: 1 })
products.createIndex({ isActive: 1 })

categories.createIndex({ slug: 1 }, { unique: true })
categories.createIndex({ parentId: 1 })
```

## Health

Check backend health:

```bash
curl http://localhost:3000/api/admin-health
```
