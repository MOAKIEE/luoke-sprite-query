# Luoke Query Service

Backend-only service based on `image_text_index.md` table data.

## Quick Start

```bash
npm install
npm start
```

Server default address: `http://localhost:3000`

## APIs

### Health Check

```bash
curl "http://localhost:3000/api/health"
```

### Query

Required query params:
- `size`: number
- `weight`: number

Optional query params:
- `limit`: positive integer, default `5`

```bash
curl "http://localhost:3000/api/query?size=0.3&weight=1.73"
curl "http://localhost:3000/api/query?size=0.2&weight=10&limit=8"
```