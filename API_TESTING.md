# API Testing Examples

## 🧪 Teste pentru Blog Posts API

### Obține toate postările
```http
GET http://localhost:5000/api/v1/blog-posts
```

### Obține postările pentru o localitate specifică
```http
GET http://localhost:5000/api/v1/blog-posts?settlement=YOUR_SETTLEMENT_ID
```

### Obține o postare specifică
```http
GET http://localhost:5000/api/v1/blog-posts/POST_ID
```

### Creează o postare nouă
```http
POST http://localhost:5000/api/v1/blog-posts
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "title": "Eveniment Local",
  "description": "Descriere scurtă a evenimentului",
  "content": "Conținut detaliat al postării cu toate informațiile necesare...",
  "settlement": "SETTLEMENT_ID"
}
```

### Actualizează o postare
```http
PATCH http://localhost:5000/api/v1/blog-posts/POST_ID
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "title": "Titlu Actualizat",
  "content": "Conținut actualizat..."
}
```

### Șterge o postare
```http
DELETE http://localhost:5000/api/v1/blog-posts/POST_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📍 Settlements API (pentru referință)

### Obține toate localitățile
```http
GET http://localhost:5000/api/v1/settlements
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obține o localitate specifică
```http
GET http://localhost:5000/api/v1/settlements/SETTLEMENT_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🧪 Test cu cURL

### Creează postare blog (Windows PowerShell)
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

$body = @{
    title = "Test Postare"
    description = "Aceasta este o postare de test"
    content = "Conținut detaliat pentru testare..."
    settlement = "SETTLEMENT_ID"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts" -Method Post -Headers $headers -Body $body
```

### Obține postări (Windows PowerShell)
```powershell
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts" -Method Get -Headers $headers
```

---

## 📝 Exemplu Response

### Success Response (POST/GET)
```json
{
  "status": "success",
  "data": {
    "data": {
      "_id": "67890abcdef12345",
      "title": "Eveniment Local",
      "description": "Descriere scurtă",
      "content": "Conținut detaliat...",
      "settlement": "12345abcdef67890",
      "date": "2025-11-02T10:30:00.000Z",
      "__v": 0
    }
  }
}
```

### Multiple Posts Response (GET all)
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "data": [
      {
        "_id": "1",
        "title": "Post 1",
        "description": "Desc 1",
        "content": "Content 1",
        "settlement": "settlement_id",
        "date": "2025-11-01T00:00:00.000Z"
      },
      {
        "_id": "2",
        "title": "Post 2",
        "description": "Desc 2",
        "content": "Content 2",
        "settlement": "settlement_id",
        "date": "2025-11-02T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 🔐 Autentificare

### Login
```http
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (salvează token-ul)
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "user",
      "settlements": [...]
    }
  }
}
```

---

## 🧪 Testing Workflow

### 1. Login și obține token
```powershell
# Login
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

Write-Host "Token obtained: $token"
```

### 2. Creează o postare
```powershell
# Create Blog Post
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

$postBody = @{
    title = "Eveniment Comunitar"
    description = "Un eveniment important pentru comunitate"
    content = "Detalii complete despre eveniment..."
    settlement = "YOUR_SETTLEMENT_ID"
} | ConvertTo-Json

$newPost = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts" -Method Post -Headers $headers -Body $postBody

Write-Host "Post created with ID: $($newPost.data.data._id)"
```

### 3. Obține postările
```powershell
# Get all posts for settlement
$posts = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts?settlement=YOUR_SETTLEMENT_ID" -Method Get -Headers $headers

Write-Host "Found $($posts.results) posts"
$posts.data.data | Format-Table title, description, date
```

### 4. Actualizează o postare
```powershell
# Update post
$updateBody = @{
    title = "Titlu Actualizat"
    content = "Conținut actualizat cu informații noi..."
} | ConvertTo-Json

$updated = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts/POST_ID" -Method Patch -Headers $headers -Body $updateBody

Write-Host "Post updated successfully"
```

### 5. Șterge o postare
```powershell
# Delete post
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts/POST_ID" -Method Delete -Headers $headers

Write-Host "Post deleted successfully"
```

---

## 📊 Test Data Generator

### Script complet de generare date test
```powershell
# Login
$loginBody = @{
    email = "admin@example.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $response.token

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Settlement ID (înlocuiește cu ID-ul real)
$settlementId = "YOUR_SETTLEMENT_ID"

# Creează 5 postări test
$titles = @(
    "Festival de Toamnă",
    "Lucrări de Infrastructură",
    "Program Educațional",
    "Eveniment Sportiv",
    "Anunț Important"
)

$descriptions = @(
    "Vino la festivalul anual de toamnă",
    "Informații despre lucrările în desfășurare",
    "Noi programe pentru școlari",
    "Competiție sportivă locală",
    "Comunicat oficial al primăriei"
)

for ($i = 0; $i -lt 5; $i++) {
    $postBody = @{
        title = $titles[$i]
        description = $descriptions[$i]
        content = "Acesta este conținutul detaliat pentru postarea '$($titles[$i])'. Aici puteți adăuga toate informațiile relevante și detaliile despre acest eveniment sau anunț."
        settlement = $settlementId
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/blog-posts" -Method Post -Headers $headers -Body $postBody
    Write-Host "✅ Created: $($titles[$i])"
    Start-Sleep -Seconds 1
}

Write-Host "`n🎉 5 test posts created successfully!"
```

---

## 🔍 Validare și Erori

### Erori Posibile

#### 400 Bad Request - Titlu prea lung
```json
{
  "status": "error",
  "message": "A blog post title must have less or equal than 30 characters"
}
```

#### 400 Bad Request - Descriere prea lungă
```json
{
  "status": "error",
  "message": "A blog post description must have less or equal than 100 characters"
}
```

#### 401 Unauthorized
```json
{
  "status": "error",
  "message": "You are not logged in! Please log in to get access."
}
```

#### 404 Not Found
```json
{
  "status": "error",
  "message": "No document found with that ID"
}
```

---

## 💡 Tips

1. **Salvează token-ul**: După login, salvează JWT token pentru request-uri ulterioare
2. **Validare client-side**: Frontend-ul verifică lungimea (30/100 caractere)
3. **Filtrare**: Folosește `?settlement=ID` pentru a filtra postările
4. **Date format**: Datele sunt în format ISO 8601

---

**Ready to test!** 🚀
