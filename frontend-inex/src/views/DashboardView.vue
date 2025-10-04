<script setup lang="ts">
import ProfileSelector from '@/components/ProfileSelector.vue';
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

import { useProfileStore } from '@/stores/profileStore';
import { useSourceStore } from '@/stores/sourceStore';
import { useIncomeStore } from '@/stores/incomeStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLabelStore } from '@/stores/labelStore';
import { useItemStore } from '@/stores/itemStore';
import { useExpenseStore } from '@/stores/expenseStore';

import { watch, onMounted } from 'vue';

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
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 text-indigo-700">InEx - Dashboard</h1>

    <ProfileSelector />

    <AddProfileForm />
    <div v-if="profileStore.isProfileLoaded && profileStore.activeProfileId !== null">
      <h2 class="text-2xl font-semibold mt-8 mb-4">Przegląd</h2>

      <div class="mb-8">
        <SourceList />

        <IncomeList />

        <CategoryList />

        <LabelList />

        <ItemList />

        <ExpenseList />
      </div>
    </div>
    <div v-if="profileStore.isProfileLoaded && profileStore.activeProfileId !== null">
      <h2 class="text-2xl font-semibold mt-8 mb-4">Dodawanie Danych Słownikowych</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AddSourceForm />

        <AddIncomeForm />

        <AddCategoryForm />

        <AddLabelForm />
        <!-- 
        <div class="p-8 border border-dashed text-gray-500 rounded-lg text-center bg-gray-50">
          Formularze dodawania Kategorii/Etykiet/Pozycji
        </div> -->
      </div>

      <!-- <h2 class="text-2xl font-semibold mt-8 mb-4">Przegląd Finansów i Struktura Danych</h2> -->
    </div>
    <div v-else-if="profileStore.allProfiles.length === 0 && profileStore.isProfileLoaded">
      <p class="text-xl text-red-500 mt-10">
        Błąd: Nie znaleziono żadnych profili w bazie. Dodaj profil.
      </p>
    </div>
  </div>
</template>
