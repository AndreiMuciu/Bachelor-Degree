# Ghid de testare - Funcționalitatea Salvare Site

## Modificări efectuate

### Backend

✅ Creat `backend/controllers/n8nController.js` cu funcții pentru:

- `createSite` - Creează un site nou
- `updateSite` - Actualizează un site existent

✅ Creat `backend/routes/n8nRoutes.js` cu rutele:

- `POST /api/v1/n8n/create-site`
- `POST /api/v1/n8n/update-site`

✅ Modificat `backend/app.js` pentru a include rutele n8n

### Frontend

✅ Modificat `frontend/src/services/api.ts`:

- Adăugat `n8nAPI.createSite()`
- Adăugat `n8nAPI.updateSite()`

✅ Modificat `frontend/src/pages/SettlementPage.tsx`:

- Adăugat import pentru `n8nAPI`
- Adăugat state `isSaving` pentru loading
- Adăugat funcția `handleSaveSite()` care:
  - Generează HTML, CSS, JS
  - Verifică dacă site-ul este activ
  - Apelează CREATE sau UPDATE în funcție de status
  - Actualizează starea settlement-ului după creare
- Modificat butonul "Salvează" să aibă:
  - Handler `onClick={handleSaveSite}`
  - Disabled state când se salvează
  - Text dinamic: "Salvează Site" sau "Actualizează Site"

---

## Configurare Environment Variables

**IMPORTANT:** Înainte de testare, adaugă în `backend/.env`:

```env
N8N_CREATE_SITE=https://your-n8n-instance.com/webhook/create-site
N8N_UPDATE_SITE=https://your-n8n-instance.com/webhook/update-site
```

Înlocuiește URL-urile cu adresele reale ale webhook-urilor tale n8n.

---

## Cum să testezi

### 1. Pornește backend-ul

```bash
cd backend
npm start
```

### 2. Pornește frontend-ul

```bash
cd frontend
npm run dev
```

### 3. Testează fluxul de creare site

1. **Autentifică-te** în aplicație
2. **Selectează un settlement** care NU are site activ (`active: false`)
3. **Adaugă componente** la site (Header, Hero, About, etc.)
4. **Apasă butonul "💾 Salvează Site"**

**Așteptări:**

- Ar trebui să vezi mesajul "Site creat cu succes! ✅"
- Butonul se schimbă din "Salvează Site" în "Actualizează Site"
- În backend se trimite un POST request către n8n cu:
  ```json
  {
    "name": "NumeLocalitate-JUDET",
    "files-content": {
      "index.html": "...",
      "script.js": "...",
      "styles.css": "..."
    }
  }
  ```

### 4. Testează fluxul de actualizare site

1. **Modifică componentele** site-ului (editează text, adaugă/șterge componente)
2. **Apasă butonul "💾 Actualizează Site"**

**Așteptări:**

- Ar trebui să vezi mesajul "Site actualizat cu succes! ✅"
- În backend se trimite un POST request către n8n UPDATE endpoint

---

## Debugging

### Frontend Console

Deschide Console (F12) pentru a vedea:

- Request-urile către backend
- Response-urile de la backend
- Eventuale erori

### Backend Console

Verifică output-ul din terminal pentru:

- Request-uri primite
- Apeluri către n8n
- Erori de la n8n

### Verifică Network Tab

În DevTools > Network:

- Căută request-uri către `/api/v1/n8n/create-site` sau `/update-site`
- Verifică Request Payload
- Verifică Response

---

## Erori comune

### ❌ "N8N_CREATE_SITE URL not configured"

**Soluție:** Adaugă variabilele de environment în `backend/.env`

### ❌ "Settlement not found"

**Soluție:** Asigură-te că settlement-ul există în baza de date

### ❌ "Settlement already has an active site"

**Soluție:** Folosește endpoint-ul de UPDATE, nu CREATE

### ❌ "N8N did not return success status"

**Soluție:**

- Verifică că n8n returnează `"success"` sau `{"status": "success"}`
- Verifică răspunsul exact din n8n în detaliile erorii
- Modifică webhook-ul n8n să returneze formatul corect

### ❌ "Failed to create site via n8n"

**Soluție:**

- Verifică că URL-ul n8n este corect
- Verifică că webhook-ul n8n este activ
- Verifică logs în n8n

---

## Testare manuală cu cURL

### Test CREATE (settlement inactiv)

```bash
# Windows PowerShell
$body = @{
    settlementId = "6xxxxxxxxxxxxx"
    files = @{
        html = "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Site</h1></body></html>"
        css = "body { margin: 0; padding: 20px; }"
        js = "console.log('Test');"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/n8n/create-site" -Method POST -Body $body -ContentType "application/json"
```

### Test UPDATE (settlement activ)

```bash
# Windows PowerShell
$body = @{
    settlementId = "6xxxxxxxxxxxxx"
    files = @{
        html = "<!DOCTYPE html><html><head><title>Updated</title></head><body><h1>Updated Site</h1></body></html>"
        css = "body { margin: 0; padding: 30px; background: #f5f5f5; }"
        js = "console.log('Updated');"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/n8n/update-site" -Method POST -Body $body -ContentType "application/json"
```

---

## Next Steps

După ce testezi funcționalitatea:

1. ✅ Configurează webhook-urile n8n reale
2. ✅ Testează cu settlement-uri reale
3. ✅ Verifică că site-urile sunt create corect în n8n
4. ✅ Adaugă logging mai detaliat dacă e necesar
5. ✅ Poate adaugă un loading indicator mai vizibil
6. ✅ Consideră adăugarea de validări suplimentare
