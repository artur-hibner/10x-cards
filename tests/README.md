# Testowanie w projekcie 10x-cards

## Testy jednostkowe (Vitest)

Testy jednostkowe w projekcie wykorzystują Vitest wraz z React Testing Library.

### Uruchamianie testów

```bash
# Uruchomienie testów w trybie watch
npm test

# Uruchomienie testów z pokryciem kodu
npm run test:coverage
```

### Struktura testów jednostkowych

Testy jednostkowe powinny być umieszczane obok testowanych plików z rozszerzeniem `.test.ts` lub `.test.tsx`.

```
src/
  components/
    ExampleButton.tsx
    ExampleButton.test.tsx
```

### Dobre praktyki testów jednostkowych

- Używaj `vi.fn()` do tworzenia mocków funkcji
- Używaj `vi.spyOn()` do monitorowania istniejących funkcji
- Umieszczaj mocki fabryczne na górze pliku testowego
- Używaj `vi.mock()` do mockowania modułów
- Staraj się osiągnąć pokrycie kodu na poziomie 80%
- Grupuj powiązane testy za pomocą bloków `describe`
- Używaj wzorca Arrange-Act-Assert

## Testy E2E (Playwright)

Testy E2E w projekcie wykorzystują Playwright.

### Uruchamianie testów E2E

```bash
# Uruchomienie testów E2E
npm run test:e2e

# Uruchomienie testów E2E z interfejsem graficznym
npm run test:e2e:ui

# Uruchomienie testów E2E w trybie debug
npm run test:e2e:debug
```

### Struktura testów E2E

Testy E2E znajdują się w katalogu `e2e/` i wykorzystują wzorzec Page Object Model.

```
e2e/
  pages/
    HomePage.ts
  homePage.spec.ts
```

### Dobre praktyki testów E2E

- Używaj wzorca Page Object Model
- Używaj lokatorów dla odpornego wybierania elementów
- Wykorzystuj porównania wizualne za pomocą `expect(page).toHaveScreenshot()`
- Używaj narzędzia codegen do nagrywania testów: `npx playwright codegen`
- Używaj Trace Viewer do debugowania: `npx playwright show-trace trace.zip`
