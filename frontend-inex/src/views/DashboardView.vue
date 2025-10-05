<script setup lang="ts">
// import ProfileSelector from '@/components/ProfileSelector.vue';
import SourceList from '@/components/SourceList.vue';
import IncomeList from '@/components/IncomeList.vue';
import CategoryList from '@/components/CategoryList.vue';
import LabelList from '@/components/LabelList.vue';
import ItemList from '@/components/ItemList.vue';
import ExpenseList from '@/components/ExpenseList.vue';

import AddProfileForm from '@/components/AddProfileForm.vue';
import AddSourceForm from '@/components/AddSourceForm.vue';
import AddIncomeForm from '@/components/AddIncomeForm.vue';
import AddCategoryForm from '@/components/AddCategoryForm.vue';
import AddLabelForm from '@/components/AddLabelForm.vue';
import AddItemForm from '@/components/AddItemForm.vue';
import AddExpenseForm from '@/components/AddExpenseForm.vue';

import { useProfileStore } from '@/stores/profileStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLabelStore } from '@/stores/labelStore';
import { useItemStore } from '@/stores/itemStore';
import { useExpenseStore } from '@/stores/expenseStore';

import { watch, onMounted } from 'vue';

import CustomTabs from '@/components/CustomTabs.vue';

const profileStore = useProfileStore();
const sourceStore = useSourceStore();
const incomeStore = useIncomeStore();
const categoryStore = useCategoryStore();
const labelStore = useLabelStore();
const itemStore = useItemStore();
const expenseStore = useExpenseStore();

const loadDataForProfile = (profileId: number | null) => {
  if (profileId !== null) {
    console.log(`Dashboard: Ładowanie źródeł dochodów dla profilu ID: ${profileId}`);
    sourceStore.fetchSources(profileId);
    incomeStore.fetchIncomes(profileId);
    categoryStore.fetchCategories(profileId);
    labelStore.fetchLabels(profileId);
    expenseStore.fetchExpenses(profileId);
    itemStore.fetchItems(profileId);
  } else {
    sourceStore.sources = [];
    incomeStore.incomes = [];
    categoryStore.categories = [];
    labelStore.labels = [];
    expenseStore.expenses = [];
    itemStore.items = [];
  }
};

// Reakcja na zmianę aktywnego ID profilu
watch(
  () => profileStore.activeProfileId,
  (newId) => {
    loadDataForProfile(newId);
  },
  { immediate: true },
);

// Upewnij się, że profile zostaną pobrane
onMounted(() => {
  if (profileStore.allProfiles.length === 0) {
    profileStore.fetchProfiles();
  }
});
</script>

<template>
  <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="mt-8" v-if="profileStore.isProfileLoaded && profileStore.activeProfileId !== null">
      <h2 class="text-3xl font-extrabold text-gray-900 mb-6">
        Dashboard: {{ profileStore.activeProfile?.name }}
      </h2>

      <CustomTabs
        :tab-names="['Finanse (Transakcje)', 'Pozycje i Słowniki']"
        :initial-active-tab="0"
        @tab-change="console.log('Zmieniono na zakładkę:', $event)"
      >
        <template #tab-0>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AddIncomeForm />
            <AddExpenseForm />
          </div>

          <h3 class="text-2xl font-semibold mt-8 mb-4">Wpłaty</h3>
          <IncomeList />

          <h3 class="text-2xl font-semibold mt-8 mb-4">Wydatki</h3>
          <ExpenseList />
        </template>

        <template #tab-1>
          <h3 class="text-xl font-semibold mt-4 mb-3">Dodaj Dane Słownikowe</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AddSourceForm />
            <AddCategoryForm />
            <AddLabelForm />
            <AddItemForm />
          </div>

          <h3 class="text-2xl font-semibold mt-8 mb-4">Pozycje Wydatków (Items)</h3>
          <ItemList />

          <h3 class="text-2xl font-semibold mt-8 mb-4">Źródła, Kategorie i Etykiety</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SourceList />
            <CategoryList />
            <LabelList />
          </div>
        </template>
      </CustomTabs>
    </div>

    <div v-else class="mt-8">
      <AddProfileForm />
    </div>
  </main>
</template>
