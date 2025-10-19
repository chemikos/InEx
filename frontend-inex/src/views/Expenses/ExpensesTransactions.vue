<script setup lang="ts">
// Importy dla formularzy i list transakcji
import AddExpenseForm from '@/components/expense/AddExpenseForm.vue';
import AddIncomeForm from '@/components/income/AddIncomeForm.vue';
import ExpenseList from '@/components/expense/ExpenseList.vue';
import IncomeList from '@/components/income/IncomeList.vue';
</script>

<template>
  <div>
    <h2 class="section-title mb-6">Transakcje: Dodawanie i Przegląd</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <AddExpenseForm />
      <AddIncomeForm />
    </div>

    <h3 class="subsection-title">Wydatki</h3>
    <ExpenseList />

    <h3 class="subsection-title mt-8">Wpłaty</h3>
    <IncomeList />
  </div>
</template>

<style scoped>
/* Dodaj tutaj style, które były specyficzne dla sekcji Finanse, jeśli takie miałeś */
.section-title {
  font-size: 1.875rem; /* text-3xl */
  font-weight: 700;
  color: #1f2937;
}
.subsection-title {
  font-size: 1.5rem; /* text-2xl */
  font-weight: 600;
  color: #374151;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}
</style>
