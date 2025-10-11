<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Definicja pozycji menu bocznego
const expenseMenuItems = [
  { name: 'Transakcje', path: '/dashboard/wydatki/transakcje' },
  { name: 'Tabele (Agregacje)', path: '/dashboard/wydatki/tabele' },
  { name: 'Wykresy', path: '/dashboard/wydatki/wykresy' },
  { name: 'Słowniki', path: '/dashboard/wydatki/slowniki' },
];

// Aktywna ścieżka dla podświetlenia
const activeSubPath = computed(() => route.path);
</script>

<template>
  <div class="expense-layout-grid">
    <nav class="sidebar">
      <h3 class="sidebar-title">Menu Wydatków</h3>
      <ul>
        <li v-for="item in expenseMenuItems" :key="item.name">
          <RouterLink
            :to="item.path"
            :class="{ 'active-link': activeSubPath.startsWith(item.path) }"
            class="sidebar-link"
          >
            {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>

    <main class="content-area">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.expense-layout-grid {
  display: grid;
  grid-template-columns: 250px 1fr; /* Szerokość menu bocznego vs zawartość */
  gap: 2rem;
  min-height: 80vh; /* Zapewnienie, że layout zajmuje ekran */
}

.sidebar {
  padding: 1rem 0;
  background-color: #f9fafb; /* gray-50 */
  border-right: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 0.5rem;
}

.sidebar-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-link {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #4b5563; /* gray-600 */
  transition:
    background-color 0.2s,
    color 0.2s;
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  background-color: #f3f4f6; /* gray-100 */
  color: #1f2937;
}

.active-link {
  background-color: #d1fae5; /* green-100 */
  color: #059669; /* green-600 */
  font-weight: 600;
  border-left-color: #10b981; /* green-500 */
}

.content-area {
  padding: 0;
}
</style>
