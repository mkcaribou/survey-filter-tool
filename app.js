// Enhanced app.js with styling, answer options display, and Excel export functionality
fetch('data/survey.json')
  .then(response => response.json())
  .then(data => {
    const fullData = data;
    const categorySelect = document.getElementById('categorySelect');
    const subCategorySelect = document.getElementById('subCategorySelect');
    const questionTypeSelect = document.getElementById('questionTypeSelect');
    const recommendedSelect = document.getElementById('recommendedSelect');
    const tableBody = document.querySelector('#questionsTable tbody');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const exportBtn = document.getElementById('exportBtn');

    populateSelect(categorySelect, getUniqueValues(fullData, 'Category'));
    populateSelect(subCategorySelect, getUniqueValues(fullData, 'SubCategory'));
    populateSelect(questionTypeSelect, getUniqueValues(fullData, 'QuestionType'));

    [categorySelect, subCategorySelect, questionTypeSelect, recommendedSelect]
      .forEach(select => select.addEventListener('change', updateTable));

    clearFiltersBtn.addEventListener('click', () => {
      [categorySelect, subCategorySelect, questionTypeSelect, recommendedSelect].forEach(select => select.value = '');
      updateTable();
    });

    exportBtn.addEventListener('click', () => exportToExcel(fullData));

    function updateTable() {
      const filtered = fullData.filter(item => (
        (!categorySelect.value || item.Category === categorySelect.value) &&
        (!subCategorySelect.value || item.SubCategory === subCategorySelect.value) &&
        (!questionTypeSelect.value || item.QuestionType === questionTypeSelect.value) &&
        (!recommendedSelect.value || item.Recommended === recommendedSelect.value)
      ));
      renderTable(filtered);
    }

    function renderTable(data) {
      tableBody.innerHTML = data.map(item => `
        <tr>
          <td>${item.Question}</td>
          <td>${item.Category}</td>
          <td>${item.SubCategory}</td>
          <td>${item.QuestionType}</td>
          <td>${item.Recommended}</td>
          <td>${item.QuestionResponse || 'N/A'}</td>
        </tr>`).join('');
    }

    function exportToExcel(data) {
      const csv = data.map(item =>
        [item.Question, item.Category, item.SubCategory, item.QuestionType, item.Recommended, item.QuestionResponse || 'N/A'].join(',')
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filtered_survey_questions.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    function populateSelect(selectElem, values) {
      selectElem.innerHTML = '<option value="">All</option>' + values.map(value => `<option value="${value}">${value}</option>`).join('');
    }

    function getUniqueValues(data, key) {
      return [...new Set(data.map(item => item[key]).filter(Boolean))];
    }

    updateTable();
  });
