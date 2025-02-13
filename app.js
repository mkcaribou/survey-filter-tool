// Integrated XLSX.js and fully updated script with filters and table rendering

// Step 1: Add XLSX.js in your HTML file:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js"></script>

// Step 2: Place 'survey.xlsx' in the 'data/' folder.

// Step 3: Full script replacement with integrated data loading and rendering:
const fetchExcel = async () => {
  const response = await fetch('data/survey.xlsx');
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  return jsonData;
};

fetchExcel().then(data => {
  const fullData = data.map(row => ({
    Question: row['Question'],
    QuestionType: row['Type of question'],
    Category: row['Category'],
    SubCategory: row['Sub-category'],
    Recommended: row['Recommended for Strive'],
    QuestionResponse: row['Question response'] || 'N/A'
  }));

  setupFilters(fullData);
  renderTable(fullData);
});

// Updated Filters:
function setupFilters(data) {
  populateSelect(categorySelect, getUniqueValues(data, 'Category'));
  populateSelect(subCategorySelect, getUniqueValues(data, 'SubCategory'));
  populateSelect(questionTypeSelect, getUniqueValues(data, 'QuestionType'));
  recommendedSelect.innerHTML = '<option value="">All</option><option value="Yes">Yes</option><option value="No">No</option>';
  
  [categorySelect, subCategorySelect, questionTypeSelect, recommendedSelect]
    .forEach(select => select.addEventListener('change', () => renderTable(filterData(data))));
}

// Updated Table Renderer:
function renderTable(data) {
  const tableBody = document.querySelector('#questionsTable tbody');
  tableBody.innerHTML = data.map(item => `
    <tr>
      <td>${item.Question}</td>
      <td>${item.QuestionType}</td>
      <td>${item.Category}</td>
      <td>${item.SubCategory}</td>
      <td>${item.Recommended}</td>
      <td>${item.QuestionResponse}</td>
    </tr>
  `).join('');
}

// Helper Functions:
function populateSelect(selectElem, values) {
  selectElem.innerHTML = '<option value="">All</option>' + values.map(value => `<option value="${value}">${value}</option>`).join('');
}

function getUniqueValues(data, key) {
  return [...new Set(data.map(item => item[key]).filter(Boolean))];
}

function filterData(data) {
  return data.filter(item => (
    (!categorySelect.value || item.Category === categorySelect.value) &&
    (!subCategorySelect.value || item.SubCategory === subCategorySelect.value) &&
    (!questionTypeSelect.value || item.QuestionType === questionTypeSelect.value) &&
    (!recommendedSelect.value || item.Recommended === recommendedSelect.value)
  ));
}

// Step 4 & 5: Fully replaces previous scripts. Commit, push to GitHub, and test the page.
