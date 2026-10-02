# Sesje

Planer sesji zdjęciowych: sesje z datami, kafelki osób (modele, styliści, makijażyści) przypinane do sesji, kalendarz i szybki kontakt mailem / przez Instagram. Instalowana aplikacja (PWA) na laptop i iPada.

## Uruchomienie lokalnie

```
npm install
npm run dev
```

Bez konfiguracji Supabase aplikacja działa w **trybie lokalnym** — dane są zapisane tylko w tej przeglądarce.

## Synchronizacja między urządzeniami (Supabase)

1. Załóż darmowy projekt na [supabase.com](https://supabase.com).
2. W **SQL Editor** wklej i uruchom zawartość [supabase/schema.sql](supabase/schema.sql).
3. Z **Project Settings → API** skopiuj Project URL i klucz publishable (anon):
   - lokalnie do pliku `.env.local` (nie trafia do repo):
     ```
     VITE_SUPABASE_URL=https://xxxx.supabase.co
     VITE_SUPABASE_KEY=...
     ```
   - na GitHubie jako zmienne repozytorium o tych samych nazwach: **Settings → Secrets and variables → Actions → zakładka Variables**.

   Ten klucz i tak trafia do przeglądarki — danych pilnują reguły RLS ze schematu (każdy widzi tylko swoje wiersze). Nigdy nie używaj tu klucza `service_role`.
4. Otwórz aplikację, wybierz „Nie mam konta — załóż" i zarejestruj się.
5. Po założeniu konta wyłącz rejestrację kolejnych osób: **Authentication → Sign In / Providers → Allow new users to sign up**.

Jeśli baza powstała przed którąś z późniejszych zmian, uruchom w SQL Editor brakujące pliki (można je puszczać wielokrotnie):

- [supabase/migrations-2026-10-02-end-time.sql](supabase/migrations-2026-10-02-end-time.sql) — godzina zakończenia sesji
- [supabase/migrations-2026-10-02-tasks.sql](supabase/migrations-2026-10-02-tasks.sql) — listy zadań

Dane z trybu lokalnego nie przenoszą się automatycznie do chmury.

Bez internetu aplikacja się otwiera i pokazuje ostatnio pobrane dane; zmiany wymagają połączenia.

## Publikacja (GitHub Pages)

1. W repo na GitHubie: **Settings → Pages → Source: GitHub Actions** (na darmowym planie repo musi być publiczne).
2. Każdy push na `main` buduje i publikuje aplikację pod `https://cantereq908.github.io/Nowy-folder/`.

Po zmianie nazwy repo popraw `base` w [vite.config.ts](vite.config.ts).

## Instalacja

- **iPad:** otwórz adres w Safari → Udostępnij → **Do ekranu początkowego**.
- **Laptop (Chrome / Edge / Opera):** ikona instalacji w pasku adresu → **Zainstaluj**.

## Polecenia

| Polecenie | Co robi |
| --- | --- |
| `npm run dev` | serwer deweloperski |
| `npm test` | testy jednostkowe |
| `npm run build` | sprawdzenie typów + build do `dist/` |
| `npm run preview` | podgląd zbudowanej wersji (z service workerem) |
| `npm run icons` | ikony PWA z `public/logo.svg` |
