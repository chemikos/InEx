<script setup lang="ts">
import AddProfileForm from '@/components/profile/AddProfileForm.vue';
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="page-container">
    <button @click="router.push({ name: 'dashboard' })" class="back-link">
      &larr; Powrót do Dashboardu
    </button>
    <h1 class="page-title">Tworzenie Nowego Profilu Finansowego</h1>

    <div class="content-wrapper">
      <AddProfileForm />
    </div>
  </div>
</template>

<style scoped>
/* Możesz tu użyć tych samych stylów kontenera co w DashboardView.vue, 
   jeśli nie masz globalnych klas */
.page-container {
  max-width: 1280px;
  margin: 2rem auto;
  padding: 0 1rem;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
.content-wrapper {
  /* Ogranicz szerokość formularza na dużych ekranach */
  max-width: 500px;
  margin: 0 auto;
}

.back-link {
  color: #4f46e5; /* indigo-600 */
  margin-bottom: 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.15s ease-in-out;
  background: none;
  border: none;
  padding: 0;
}
</style>
