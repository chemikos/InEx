# InEx App

## Opis

Aplikacja do rejestracji wydatków oraz inwestycji. W trakcie rozwijania.

## Inicjalizacja

### Backend

- Przejdź do katalogu backend
- Wykonaj polecenia:

```
npm init -y

npm install express@4.18.2

npm install sqlite3

npm install cors

npm install dotenv helmet morgan
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
npm install axios react-router-dom
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
npm install -g serve
serve -s frontend-inex/dist
```

## Struktura katalogów

```
└── 📁InEx
    └── 📁backend
        └── 📁config
            ├── corsOptions.js
            ├── dbConfig.js
        └── 📁helpers
            ├── helpers.js
        └── 📁middleware
            ├── errorHandler.js
            ├── requestLogger.js
        └── 📁routes
            ├── categories.js
            ├── expenses.js
            ├── incomes.js
            ├── items.js
            ├── labels.js
            ├── profiles.js
            ├── sources.js
        ├── .env
        ├── .env.example
        ├── .eslintrc.json
        ├── .prettierrc.json
        ├── database.js
        ├── package-lock.json
        ├── package.json
        ├── server.js
    └── 📁frontend-inex
        └── 📁.vscode
            ├── extensions.json
            ├── settings.json
        └── 📁public
            ├── favicon.ico
        └── 📁src
            └── 📁api
                ├── http.ts
            └── 📁assets
                ├── main.css
            └── 📁components
                └── 📁dictionary
                    ├── AddCategoryForm.vue
                    ├── AddItemForm.vue
                    ├── AddLabelForm.vue
                    ├── AddSourceForm.vue
                    ├── CategoryList.vue
                    ├── ItemList.vue
                    ├── LabelList.vue
                    ├── SourceList.vue
                └── 📁expense
                    ├── AddExpenseForm.vue
                    ├── ExpenseList.vue
                └── 📁income
                    ├── AddIncomeForm.vue
                    ├── IncomeList.vue
                └── 📁profile
                    ├── AddProfileForm.vue
                ├── AppHeader.vue
            └── 📁router
                ├── index.ts
            └── 📁stores
                ├── categoryStore.ts
                ├── expenseStore.ts
                ├── incomeStore.ts
                ├── itemStore.ts
                ├── labelStore.ts
                ├── profileStore.ts
                ├── sourceStore.ts
            └── 📁views
                └── 📁Expenses
                    ├── ExpensesCharts.vue
                    ├── ExpensesDictionaries.vue
                    ├── ExpensesTables.vue
                    ├── ExpensesTransactions.vue
                └── 📁Investments
                    ├── InvestmentsPortfolio.vue
                    ├── InvestmentsReports.vue
                    ├── InvestmentsTransactions.vue
                └── 📁Layouts
                    ├── ExpensesLayout.vue
                    ├── InvestmentsLayout.vue
                ├── AddProfileView.vue
                ├── DashboardView.vue
                ├── EditProfileView.vue
            ├── App.vue
            ├── main.ts
        ├── .editorconfig
        ├── .env.development
        ├── .env.production
        ├── .prettierrc.json
        ├── env.d.ts
        ├── eslint.config.ts
        ├── index.html
        ├── package-lock.json
        ├── package.json
        ├── tsconfig.app.json
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── vite.config.ts
    ├── .gitignore
    └── README.md
```

## Weryfikacja bazy danych

W projekcie znajduje się funkcja `verifyDatabase()`, która sprawdza:

- czy wszystkie wymagane tabele istnieją,
- liczbę rekordów w każdej z nich,
- spójność danych między `profiles`, `expenses` i `daily_summary`.

Aby uruchomić weryfikację, w terminalu wpisz:

```bash
VERIFY_DB=true node server.js
```

## Licencja

MIT License

Copyright (c) 2025 Marcin P.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

```
