// app.js
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

    // Populate filters
    populateSelect(categorySelect, getUniqueValues(fullData, 'Category'));
    populateSelect(subCategorySelect, getUniqueValues(fullData, 'SubCategory'));
    populateSelect(questionTypeSelect, getUniqueValues(fullData, 'QuestionType'));

    [categorySelect, subCategorySelect, questionTypeSelect, recommendedSelect]
      .forEach(select => select.addEventListener('change', updateTable));

    clearFiltersBtn.addEventListener('click', () => {
      categorySelect.value = '';
      subCategorySelect.value = '';
      questionTypeSelect.value = '';
      recommendedSelect.value = '';
      updateTable();
    });

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
      tableBody.innerHTML = '';
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.Question}</td>
          <td>${item.Category}</td>
          <td>${item.SubCategory}</td>
          <td>${item.QuestionType}</td>
          <td>${item.Recommended}</td>
        `;
        tableBody.appendChild(row);
      });
    }

    function populateSelect(selectElem, values) {
      values.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        selectElem.appendChild(option);
      });
    }

    function getUniqueValues(data, key) {
      return [...new Set(data.map(item => item[key]).filter(Boolean))];
    }

    updateTable(); // Initial table render
  });
