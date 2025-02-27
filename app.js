document.addEventListener('DOMContentLoaded', function() {
    // Initialize Select2
    $('#categorySelect, #subCategorySelect, #questionTypeSelect').select2({
        placeholder: 'Select options',
        allowClear: true,
        width: '100%',
        closeOnSelect: false
    });

    $('#recommendedSelect').select2({
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
                Recommended: row['Recommended'] || row['Recommended for Strive'] || '',
                GroupID: row['GroupID'] || '',
                Sequence: row['Sequence'] || 0
            }));
            
            // Store and process the data
            fullData = sortQuestions(jsonData);
            setupFilters(jsonData);
            renderTable(jsonData);
            
        } catch (error) {
            console.error('Error loading Excel file:', error);
            document.querySelector('#questionsTable tbody').innerHTML = 
                '<tr><td colspan="6">Error loading data. Please check console for details.</td></tr>';
        }
    }

    // Sort questions by GroupID, Sequence, and Category
    function sortQuestions(data) {
        return [...data].sort((a, b) => {
            // If both items have GroupIDs
            if (a.GroupID && b.GroupID) {
                // If they're in the same group, sort by sequence
                if (a.GroupID === b.GroupID) {
                    return a.Sequence - b.Sequence;
                }
                // Different groups, sort by GroupID
                return a.GroupID.localeCompare(b.GroupID);
            }
            // If only one has GroupID, grouped items come first
            if (a.GroupID) return -1;
            if (b.GroupID) return 1;
            // Neither has GroupID, sort by Category
            return a.Category.localeCompare(b.Category);
        });
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
        const selectedTypes = $('#questionTypeSelect').val() || [];
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
            const typeMatch = selectedTypes.length === 0 || 
                selectedTypes.some(type => 
                    item.QuestionType && item.QuestionType.toString().trim() === type
                );

            // Recommended filter
            const recommendedMatch = !selectedRecommended || 
                (item.Recommended && item.Recommended.toString().trim() === selectedRecommended);

            return categoryMatch && subCategoryMatch && typeMatch && recommendedMatch;
        });
    }

    // Helper function to format response options with line breaks
    function formatResponseOptions(str) {
        if (!str) return '';
        const lines = str.split('-').map(line => line.trim()).filter(line => line);
        if (lines.length <= 1) return escapeHtml(str);
        return lines.map(line => `- ${escapeHtml(line)}`).join('<br>');
    }

    // Helper function to escape HTML and prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Render the table with filtered data
    function renderTable(data) {
        const tbody = document.querySelector('#questionsTable tbody');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No matching records found</td></tr>';
            return;
        }

        let currentGroup = '';
        tbody.innerHTML = sortQuestions(data).map(item => {
            const isNewGroup = item.GroupID && item.GroupID !== currentGroup;
            currentGroup = item.GroupID;
            
            return `
                <tr class="${item.GroupID ? 'grouped-question' : ''} ${isNewGroup ? 'group-start' : ''}">
                    <td>${escapeHtml(item.Question)}</td>
                    <td>${formatResponseOptions(item.QuestionResponse)}</td>
                    <td>${escapeHtml(item.QuestionType)}</td>
                    <td>${escapeHtml(item.Category)}</td>
                    <td>${escapeHtml(item.SubCategory)}</td>
                    <td>${escapeHtml(item.Recommended)}</td>
                </tr>
            `;
        }).join('');
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
        $('#categorySelect, #subCategorySelect, #questionTypeSelect').val(null).trigger('change');
        $('#recommendedSelect').val('').trigger('change');
        
        // Reset table to show all data
        renderTable(fullData);
    });

    // Export to Excel functionality
    document.getElementById('exportBtn').addEventListener('click', () => {
        const filteredData = filterData();
        
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // Convert the filtered data to the format we want to export
        const exportData = filteredData.map(item => ({
            'Question': item.Question,
            'Response options': item.QuestionResponse,
            'Type': item.QuestionType,
            'Category': item.Category,
            'Sub-category': item.SubCategory,
            'Required/recommended': item.Recommended,
            'GroupID': item.GroupID,
            'Sequence': item.Sequence
        }));
        
        // Create a worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Filtered Questions");
        
        // Generate the file and trigger download
        XLSX.writeFile(wb, "survey_questions_export.xlsx");
    });

    // Initial load
    loadExcelFile();
});