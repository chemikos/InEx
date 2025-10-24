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
npm install -g serve
serve -s frontend-inex/dist
```

## Struktura katalogów

```
└── 📁backend
    └── 📁helpers
        ├── helpers.js
    └── 📁routes
        ├── categories.js
        ├── expenses.js
        ├── incomes.js
        ├── items.js
        ├── labels.js
        ├── profiles.js
        ├── sources.js
    ├── database.js
    ├── InEx.db
    ├── package-lock.json
    ├── package.json
    └── server.js
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
    └── vite.config.ts
├── .gitignore
└── readme.md
```
