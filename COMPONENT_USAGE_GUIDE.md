# Ghid de Utilizare - Componente Refactorizate

## Importuri Simplificate

Datorită fișierelor `index.ts`, poți importa componentele mai ușor:

### Înainte (importuri individuale)

```tsx
import SearchBox from "../components/dashboard/SearchBox";
import EmptyState from "../components/dashboard/EmptyState";
import SettlementsGrid from "../components/dashboard/SettlementsGrid";
```

### Acum (import centralizat)

```tsx
import {
  SearchBox,
  EmptyState,
  SettlementsGrid,
} from "../components/dashboard";
```

## Exemple de Utilizare

### Dashboard Components

```tsx
import { SearchBox, EmptyState, SettlementsGrid } from "../components/dashboard";

// SearchBox
<SearchBox
  searchQuery={query}
  onSearchChange={setQuery}
  placeholder="Caută..."
  resultsCount={results.length}
/>

// EmptyState
<EmptyState
  icon="📍"
  title="Nu există date"
  description="Încearcă alt filtru"
  actionButton={{
    text: "Resetează",
    onClick: handleReset
  }}
/>

// SettlementsGrid
<SettlementsGrid settlements={settlements} />
```

### Login Components

```tsx
import {
  LoginHeader,
  LoginForm,
  MicrosoftLoginButton,
  LoginFooter
} from "../components/login";

<LoginHeader />
<LoginForm
  email={email}
  password={password}
  error={error}
  loading={loading}
  onEmailChange={setEmail}
  onPasswordChange={setPassword}
  onSubmit={handleSubmit}
/>
<MicrosoftLoginButton onClick={handleMicrosoftLogin} />
<LoginFooter />
```

### Blog Components

```tsx
import {
  BlogHeader,
  BlogSearchBox,
  BlogPostsGrid,
  BlogPostModal
} from "../components/blog";

<BlogHeader postsCount={posts.length} onCreateNew={handleCreate} />
<BlogSearchBox
  searchQuery={query}
  onSearchChange={setQuery}
  resultsCount={filtered.length}
/>
<BlogPostsGrid posts={posts} onEdit={handleEdit} onDelete={handleDelete} />
<BlogPostModal
  isEditing={isEditing}
  formData={formData}
  onFormDataChange={setFormData}
  onSubmit={handleSubmit}
  onClose={handleClose}
/>
```

### About Components

```tsx
import { AboutHero, Section, FeaturesGrid, StatsGrid } from "../components/about";

<AboutHero />
<Section icon="🎯" title="Misiunea Noastră">
  <p>Conținut...</p>
</Section>
<Section icon="💡" title="Ce Oferim">
  <FeaturesGrid />
</Section>
<Section icon="📊" title="Statistici">
  <StatsGrid />
</Section>
```

### FAQ Components

```tsx
import { CategoryFilter, FAQList, type FAQItemData } from "../components/faq";

const faqs: FAQItemData[] = [...];

<CategoryFilter
  categories={categories}
  activeCategory={activeCategory}
  onCategoryChange={setActiveCategory}
/>
<FAQList faqs={filteredFAQs} activeId={activeId} onToggle={handleToggle} />
```

### Help Components

```tsx
import { HelpSidebar, HelpCard, HelpTip } from "../components/help";

<HelpSidebar
  sections={sections}
  activeSection={activeSection}
  onSectionChange={setActiveSection}
/>
<HelpCard title="Pasul 1">
  <p>Conținut...</p>
  <HelpTip>💡 Sfat important!</HelpTip>
</HelpCard>
```

### Settlement Components

```tsx
import {
  SettlementHeader,
  PreviewModeControls,
  ComponentSelector
} from "../components/settlement";

<SettlementHeader
  settlementName={name}
  isActive={isActive}
  onToggleActive={handleToggle}
  onManageBlog={handleBlog}
  onAddComponent={handleAdd}
  onViewCode={handleCode}
  onCustomizeStyles={handleStyles}
/>
<PreviewModeControls
  previewMode={mode}
  onPreviewModeChange={setMode}
/>
<ComponentSelector
  componentTypes={types}
  selectedType={selected}
  onSelectType={setSelected}
  onAddComponent={handleAdd}
  onCancel={handleCancel}
/>
```

## Componente Reutilizabile

Următoarele componente pot fi folosite în mai multe locuri:

### EmptyState

Folosită în Dashboard, BlogManagement, și oriunde ai nevoie de o stare goală.

### SearchBox

Poate fi folosită pentru căutare în orice listă (localități, postări, utilizatori, etc.)

### HelpCard & HelpTip

Utile pentru orice tip de documentație sau ghid

## Avantaje

1. **Import mai curat** - Un singur import pentru toate componentele din același folder
2. **Auto-complete** - IDE-ul va sugera automat componentele disponibile
3. **Ușor de refactorizat** - Dacă redenumești o componentă, schimbi doar în index.ts
4. **Modular** - Fiecare componentă are propria responsabilitate

## Best Practices

1. **Props well-typed** - Toate props-urile au TypeScript interfaces
2. **Functional Components** - Toate componentele folosesc React.FC
3. **Reusability** - Componentele sunt generice și reutilizabile
4. **Single Responsibility** - Fiecare componentă face un singur lucru bine

## Structura Finală

```
components/
├── dashboard/
│   ├── SearchBox.tsx
│   ├── EmptyState.tsx
│   ├── SettlementCard.tsx
│   ├── SettlementsGrid.tsx
│   └── index.ts
├── login/
│   ├── LoginHeader.tsx
│   ├── LoginForm.tsx
│   ├── MicrosoftLoginButton.tsx
│   ├── LoginFooter.tsx
│   └── index.ts
├── blog/
│   ├── BlogHeader.tsx
│   ├── BlogSearchBox.tsx
│   ├── BlogPostCard.tsx
│   ├── BlogPostsGrid.tsx
│   ├── BlogPostModal.tsx
│   └── index.ts
├── settlement/
│   ├── SettlementHeader.tsx
│   ├── PreviewModeControls.tsx
│   ├── ComponentSelector.tsx
│   └── index.ts
├── about/
│   ├── AboutHero.tsx
│   ├── Section.tsx
│   ├── FeatureCard.tsx
│   ├── FeaturesGrid.tsx
│   ├── StatCard.tsx
│   ├── StatsGrid.tsx
│   └── index.ts
├── faq/
│   ├── FAQItem.tsx
│   ├── CategoryFilter.tsx
│   ├── FAQList.tsx
│   └── index.ts
└── help/
    ├── HelpSidebar.tsx
    ├── HelpCard.tsx
    ├── HelpTip.tsx
    ├── sections/
    │   └── GettingStartedSection.tsx
    └── index.ts
```

## Testare

Pentru a testa refactorizarea:

1. Pornește dev server-ul: `npm run dev`
2. Navighează prin toate paginile
3. Verifică că toate funcționalitățile funcționează
4. Nu ar trebui să fie diferențe vizuale

## Mentenabilitate

- **Adăugare componentă nouă**: Creează fișierul în folderul corespunzător și adaugă export în index.ts
- **Modificare componentă**: Editează doar fișierul componentei respective
- **Ștergere componentă**: Șterge fișierul și exportul din index.ts

Mult succes! 🚀
