<script setup lang="ts">
import { useSourceStore } from '@/stores/sourceStore';

const sourceStore = useSourceStore();

const editSource = (id: number) => {
  console.log(`Edycja źródła ID: ${id}`);
  alert(`Edycja źródła ID: ${id} (W BUDOWIE)`);
};

const deleteSource = (id: number) => {
  console.log(`Usuwanie źródła ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć źródła ID: ${id}?`)) {
    // Logika delete (do zaimplementowania w Pinia Store później)
    alert(`źródła ID: ${id} usunięta! (W BUDOWIE)`);
  }
};
</script>

<template>
  <div>
    <h2 class="form-title">Lista Źródeł Dochodu (Sources)</h2>
    <div v-if="sourceStore.isLoading" class="p-4 text-center">Ładowanie źródeł...</div>

    <div v-else-if="sourceStore.sources.length === 0" class="p-4 text-center bg-gray-50 rounded-md">
      Brak zdefiniowanych źródeł dochodu dla tego profilu.
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">Nazwa</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="source in sourceStore.sources" :key="source.id_source" class="table-row">
            <td class="table-cell">{{ source.name }}</td>
            <td class="table-cell actions-cell">
              <button @click="editSource(source.id_source)" class="btn-action btn-edit">
                Edytuj
              </button>
              <button @click="deleteSource(source.id_source)" class="btn-action btn-delete">
                Usuń
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
