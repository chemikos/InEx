<script setup lang="ts">
import { useItemStore } from '@/stores/itemStore';

const editItem = (id: number) => {
  console.log(`Edycja pozycji ID: ${id}`);
  alert(`Edycja pozycji ID: ${id} (W BUDOWIE)`);
};

const deleteItem = (id: number) => {
  console.log(`Usuwanie pozycji ID: ${id}`);
  if (confirm(`Czy na pewno chcesz usunąć Pozycję ID: ${id}?`)) {
    alert(`Pozycja ID: ${id} usunięta! (W BUDOWIE)`);
  }
};

const itemStore = useItemStore();
</script>

<template>
  <div class="table-container item-list-container">
    <h3 class="form-title item-title-border">Pozycje Wydatków (Items)</h3>

    <p class="item-summary-box">
      Liczba pozycji w bazie:
      <span class="item-summary-amount">{{ itemStore.itemCount }}</span>
    </p>

    <div v-if="itemStore.isLoading" class="text-center p-8 text-gray-500">
      Ładowanie pozycji wydatków...
    </div>

    <div v-else-if="itemStore.items.length > 0" class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th class="table-header">ID</th>
            <th class="table-header">Nazwa Pozycji</th>
            <th class="table-header">Nazwa Kategorii</th>
            <th class="table-header">Etykiety</th>
            <th class="table-header actions-cell">Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in itemStore.items" :key="item.id_item" class="table-row item-row-hover">
            <td class="table-cell">{{ item.id_item }}</td>
            <td class="table-cell font-medium">{{ item.name }}</td>
            <td class="table-cell font-medium">{{ item.category_name }}</td>
            <td class="table-cell">
              <span v-for="label in item.labels" :key="label" class="item-label-badge">
                {{ label }}
              </span>
            </td>
            <td class="table-cell actions-cell">
              <button @click="editItem(item.id_item)" class="btn-action btn-edit">Edytuj</button>
              <button @click="deleteItem(item.id_item)" class="btn-action btn-delete">Usuń</button>
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

<style scoped>
/* Lokalny kontener, aby zachować unikalny margin-top */
.item-list-container {
  margin-top: 1.5rem;
}

/* Tytuł i obramowanie */
.item-title-border {
  color: #b91c1c; /* red-700 (z oryginalnego kodu) */
  border-bottom: 1px solid #d1d5db; /* gray-300 */
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem; /* text-2xl z oryginalnego kodu */
}

/* Sekcja Sumaryczna (Indygo) */
.item-summary-box {
  /* p-3 bg-indigo-50 rounded */
  padding: 0.75rem;
  background-color: #eef2ff; /* indigo-50 */
  border-radius: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem; /* text-lg */
}

.item-summary-amount {
  font-weight: 700;
  color: #4f46e5; /* indigo-700 */
}

/* Wiersz po najechaniu myszą (hover) */
.item-row-hover:hover {
  background-color: #f7fafc !important; /* Lekkie podświetlenie */
}

/* Styl dla Etykiet (Labels) - Odwzorowanie oryginalnych klas (Pink) */
.item-label-badge {
  /* inline-block bg-pink-100 text-pink-800 text-xs font-semibold mr-1 px-2.5 py-0.5 rounded-full */
  display: inline-block;
  background-color: #fce7f3; /* pink-100 */
  color: #9d174d; /* pink-800 */
  font-size: 0.75rem; /* text-xs */
  font-weight: 600; /* font-semibold */
  margin-right: 0.25rem;
  padding: 2px 10px;
  border-radius: 9999px; /* rounded-full */
  white-space: nowrap;
}
</style>
