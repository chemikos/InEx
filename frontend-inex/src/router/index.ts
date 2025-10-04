import { createRouter, createWebHistory } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 2. Definiowanie ścieżki głównej (URL: /)
      path: '/',
      // 3. Nadanie nazwy ścieżce
      name: 'dashboard',
      // 4. Przypisanie komponentu do tej ścieżki
      component: DashboardView,
    },
    {
      // NOWA TRASA DLA EDYCJI PROFILU
      path: '/profiles/edit/:id',
      name: 'profile-edit',
      // Możesz stworzyć nowy plik np. ProfileEditView.vue
      // component: () => import('@/views/DashboardView.vue'), // Używamy DashboardView jako placeholder
      component: () => import('@/views/ProfileEditView.vue'),
      props: true, // Przekazanie :id jako propsa
    },
    // Dodaj inne trasy, jeśli będą potrzebne (np. dla strony błędu)
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
});

export default router;
