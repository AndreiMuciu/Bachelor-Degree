# Frontend - Portal Localități

## 📋 Structura Proiectului

```
frontend/
├── src/
│   ├── components/        # Componente reutilizabile
│   │   └── ProtectedRoute.tsx
│   ├── pages/            # Pagini principale
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   └── SettlementPage.tsx
│   ├── contexts/         # React Contexts
│   │   └── AuthContext.tsx
│   ├── services/         # API services
│   │   └── api.ts
│   ├── styles/          # CSS files
│   │   ├── Login.css
│   │   ├── Dashboard.css
│   │   └── Settlement.css
│   └── types/           # TypeScript types
│       └── index.ts
```

## 🚀 Cum să rulezi aplicația

### 1. Instalează dependențele

```bash
cd frontend
npm install
```

### 2. Configurare Backend

Asigură-te că backend-ul rulează pe `http://localhost:3000`

### 3. Pornește aplicația

```bash
npm run dev
```

Aplicația va rula pe `http://localhost:5173`

## ✨ Funcționalități

### 🔐 Autentificare

- **Login cu Email/Parolă**: Formular standard de autentificare
- **Login cu Microsoft**: Integrare cu Microsoft Entra ID (Azure AD)
- **Protected Routes**: Nu poți accesa paginile fără autentificare

### 📊 Dashboard

- **Lista de Settlements**: Afișează toate localitățile asignate user-ului
- **Status Website**: Indicator vizual dacă website-ul este activ sau nu
- **Navigare**: Click pe un settlement pentru a-l edita
- **Mesaj Empty State**: "Nu ești asignat pentru nicio localitate" dacă nu ai settlements

### 🏗️ Settlement Page - Website Builder

#### Preview Mode

- **Desktop** (🖥️): Preview complet
- **Tablet** (📱): Preview la 768px
- **Mobile** (📱): Preview la 375px

#### Componente Disponibile

1. **Header** (📋): Meniu de navigare cu link-uri
2. **Hero Section** (🎯): Banner principal cu titlu și subtitle
3. **Despre** (📝): Secțiune despre localitate
4. **Servicii** (⚙️): Lista serviciilor disponibile
5. **Contact** (📞): Informații de contact
6. **Footer** (📄): Footer cu copyright

#### Funcționalități Builder

- **Adaugă Componentă**: Modal pentru selectarea tipului de componentă
- **Reordonare**: Mută componentele în sus sau în jos
- **Aliniere**: Stânga / Centru / Dreapta pentru fiecare componentă
- **Ștergere**: Elimină componente nedorite
- **Preview Live**: Vezi cum arată în timp real

#### Crearea Website-ului

- Dacă `active === false`: Apare butonul "Creează Website"
- Se inițializează cu 2 componente default (Header + Hero)
- Poți adăuga, edita și reordona componente
- Salvarea va trimite datele către backend (de implementat)

## 🔧 API Endpoints folosite

### Auth

- `POST /api/v1/auth/login` - Login cu email/parolă
- `POST /api/v1/auth/signup` - Înregistrare
- `GET /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/entra/login` - Inițiere Microsoft login
- `GET /api/v1/auth/entra/redirect` - Callback Microsoft

### Users

- `GET /api/v1/users/me` - Obține user-ul curent cu settlements

### Settlements

- `GET /api/v1/settlements` - Lista settlements
- `GET /api/v1/settlements/:id` - Un settlement specific
- `PATCH /api/v1/settlements/:id` - Update settlement

## 🎨 Stilizare

Toate stilurile sunt în CSS pur, organizate pe fișiere:

- `Login.css` - Stiluri pentru pagina de login
- `Dashboard.css` - Stiluri pentru dashboard
- `Settlement.css` - Stiluri pentru builder și preview

Culorile principale:

- Primary: `#667eea` (Purple/Blue)
- Secondary: `#764ba2` (Purple)
- Success: `#4caf50` (Green)
- Error: `#f44336` (Red)

## 📝 Next Steps (De implementat)

1. **Salvare Website**:

   - Endpoint backend pentru salvarea configurației
   - Upload HTML/CSS/JS generat

2. **Editare Conținut**:

   - Modal pentru editarea textului componentelor
   - Upload imagini
   - Link-uri personalizabile

3. **Teme**:

   - Color picker pentru primary/secondary colors
   - Font selector
   - Template-uri predefinite

4. **Export**:
   - Generare HTML/CSS/JS static
   - Download ca ZIP
   - Deploy automatic

## 🐛 Debugging

### Token-ul nu este trimis

Verifică că backend-ul are CORS configurat corect cu `credentials: true`

### User-ul nu are settlements

Verifică în MongoDB că user-ul are array-ul `settlements` populat cu ID-uri de settlements

### Microsoft Login nu funcționează

Verifică variabilele de mediu în backend:

- `ENTRA_CLIENT_ID`
- `ENTRA_TENANT_ID`
- `ENTRA_CLIENT_SECRET`
