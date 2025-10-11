<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue';

import './assets/main.css';
</script>

<template>
  <div id="app-wrapper">
    <AppHeader />
    <RouterView />
  </div>
</template>

<style>
#app-wrapper {
  min-height: 100vh;
}
</style>
