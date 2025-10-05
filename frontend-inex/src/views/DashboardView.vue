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
  <main class="dashboard-main-container">
    <div
      class="main-content-area"
      v-if="profileStore.isProfileLoaded && profileStore.activeProfileId !== null"
    >
      <h2 class="dashboard-title">Dashboard: {{ profileStore.activeProfile?.name }}</h2>

      <CustomTabs
        :tab-names="['Finanse (Transakcje)', 'Pozycje i Słowniki']"
        :initial-active-tab="0"
        @tab-change="console.log('Zmieniono na zakładkę:', $event)"
      >
        <template #tab-0>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AddExpenseForm />
            <AddIncomeForm />
          </div>

          <h3 class="subsection-title">Wydatki</h3>
          <ExpenseList />

          <h3 class="subsection-title">Wpłaty</h3>
          <IncomeList />
        </template>

        <template #tab-1>
          <h3 class="subsection-forms-title">Dodaj Dane Słownikowe</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AddItemForm />
            <AddLabelForm />
            <AddCategoryForm />
            <AddSourceForm />
          </div>

          <h3 class="subsection-title">Pozycje Wydatków (Items)</h3>
          <ItemList />

          <h3 class="subsection-title">Źródła, Kategorie i Etykiety</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SourceList />
            <CategoryList />
            <LabelList />
          </div>
        </template>
      </CustomTabs>
    </div>

    <div v-else class="main-content-area">
      <AddProfileForm />
    </div>
  </main>
</template>

<style scoped>
/* Definicja głównego kontenera, zastępująca max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 */
.dashboard-main-container {
  max-width: 1280px; /* max-w-7xl */
  margin-left: auto;
  margin-right: auto;
  padding: 1.5rem 1rem; /* py-6 i defaultowy px */
}

@media (min-width: 640px) {
  .dashboard-main-container {
    padding-left: 1.5rem; /* sm:px-6 */
    padding-right: 1.5rem; /* sm:px-6 */
  }
}

@media (min-width: 1024px) {
  .dashboard-main-container {
    padding-left: 2rem; /* lg:px-8 */
    padding-right: 2rem; /* lg:px-8 */
  }
}

.main-content-area {
  margin-top: 2rem; /* mt-8 */
}

.dashboard-title {
  /* text-3xl font-extrabold text-gray-900 mb-6 */
  font-size: 1.875rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.subsection-title {
  /* text-2xl font-semibold mt-8 mb-4 */
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #1f2937;
}

.subsection-forms-title {
  /* text-xl font-semibold mt-4 mb-3 */
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
}
</style>
