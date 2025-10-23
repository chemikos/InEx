# InEx App

## Opis

Aplikacja do rejestracji wydatków oraz inwestycji. W trakcie rozwijania.

## Inicjalizacja

### Backend

- Przejdź do katalogu backend
- Wykonaj polecenia:

```
npm init -y
npm install express
npm install sqlite3
npm install cors
```

### Frontend

- Przejdź do katalogu frontend-inex
- Wykonaj polecenia

```
npm create vite@latest .
```

```
Po uruchomieniu tego polecenia, kreator przeprowadzi Cię przez następujące kroki:

Project name:

.
(Wpisz kropkę, aby użyć bieżącego katalogu /frontend jako głównego katalogu projektu).

Select a framework:

(Wybierz) React

Select a variant:

(Wybierz) JavaScript (lub JavaScript + SWC)
```

```
npm install
npm install axios react-ruter-dom
```

## Uruchamianie

### Backend

- Przejdź do katalogu backend
- Wykonaj polecenia:

```
node server
```

### Frontend

- Przejdź do katalogu frontend-inex
- Wykonaj polecenia:

```
npm run dev
```

#### Utworzenie wersji produkcyjnej:

- Przejdź do katalogu frontend-inex
- Wykonaj polecenia:

```
npm run build
```

- Przejdź do katalogu inex
- Wykonaj polecenia:

```
serve -s frontend-inex/dist
```
