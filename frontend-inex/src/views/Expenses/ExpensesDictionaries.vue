<script setup lang="ts">
// Importy dla formularzy słownikowych
import AddItemForm from '@/components/dictionary/AddItemForm.vue';
import AddLabelForm from '@/components/dictionary/AddLabelForm.vue';
import AddCategoryForm from '@/components/dictionary/AddCategoryForm.vue';
import AddSourceForm from '@/components/dictionary/AddSourceForm.vue';

// Importy dla list słownikowych
import ItemList from '@/components/dictionary/ItemList.vue';
import SourceList from '@/components/dictionary/SourceList.vue';
import CategoryList from '@/components/dictionary/CategoryList.vue';
import LabelList from '@/components/dictionary/LabelList.vue';
</script>

<template>
  <div>
    <h3 class="subsection-forms-title">Dodaj Dane Słownikowe</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <AddItemForm />
      <AddLabelForm />
      <AddCategoryForm />
      <AddSourceForm />
    </div>

    <h3 class="subsection-title">Pozycje Wydatków (Items)</h3>
    <ItemList />

    <h3 class="subsection-title mt-8">Źródła, Kategorie i Etykiety</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SourceList />
      <CategoryList />
      <LabelList />
    </div>
  </div>
</template>

<style scoped>
/* Dodaj style, które były specyficzne dla sekcji Słowniki */
.subsection-forms-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
}
.subsection-title {
  font-size: 1.25rem; /* text-xl */
  font-weight: 600;
  color: #374151;
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
</style>
