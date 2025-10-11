<script setup lang="ts">
import { useProfileStore } from '@/stores/profileStore';
import { RouterLink, RouterView } from 'vue-router';

const profileStore = useProfileStore();

const mainTabs = [
  { name: 'Wydatki', path: '/dashboard/wydatki/transakcje' },
  { name: 'Inwestycje', path: '/dashboard/inwestycje/portfel' },
  // { name: 'Raporty', path: '/dashboard/raporty' },
  // { name: 'Ustawienia', path: '/dashboard/ustawienia' },
];
</script>

<template>
  <main class="dashboard-main-container">
    <div class="main-content-area">
      <div class="dashboard-header-row flex justify-between items-center mb-6">
        <h2 class="dashboard-title">
          Dashboard: {{ profileStore.activeProfile?.name || 'Wybierz Profil' }}
        </h2>
      </div>
      <nav class="custom-tab-navigation">
        <RouterLink
          v-for="(tab, index) in mainTabs"
          :key="index"
          :to="tab.path"
          active-class="active-tab"
          :class="{
            'active-tab-legacy': $route.path.startsWith(tab.path), // Pozostałość: usunięto
          }"
          class="tab-link"
        >
          {{ tab.name }}
        </RouterLink>
      </nav>
      <div class="router-content-container"><RouterView /></div>
    </div>
  </main>
</template>

<style scoped>
.dashboard-main-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.custom-tab-navigation {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 1.5rem;
}
.tab-link {
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: 500;
  color: #4b5563;
  text-decoration: none;
  transition:
    color 0.2s,
    border-bottom 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tab-link:hover {
  color: #1f2937;
}
.active-tab {
  color: #10b981;
  border-bottom: 2px solid #10b981;
  font-weight: 600;
}
</style>
