import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';
import AddProfileView from '@/views/AddProfileView.vue';
import EditProfileView from '../views/EditProfileView.vue';

import ExpensesLayout from '../views/Layouts/ExpensesLayout.vue';
import InvestmentsLayout from '../views/Layouts/InvestmentsLayout.vue';

import ExpensesTransactions from '../views/Expenses/ExpensesTransactions.vue';
import ExpensesDictionaries from '../views/Expenses/ExpensesDictionaries.vue';
import ExpensesTables from '../views/Expenses/ExpensesTables.vue';
import ExpensesCharts from '../views/Expenses/ExpensesCharts.vue';

import InvestmentsPortfolio from '../views/Investments/InvestmentsPortfolio.vue';
import InvestmentsTransactions from '../views/Investments/InvestmentsTransactions.vue';
import InvestmentsReports from '../views/Investments/InvestmentsReports.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/add-profile',
      name: 'add-profile',
      component: AddProfileView,
    },
    {
      path: '/profile-edit/:id',
      name: 'profile-edit',
      component: EditProfileView,
      props: true,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      // === ROUTING ZAGNIEŻDŻONY ===
      children: [
        // === GŁÓWNA ZAKŁADKA: WYDATKI ===
        {
          path: 'wydatki',
          component: ExpensesLayout, // Komponent z menu bocznym
          redirect: { name: 'ExpensesTransactions' }, // Domyślny podwidok
          children: [
            {
              path: 'transakcje',
              name: 'ExpensesTransactions',
              component: ExpensesTransactions,
            },
            {
              path: 'tabele',
              name: 'ExpensesTables',
              component: ExpensesTables,
            },
            {
              path: 'wykresy',
              name: 'ExpensesCharts',
              component: ExpensesCharts,
            },
            {
              path: 'slowniki',
              name: 'ExpensesDictionaries',
              component: ExpensesDictionaries,
            },
          ],
        },
        // === GŁÓWNA ZAKŁADKA: INWESTYCJE (Placeholdery) ===
        {
          path: 'inwestycje',
          component: InvestmentsLayout, // Komponent z menu bocznym
          redirect: { name: 'InvestmentsPortfolio' }, // Domyślny podwidok
          children: [
            {
              path: 'portfel',
              name: 'InvestmentsPortfolio',
              component: InvestmentsPortfolio,
            },
            {
              path: 'transakcje',
              name: 'InvestmentsTransactions',
              component: InvestmentsTransactions,
            },
            {
              path: 'raporty',
              name: 'InvestmentsReports',
              component: InvestmentsReports,
            },
          ],
        },
        // Domyślne przekierowanie dla /dashboard (prowadzi do wydatków)
        {
          path: '',
          redirect: { path: '/dashboard/wydatki/transakcje' },
        },
      ],
    },
  ],
});

export default router;
