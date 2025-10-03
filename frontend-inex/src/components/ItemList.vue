<script setup lang="ts">
import { useItemStore } from '@/stores/itemStore';

const itemStore = useItemStore();
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow-md mt-6">
    <h3 class="text-2xl font-semibold mb-3 text-red-700 border-b pb-2">Pozycje Wydatków (Items)</h3>

    <p class="text-lg mb-4 p-3 bg-indigo-50 rounded">
      Liczba pozycji w bazie:
      <span class="font-bold text-indigo-700">{{ itemStore.itemCount }}</span>
    </p>

    <div v-if="itemStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie pozycji wydatków...
    </div>

    <div v-else-if="itemStore.items.length > 0">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-200">
          <tr>
            <th class="py-2 px-4 text-left text-sm">ID</th>
            <th class="py-2 px-4 text-left text-sm">Nazwa Pozycji</th>
            <th class="py-2 px-4 text-left text-sm">Etykiety</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itemStore.items" :key="item.id_item" class="border-b hover:bg-gray-50">
            <td class="py-2 px-4 text-sm">{{ item.id_item }}</td>
            <td class="py-2 px-4 text-sm font-medium">{{ item.name }}</td>
            <td class="py-2 px-4 text-sm">
              <span
                v-for="label in item.labels"
                :key="label"
                class="inline-block bg-pink-100 text-pink-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full"
              >
                {{ label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center py-4 text-gray-500 border p-3 rounded">
      Brak zdefiniowanych pozycji wydatków dla tego profilu.
    </div>
  </div>
</template>
