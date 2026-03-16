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
  <div class="expense-layout">
    <nav class="top-nav">
      <h3 class="top-nav-title">Menu Wydatków</h3>
      <ul class="top-nav-list">
        <li v-for="item in expenseMenuItems" :key="item.name">
          <RouterLink
            :to="item.path"
            :class="{ 'active-link': activeSubPath.startsWith(item.path) }"
            class="top-nav-link"
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
.expense-layout {
  display: flex;
  flex-direction: column;
  min-height: 80vh;
  width: 100%;
}

.top-nav {
  padding: 1rem 2rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.top-nav-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.top-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.top-nav-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #4b5563;
  transition: background-color 0.2s, color 0.2s;
  border-radius: 0.375rem;
  border-bottom: 3px solid transparent;
}

.top-nav-link:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.active-link {
  background-color: #d1fae5;
  color: #059669;
  font-weight: 600;
  border-bottom-color: #10b981;
}

.content-area {
  flex: 1;
  width: 100%;
  max-width: 100%;
  padding: 0 2rem;
  box-sizing: border-box;
}
</style>
