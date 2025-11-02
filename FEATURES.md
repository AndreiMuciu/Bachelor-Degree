# Noile Funcționalități - Portal Localități

## 📰 Blog Management

### Funcționalități

- **Creare postări**: Creează postări de blog cu titlu (max 30 caractere), descriere (max 100 caractere) și conținut complet
- **Editare postări**: Modifică postările existente
- **Ștergere postări**: Elimină postările care nu mai sunt relevante
- **Vizualizare automată**: Postările apar automat pe website-ul generat

### Cum să folosești

1. Accesează pagina localității tale
2. Click pe butonul **"📰 Gestionează Blog"**
3. Click pe **"➕ Postare Nouă"** pentru a adăuga o postare
4. Completează formularul și publică

### API Endpoints

```javascript
GET    /api/v1/blog-posts?settlement={settlementId}  // Toate postările pentru o localitate
GET    /api/v1/blog-posts/{id}                       // O postare specifică
POST   /api/v1/blog-posts                            // Creează postare nouă
PATCH  /api/v1/blog-posts/{id}                       // Actualizează postare
DELETE /api/v1/blog-posts/{id}                       // Șterge postare
```

## 🗺️ Hartă Interactive

### Funcționalități

- **Integrare Leaflet.js**: Hartă interactive cu OpenStreetMap
- **Marcare automată**: Locația este marcată automat pe baza coordonatelor (lat, lng)
- **Zoom și navigare**: Utilizatorii pot explora harta
- **Popup informativ**: Numele localității apare la click pe marker

### Cum să adaugi harta

1. În constructorul de website, click pe **"➕ Adaugă Componentă"**
2. Selectează **"🗺️ Hartă"**
3. Harta va folosi automat coordonatele din baza de date (lat, lng)

### Tehnologii

- **Leaflet.js 1.9.4**: Bibliotecă pentru hărți interactive
- **OpenStreetMap**: Tiles gratuite pentru hartă

## 🌐 Website Preview Funcțional

### Caracteristici

- **Cod HTML complet**: Generat automat cu toate componentele
- **CSS responsive**: Stiluri moderne și adaptive
- **JavaScript funcțional**: Include:
  - Smooth scroll pentru navigare
  - Animații la scroll
  - Încărcare automată postări blog (prin API)
  - Inițializare hartă Leaflet

### Structura generată

#### HTML

```html
<!DOCTYPE html>
<html lang="ro">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Localitatea Ta</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <!-- Componente generate dinamic -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="script.js"></script>
  </body>
</html>
```

#### JavaScript Features

1. **Fetch Blog Posts**: Încarcă postările din API
2. **Map Initialization**: Creează harta cu coordonatele corecte
3. **Smooth Scrolling**: Navigare fluidă între secțiuni
4. **Scroll Animations**: Efecte vizuale la scroll

### Cod generat include:

- ✅ Fetch API pentru blog posts
- ✅ Leaflet map cu marker personalizat
- ✅ Event listeners pentru navigare
- ✅ Intersection Observer pentru animații
- ✅ Error handling pentru API calls

## 🎨 Componente Disponibile

### Lista completă:

1. **📋 Header** - Antet cu navigare
2. **🎯 Hero Section** - Secțiune principală
3. **📝 Despre** - Informații despre localitate
4. **⚙️ Servicii** - Lista serviciilor
5. **📰 Blog** - Postări din baza de date (NOU!)
6. **🗺️ Hartă** - Hartă interactivă cu locație (NOU!)
7. **📞 Contact** - Informații de contact
8. **📄 Footer** - Subsol

## 🔧 Configurare Tehnică

### Backend

Asigură-te că server-ul backend rulează:

```powershell
cd backend
npm start
```

### Frontend

```powershell
cd frontend
npm run dev
```

### Cerințe

- Node.js 16+
- MongoDB
- Browser modern (Chrome, Firefox, Edge)

## 📱 Preview Modes

- **Desktop**: 100% width
- **Tablet**: 768px width
- **Mobile**: 375px width

## 🚀 Cum să folosești Preview-ul

1. Construiește website-ul cu componentele dorite
2. Adaugă componenta **Blog** dacă vrei să afișezi postări
3. Adaugă componenta **Hartă** pentru localizare
4. Click pe **"👁️ Vezi Cod"** pentru a vedea HTML/CSS/JS generat
5. Copiază codul și folosește-l pe hosting

## 💡 Tips & Best Practices

### Pentru Blog

- Folosește titluri scurte și descriptive
- Descrierea ar trebui să fie un rezumat captivant
- Structurează conținutul cu paragrafe clare

### Pentru Hartă

- Verifică coordonatele (lat, lng) să fie corecte în baza de date
- Harta este responsive și se adaptează la ecran

### Pentru Preview

- Testează pe toate device-urile (Desktop, Tablet, Mobile)
- Verifică că blog-ul încarcă corect postările
- Asigură-te că harta se inițializează corect

## 🐛 Troubleshooting

### Blog-ul nu încarcă postări

- Verifică că backend-ul rulează pe `localhost:5000`
- Verifică că există postări pentru localitate în baza de date
- Deschide Console (F12) pentru erori

### Harta nu apare

- Verifică că ai adăugat componenta Map
- Verifică că coordonatele sunt valide
- Asigură-te că Leaflet.js s-a încărcat

### Preview-ul nu funcționează

- Copiază codul într-un fișier local
- Asigură-te că toate fișierele (HTML, CSS, JS) sunt în același folder
- Deschide HTML-ul într-un browser modern

## 📚 Resurse Externe

- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Autor**: Portal Localități Team  
**Data**: Noiembrie 2025  
**Versiune**: 2.0
