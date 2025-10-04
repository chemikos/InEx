<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';

// Importujemy bazowy styl, jeśli jest (np. dla Tailwind, jeśli używasz)
import './assets/main.css';
</script>

<template>
  <div id="app-wrapper">
    <AppHeader />

    <RouterView />
  </div>
</template>

<style>
/* Opcjonalne: Uproszczony styl resetujący */
/* body {
  margin: 0;
  background-color: #f7f9fc;
} */
#app-wrapper {
  min-height: 100vh;
}
</style>
