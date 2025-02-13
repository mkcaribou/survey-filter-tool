document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2
    $('#categorySelect, #subCategorySelect').select2({
        placeholder: 'Select options',
        allowClear: true,
        width: '100%'
    });

    $('#questionTypeSelect, #recommendedSelect').select2({
        minimumResultsForSearch: -1,
        width: '100%'
    });

    let fullData = []; // Store the complete dataset

    // Load Excel file
    async function loadExcelFile() {
        try {
            const response = await fetch('./data/survey.xlsx');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            
            // Read the Excel file with all options enabled
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellDates: true,
                cellStyles: true,
                cellNF: true,
                cellFormula: true
            });

            // Get the first worksheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Convert to JSON with specific column mapping
            const jsonData = XLSX.utils.sheet_to_json(worksheet).map(row => ({
                Question: row['Question'] || '',
                QuestionResponse: row['Response Options'] || row['Question response'] || 'N/A',
                QuestionType: row['Type'] || row['Type of question'] || '',
                Category: row['Category'] || '',
                SubCategory: row['Sub-category'] || row['Subcategory'] || '',
                Recommended: row['Recommended'] || row['Recommended for Strive'] || ''
            }));
            
            // Store and process the data
            fullData = jsonData;
            setupFilters(jsonData);
            renderTable(jsonData);
            
        } catch (error) {
            console.error('Error loading Excel file:', error);
            document.querySelector('#questionsTable tbody').innerHTML = 
                '<tr><td colspan="6">Error loading data. Please check console for details.</td></tr>';
        }
    }

    // Get unique values for a field, handling comma-separated values
    function getUniqueValues(data, field) {
        const values = new Set();
        data.forEach(item => {
            if (item[field]) {
                const fieldValues = item[field].toString().split(',');
                fieldValues.forEach(value => {
                    const trimmedValue = value.trim();
                    if (trimmedValue) values.add(trimmedValue);
                });
            }
        });
        return Array.from(values).sort();
    }

    // Setup filter dropdowns
    function setupFilters(data) {
        // Setup category filter
        const categories = getUniqueValues(data, 'Category');
        $('#categorySelect').empty().append(
            categories.map(category => 
                new Option(category, category)
            )
        );

        // Setup sub-category filter
        const subCategories = getUniqueValues(data, 'SubCategory');
        $('#subCategorySelect').empty().append(
            subCategories.map(subCategory => 
                new Option(subCategory, subCategory)
            )
        );

        // Setup question type filter
        const questionTypes = getUniqueValues(data, 'QuestionType');
        $('#questionTypeSelect').empty().append(
            '<option value="">All types</option>'
        ).append(
            questionTypes.map(type => 
                new Option(type, type)
            )
        );

        // Setup recommended filter
        $('#recommendedSelect').empty().append(`
            <option value="">All</option>
            <option value="Recommended">Recommended</option>
            <option value="Required">Required</option>
        `);

        // Refresh Select2
        $('.select2').trigger('change');
    }

    // Filter the data based on selected values
    function filterData() {
        const selectedCategories = $('#categorySelect').val() || [];
        const selectedSubCategories = $('#subCategorySelect').val() || [];
        const selectedType = $('#questionTypeSelect').val();
        const selectedRecommended = $('#recommendedSelect').val();

        return fullData.filter(item => {
            // Category filter
            const categoryMatch = selectedCategories.length === 0 || 
                selectedCategories.some(category => 
                    item.Category && item.Category.toString()
                        .split(',')
                        .map(c => c.trim())
                        .includes(category)
                );

            // Sub-category filter
            const subCategoryMatch = selectedSubCategories.length === 0 || 
                selectedSubCategories.some(subCategory => 
                    item.SubCategory && item.SubCategory.toString()
                        .split(',')
                        .map(s => s.trim())
                        .includes(subCategory)
                );

            // Question type filter
            const typeMatch = !selectedType || 
                (item.QuestionType && item.QuestionType.toString().trim() === selectedType);

            // Recommended filter
            const recommendedMatch = !selectedRecommended || 
                (item.Recommended && item.Recommended.toString().trim() === selectedRecommended);

            return categoryMatch && subCategoryMatch && typeMatch && recommendedMatch;
        });
    }

    // Render the table with filtered data
    function renderTable(data) {
        const tbody = document.querySelector('#questionsTable tbody');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No matching records found</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${escapeHtml(item.Question)}</td>
                <td>${escapeHtml(item.QuestionResponse)}</td>
                <td>${escapeHtml(item.QuestionType)}</td>
                <td>${escapeHtml(item.Category)}</td>
                <td>${escapeHtml(item.SubCategory)}</td>
                <td>${escapeHtml(item.Recommended)}</td>
            </tr>
        `).join('');
    }

    // Helper function to escape HTML and prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Event listeners for filters
    ['categorySelect', 'subCategorySelect', 'questionTypeSelect', 'recommendedSelect']
        .forEach(id => {
            $(`#${id}`).on('change', () => {
                const filteredData = filterData();
                renderTable(filteredData);
            });
        });

    // Clear filters button
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        // Clear all select2 dropdowns
        $('#categorySelect, #subCategorySelect').val(null).trigger('change');
        $('#questionTypeSelect, #recommendedSelect').val('').trigger('change');
        
        // Reset table to show all data
        renderTable(fullData);
    });

    // Initial load
    loadExcelFile();
});