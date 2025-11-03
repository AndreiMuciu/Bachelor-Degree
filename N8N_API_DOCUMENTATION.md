# N8N Integration API Documentation

## Endpoints

### 1. Create Site

**Endpoint:** `POST /api/v1/n8n/create-site`

**Descriere:** Creează un site nou pentru o localitate prin n8n. Settlement-ul trebuie să aibă `active: false` înainte de a apela acest endpoint.

**Request Body:**

```json
{
  "settlementId": "mongoDbObjectId",
  "files": {
    "html": "<!DOCTYPE html>...",
    "css": "body { margin: 0; }...",
    "js": "console.log('Hello')..."
  }
}
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Site created successfully",
  "data": {
    "settlement": {
      "_id": "...",
      "name": "Bucuresti",
      "judet": "Bucuresti",
      "active": true,
      ...
    },
    "n8nResponse": {
      // Response from n8n webhook
    }
  }
}
```

**Errors:**

- `400 Bad Request`: Missing required fields or settlement already active
- `404 Not Found`: Settlement not found
- `500 Internal Server Error`: N8N_CREATE_SITE not configured or n8n webhook failed

---

### 2. Update Site

**Endpoint:** `POST /api/v1/n8n/update-site`

**Descriere:** Actualizează un site existent pentru o localitate prin n8n. Settlement-ul trebuie să aibă `active: true` înainte de a apela acest endpoint.

**Request Body:**

```json
{
  "settlementId": "mongoDbObjectId",
  "files": {
    "html": "<!DOCTYPE html>...",
    "css": "body { margin: 0; }...",
    "js": "console.log('Updated')..."
  }
}
```

**Response Success (200):**

```json
{
  "status": "success",
  "message": "Site updated successfully",
  "data": {
    "settlement": {
      "_id": "...",
      "name": "Bucuresti",
      "judet": "Bucuresti",
      "active": true,
      ...
    },
    "n8nResponse": {
      // Response from n8n webhook
    }
  }
}
```

**Errors:**

- `400 Bad Request`: Missing required fields or settlement not active
- `404 Not Found`: Settlement not found
- `500 Internal Server Error`: N8N_UPDATE_SITE not configured or n8n webhook failed

---

## N8N Payload Format

Backend-ul trimite către n8n următorul format JSON:

```json
{
  "name": "Bucuresti-BUCURESTI",
  "files-content": {
    "index.html": "<!DOCTYPE html>...",
    "script.js": "console.log('Hello')...",
    "styles.css": "body { margin: 0; }..."
  }
}
```

**Notă:** Numele este format din `{settlement.name}-{settlement.judet.toUpperCase()}`

---

## N8N Response Format

**N8N trebuie să returneze unul dintre următoarele formate:**

### Format 1: String simplu

```json
"success"
```

### Format 2: Obiect cu status

```json
{
  "status": "success"
}
```

**IMPORTANT:** Backend-ul verifică răspunsul de la n8n și:

- ✅ Dacă primește `"success"` (string) → site creat/actualizat cu succes
- ✅ Dacă primește `{ "status": "success" }` → site creat/actualizat cu succes
- ❌ Dacă primește altceva → returnează eroare și NU marchează settlement-ul ca activ

---

## Environment Variables Required

Adaugă în fișierul `.env`:

```env
N8N_CREATE_SITE=https://your-n8n-instance.com/webhook/create-site
N8N_UPDATE_SITE=https://your-n8n-instance.com/webhook/update-site
```

---

## Frontend Flow

### Creare Site (Prima dată)

1. Utilizatorul creează/editează site-ul în frontend
2. Frontend salvează settlement cu `active: false`
3. Frontend apelează `POST /api/v1/n8n/create-site` cu:
   - `settlementId`
   - `files: { html, css, js }`
4. Backend verifică că settlement `active === false`
5. Backend apelează n8n webhook
6. Backend setează `settlement.active = true`
7. Frontend primește confirmare

### Update Site (Modificări ulterioare)

1. Utilizatorul modifică site-ul în frontend
2. Frontend verifică că settlement are `active: true`
3. Frontend apelează `POST /api/v1/n8n/update-site` cu:
   - `settlementId`
   - `files: { html, css, js }`
4. Backend verifică că settlement `active === true`
5. Backend apelează n8n webhook
6. Frontend primește confirmare

---

## Exemplu Frontend Code

```typescript
// services/api.ts

export const createSiteViaN8n = async (
  settlementId: string,
  files: {
    html: string;
    css: string;
    js: string;
  }
) => {
  const response = await fetch(`${API_URL}/api/v1/n8n/create-site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      settlementId,
      files,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

export const updateSiteViaN8n = async (
  settlementId: string,
  files: {
    html: string;
    css: string;
    js: string;
  }
) => {
  const response = await fetch(`${API_URL}/api/v1/n8n/update-site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      settlementId,
      files,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};

// În componenta ta
const handleSaveSite = async () => {
  try {
    const files = {
      html: generatedHtml,
      css: generatedCss,
      js: generatedJs,
    };

    if (settlement.active) {
      // Site existent - update
      await updateSiteViaN8n(settlement._id, files);
      alert("Site actualizat cu succes!");
    } else {
      // Site nou - create
      await createSiteViaN8n(settlement._id, files);
      // Actualizează settlement local pentru a reflecta active: true
      setSettlement({ ...settlement, active: true });
      alert("Site creat cu succes!");
    }
  } catch (error) {
    console.error("Error saving site:", error);
    alert("Eroare la salvarea site-ului: " + error.message);
  }
};
```

---

## Testing cu cURL

### Create Site

```bash
curl -X POST http://localhost:3000/api/v1/n8n/create-site \
  -H "Content-Type: application/json" \
  -d '{
    "settlementId": "your-mongo-id-here",
    "files": {
      "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>",
      "css": "body { margin: 0; padding: 20px; }",
      "js": "console.log(\"Site loaded\");"
    }
  }'
```

### Update Site

```bash
curl -X POST http://localhost:3000/api/v1/n8n/update-site \
  -H "Content-Type: application/json" \
  -d '{
    "settlementId": "your-mongo-id-here",
    "files": {
      "html": "<!DOCTYPE html><html><head><title>Updated</title></head><body><h1>Updated!</h1></body></html>",
      "css": "body { margin: 0; padding: 30px; background: #f0f0f0; }",
      "js": "console.log(\"Site updated\");"
    }
  }'
```
