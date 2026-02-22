const store = useExpensesReportStore() onMounted(() => { store.fetchReport(activeProfileId.value) })
function toggleCategory(cat) { cat.expanded = !cat.expanded if (cat.expanded && !cat.items) {
cat.items = await store.fetchCategoryItems( activeProfileId.value, cat.id, selectedPeriod.value ) }
}
