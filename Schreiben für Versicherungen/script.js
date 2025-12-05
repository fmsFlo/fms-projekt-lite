// German Insurance Companies Database - Complete List with Full Addresses
const insuranceDatabase = [
    { name: "ACM Lebensversicherung AG", email: "kontakt-acmd@acmd.de", address: "Breite Straße 29, 40213 Düsseldorf", category: "Lebensversicherung" },
    { name: "AGER Lebensversicherung AG", email: "service@axa.de", address: "Colonia-Allee 15, 51067 Köln", category: "Lebensversicherung" },
    { name: "Aioi Nissay Dowa Life Insurance of Europe Aktiengesellschaft", email: "kundenservice-life@aioinissaydowa.eu", address: "Carl-Zeiss-Ring 25, 85737 Ismaning", category: "Lebensversicherung" },
    { name: "Allianz Lebensversicherungs-Aktiengesellschaft", email: "info@allianz.de", address: "Heßbrühlstraße 2, 70565 Stuttgart", category: "Lebensversicherung" },
    { name: "Alte Leipziger Lebensversicherung auf Gegenseitigkeit", email: "service@alte-leipziger.de", address: "Alte Leipziger-Platz 1, 61440 Oberursel", category: "Lebensversicherung" },
    { name: "Athora Lebensversicherung Aktiengesellschaft", email: "info.ge@athora.com", address: "Söhnleinstraße 8, 65201 Wiesbaden", category: "Lebensversicherung" },
    { name: "AXA Lebensversicherung Aktiengesellschaft", email: "service@axa.de", address: "Colonia Allee 10 - 20, 51067 Köln", category: "Lebensversicherung" },
    { name: "Baloise Lebensversicherung Aktiengesellschaft Deutschland", email: "info@baloise.de", address: "Ludwig-Erhard-Straße 22, 20459 Hamburg", category: "Lebensversicherung" },
    { name: "Bayern-Versicherung Lebensversicherung Aktiengesellschaft", email: "service@vkb.de", address: "Maximilianstraße 53, 80530 München", category: "Lebensversicherung" },
    { name: "BL die Bayerische Lebensversicherung AG", email: "info@diebayerische.de", address: "Thomas-Dehler-Straße 25, 81737 München", category: "Lebensversicherung" },
    { name: "BY die Bayerische Vorsorge Lebensversicherung a.G.", email: "info@diebayerische.de", address: "Thomas-Dehler-Straße 25, 81737 München", category: "Lebensversicherung" },
    { name: "Concordia oeco Lebensversicherungs-AG", email: "versicherungen@concordia.de", address: "Karl-Wiechert-Allee 55, 30625 Hannover", category: "Lebensversicherung" },
    { name: "Condor Lebensversicherungs-Aktiengesellschaft", email: "kundenservice@condor-versicherungen.de", address: "Heidenkampsweg 102, 20097 Hamburg", category: "Lebensversicherung" },
    { name: "Continentale Lebensversicherung AG", email: "info@continentale.de", address: "Baierbrunner Straße 31-33, 81379 München", category: "Lebensversicherung" },
    { name: "Cosmos Lebensversicherungs-Aktiengesellschaft", email: "info@cosmosdirekt.de", address: "Halbergstraße 50-60, 66121 Saarbrücken", category: "Lebensversicherung" },
    { name: "Credit Life AG", email: "service@creditlife.net", address: "RheinLandplatz 1, 41460 Neuss", category: "Lebensversicherung" },
    { name: "Debeka Lebensversicherungsverein auf Gegenseitigkeit Sitz Koblenz am Rhein", email: "kundenservice@debeka.de", address: "Debeka-Platz 1, 56073 Koblenz am Rhein", category: "Lebensversicherung" },
    { name: "Delta Direkt Lebensversicherung Aktiengesellschaft München", email: "info@deltadirekt.de", address: "Ottostraße 16, 80333 München", category: "Lebensversicherung" },
    { name: "Deutsche Lebensversicherungs-Aktiengesellschaft", email: "info.dlvag@allianz.de", address: "Merlitzstraße 8, 12489 Berlin", category: "Lebensversicherung" },
    { name: "Deutsche Ärzteversicherung Aktiengesellschaft", email: "service@aerzteversicherung.de", address: "Colonia-Allee 10-20, 51067 Köln", category: "Lebensversicherung" },
    { name: "DEVK Allgemeine Lebensversicherungs-Aktiengesellschaft", email: "info@devk.de", address: "Riehler Straße 190, 50735 Köln", category: "Lebensversicherung" },
    { name: "DEVK Deutsche Eisenbahn Versicherung Lebensversicherungsverein a.G. Betriebliche Sozialeinrichtung der Deutschen Bahn", email: "info@devk.de", address: "Riehler Straße 190, 50735 Köln", category: "Lebensversicherung" },
    { name: "Dialog Lebensversicherungs-Aktiengesellschaft", email: "service@dialog-versicherung.de", address: "Stadtberger Straße 99, 86157 Augsburg", category: "Lebensversicherung" },
    { name: "DIREKTE LEBEN Versicherung AG", email: "info@direkte-leben.de", address: "Rotebühlstraße 120, 70197 Stuttgart", category: "Lebensversicherung" },
    { name: "Dortmunder Lebensversicherung AG", email: "info@die-dortmunder.de", address: "Südwall 37-41, 44137 Dortmund", category: "Lebensversicherung" },
    { name: "Entis Lebensversicherung AG", email: "service@entis-lv.de", address: "Dornhofstraße 36, 63263 Neu-Isenburg", category: "Lebensversicherung" },
    { name: "ERGO Lebensversicherung Aktiengesellschaft", email: "info@ergo.de", address: "Überseering 45, 22297 Hamburg", category: "Lebensversicherung" },
    { name: "ERGO Vorsorge Lebensversicherung Aktiengesellschaft", email: "info@ergo-vorsorge.de", address: "ERGO-Platz 1, 40477 Düsseldorf", category: "Lebensversicherung" },
    { name: "EUROPA Lebensversicherung Aktiengesellschaft", email: "info@continentale.de", address: "Piusstraße 137, 50931 Köln", category: "Lebensversicherung" },
    { name: "Frankfurt Münchener Lebensversicherung AG", email: "anfrage.fml@flgruppe.de", address: "Stahlgruberring 52, 81829 München", category: "Lebensversicherung" },
    { name: "Frankfurter Lebensversicherung AG", email: "anfrage.fl@flgruppe.de", address: "Am Weidenring 56, 61352 Bad Homburg v.d. Höhe", category: "Lebensversicherung" },
    { name: "Generali Deutschland Lebensversicherung AG", email: "service@generali.de", address: "Adenauerring 7, 81737 München", category: "Lebensversicherung" },
    { name: "Gothaer Lebensversicherung Aktiengesellschaft", email: "info@gothaer.de", address: "Arnoldiplatz 1, 50969 Köln", category: "Lebensversicherung" },
    { name: "Hannoversche Lebensversicherung AG", email: "kontakt@hannoversche-leben.de", address: "VHV-Platz 1, 30177 Hannover", category: "Lebensversicherung" },
    { name: "Hallesche", email: "service@hallesche.de", address: "Löffelstraße 34-38, 70597 Stuttgart", category: "Lebensversicherung" },
    { name: "HanseMerkur Lebensversicherung AG", email: "info@hansemerkur.de", address: "Siegfried-Wedells-Platz 1, 20354 Hamburg", category: "Lebensversicherung" },
    { name: "HDI Lebensversicherung AG", email: "leben.service@hdi.de", address: "Charles-de-Gaulle-Platz 1, 50679 Köln", category: "Lebensversicherung" },
    { name: "Heidelberger Lebensversicherung AG", email: "service@heidelberger-leben.de", address: "Dornhofstraße 36, 63263 Neu-Isenburg", category: "Lebensversicherung" },
    { name: "HELVETIA schweizerische Lebensversicherungs-Aktiengesellschaft", email: "info@helvetia.de", address: "Weißadlergasse 2, 60311 Frankfurt am Main", category: "Lebensversicherung" },
    { name: "HUK-COBURG-Lebensversicherung AG", email: "Info@HUK-COBURG.de", address: "Bahnhofsplatz, 96450 Coburg", category: "Lebensversicherung" },
    { name: "IDEAL Lebensversicherung a.G.", email: "info@ideal-versicherung.de", address: "Kochstraße 26, 10969 Berlin", category: "Lebensversicherung" },
    { name: "INTER Lebensversicherung AG", email: "info@inter.de", address: "Erzbergerstraße 9-15, 68165 Mannheim", category: "Lebensversicherung" },
    { name: "InterRisk Lebensversicherungs-AG Vienna Insurance Group.", email: "info@interrisk.de", address: "Carl-Bosch-Straße 5, 65203 Wiesbaden", category: "Lebensversicherung" },
    { name: "Itzehoer Lebensversicherungs-Aktiengesellschaft", email: "info@itzehoer.de", address: "Itzehoer Platz, 25521 Itzehoe", category: "Lebensversicherung" },
    { name: "Lebensversicherung von 1871 auf Gegenseitigkeit München", email: "info@lv1871.de", address: "Maximiliansplatz 5, 80333 München", category: "Lebensversicherung" },
    { name: "Lifestyle Protection Lebensversicherung AG", email: "info@lifestyle-protection.net", address: "Proactiv-Platz 1, 40721 Hilden", category: "Lebensversicherung" },
    { name: "LPV Lebensversicherung AG", email: "info@lifestyle-protection.com", address: "ProActiv-Platz 1, 40721 Hilden", category: "Lebensversicherung" },
    { name: "LVM Lebensversicherungs-AG", email: "info@lvm.de", address: "Kolde-Ring 21, 48151 Münster", category: "Lebensversicherung" },
    { name: "Mecklenburgische Lebensversicherungs-Aktiengesellschaft", email: "service@mecklenburgische.de", address: "Platz der Mecklenburgischen 1, 30625 Hannover", category: "Lebensversicherung" },
    { name: "myLife Lebensversicherung AG", email: "info@mylife-leben.de", address: "Herzberger Landstraße 25, 37085 Göttingen", category: "Lebensversicherung" },
    { name: "MÜNCHENER VEREIN Lebensversicherung AG", email: "info@muenchener-verein.de", address: "Pettenkoferstraße 19, 80336 München", category: "Lebensversicherung" },
    { name: "neue leben Lebensversicherung Aktiengesellschaft", email: "info@neueleben.de", address: "Hammerbrookstraße 69, 20097 Hamburg", category: "Lebensversicherung" },
    { name: "NÜRNBERGER Lebensversicherung Aktiengesellschaft", email: "info@nuernberger.de", address: "Ostendstraße 100, 90482 Nürnberg", category: "Lebensversicherung" },
    { name: "Protektor Lebensversicherungs-AG", email: "contact@protektor-ag.de", address: "Wilhelmstraße 43G, 10117 Berlin", category: "Lebensversicherung" },
    { name: "Provinzial Lebensversicherung Aktiengesellschaft", email: "service@provinzial.de", address: "Sophienblatt 33, 24114 Kiel", category: "Lebensversicherung" },
    { name: "Provinzial Lebensversicherung Hannover", email: "service@vgh.de", address: "Schiffgraben 4, 30159 Hannover", category: "Lebensversicherung" },
    { name: "Proxalto Lebensversicherung Aktiengesellschaft c/o Viridium Group GmbH & Co. KG", email: "service@proxalto-lv.de", address: "Adenauerring 7, 81737 München", category: "Lebensversicherung" },
    { name: "R + V Lebensversicherung a.G.", email: "ruv@ruv.de", address: "Wilhelmstraße 1, 65343 Eltville", category: "Lebensversicherung" },
    { name: "R + V LEBENSVERSICHERUNG AKTIENGESELLSCHAFT", email: "ruv@ruv.de", address: "Raiffeisenplatz 1, 65189 Wiesbaden", category: "Lebensversicherung" },
    { name: "SIGNAL IDUNA Lebensversicherung a. G.", email: "info@signal-iduna.de", address: "Neue Rabenstraße 15 - 19, 20354 Hamburg", category: "Lebensversicherung" },
    { name: "SIGNAL IDUNA Lebensversicherung AG", email: "info@signal-iduna.de", address: "Joseph-Scherer-Straße 3, 44139 Dortmund", category: "Lebensversicherung" },
    { name: "Skandia Lebensversicherung Aktiengesellschaft", email: "service@ska-lv.de", address: "Dornhofstraße 36, 63263 Neu-Isenburg", category: "Lebensversicherung" },
    { name: "Sparkassen-Versicherung Sachsen Lebensversicherung Aktiengesellschaft", email: "service@sv-sachsen.de", address: "An der Flutrinne 12, 01139 Dresden", category: "Lebensversicherung" },
    { name: "Stuttgarter Lebensversicherung a.G.", email: "info@stuttgarter.de", address: "Rotebühlstraße 120, 70197 Stuttgart", category: "Lebensversicherung" },
    { name: "SV SparkassenVersicherung Lebensversicherung Aktiengesellschaft", email: "service@sparkassenversicherung.de", address: "Löwentorstraße 65, 70376 Stuttgart", category: "Lebensversicherung" },
    { name: "Swiss Life Lebensversicherung SE", email: "info@swisslife.de", address: "Zeppelinstraße 1, 85748 Garching b. München", category: "Lebensversicherung" },
    { name: "TARGO Lebensversicherung AG", email: "info@targoversicherung.de", address: "ProACTIV-Platz 1, 40721 Hilden", category: "Lebensversicherung" },
    { name: "uniVersa Lebensversicherung a.G.", email: "service@universa.de", address: "Sulzbacher Straße 1 - 7, 90489 Nürnberg", category: "Lebensversicherung" },
    { name: "VEREINIGTE POSTVERSICHERUNG VVaG", email: "info@vpv.de", address: "Mittlerer Pfad 19, 70499 Stuttgart", category: "Lebensversicherung" },
    { name: "Versicherer im Raum der Kirchen Lebensversicherung AG", email: "info@vrk.de", address: "Doktorweg 2-4, 32756 Detmold", category: "Lebensversicherung" },
    { name: "Victoria Lebensversicherung Aktiengesellschaft", email: "info@ergo.de", address: "ERGO-Platz 1, 40477 Düsseldorf", category: "Lebensversicherung" },
    { name: "Volkswohl-Bund Lebensversicherung a.G.", email: "info@volkswohl-bund.de", address: "Südwall 37-41, 44137 Dortmund", category: "Lebensversicherung" },
    { name: "VPV Lebensversicherungs-Aktiengesellschaft", email: "info@vpv.de", address: "Mittlerer Pfad 19, 70499 Stuttgart", category: "Lebensversicherung" },
    { name: "WGV-Lebensversicherung AG", email: "lv@wgv.de", address: "Tübinger Straße 55, 70178 Stuttgart", category: "Lebensversicherung" },
    { name: "WWK Lebensversicherung auf Gegenseitigkeit", email: "info@wwk.de", address: "Marsstraße 37, 80335 München", category: "Lebensversicherung" },
    { name: "Württembergische Lebensversicherung Aktiengesellschaft", email: "info@wuerttembergische.de", address: "W+W-Platz 1, 70806 Kornwestheim", category: "Lebensversicherung" },
    { name: "Zurich Deutscher Herold Lebensversicherung Aktiengesellschaft", email: "service@zurich.de", address: "Deutzer Allee 1, 50679 Köln", category: "Lebensversicherung" },
    { name: "Zurich Life Legacy Versicherung AG (Deutschland)", email: "service@zurich.de", address: "Deutzer Allee 1, 50679 Köln", category: "Lebensversicherung" },
    { name: "Öffentliche Lebensversicherung Sachsen-Anhalt", email: "service.magdeburg@oesa.de", address: "Am Alten Theater 7, 39104 Magdeburg", category: "Lebensversicherung" }
];

// Insurance Document Request Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('insuranceForm');
    const formSection = document.getElementById('formSection');
    const confirmationSection = document.getElementById('confirmationSection');
    const submitBtn = document.querySelector('.submit-btn');
    const openEmailBtn = document.getElementById('openEmailBtn');
    const newRequestBtn = document.getElementById('newRequestBtn');
    const deadlineInput = document.getElementById('deadline');
    const insuranceCompanyInput = document.getElementById('insuranceCompany');
    const insuranceEmailInput = document.getElementById('insuranceEmail');
    const suggestionsDropdown = document.getElementById('insuranceSuggestions');

    // Set default deadline to +14 days
    function setDefaultDeadline() {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 14);
        deadlineInput.value = futureDate.toISOString().split('T')[0];
    }

    // Initialize default deadline
    setDefaultDeadline();

    // Autocomplete functionality
    let currentSuggestions = [];
    let selectedIndex = -1;

    function searchInsuranceCompanies(query) {
        if (query.length < 2) return [];
        
        const searchTerm = query.toLowerCase();
        return insuranceDatabase.filter(company => 
            company.name.toLowerCase().includes(searchTerm) ||
            company.category.toLowerCase().includes(searchTerm)
        ).slice(0, 8); // Limit to 8 suggestions
    }

    function displaySuggestions(suggestions) {
        suggestionsDropdown.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionsDropdown.style.display = 'none';
            return;
        }

        suggestions.forEach((company, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
                <div class="suggestion-name">${company.name}</div>
                <div class="suggestion-email">${company.email}</div>
            `;
            
            suggestionItem.addEventListener('click', () => {
                selectInsuranceCompany(company);
            });
            
            suggestionsDropdown.appendChild(suggestionItem);
        });
        
        suggestionsDropdown.style.display = 'block';
        currentSuggestions = suggestions;
        selectedIndex = -1;
    }

    function selectInsuranceCompany(company) {
        insuranceCompanyInput.value = company.name;
        insuranceEmailInput.value = company.email;
        suggestionsDropdown.style.display = 'none';
        currentSuggestions = [];
        selectedIndex = -1;
        
        // Store company data for email generation
        window.selectedInsuranceCompany = company;
        
        // Visual feedback
        insuranceCompanyInput.style.borderColor = '#27ae60';
    }

    function highlightSuggestion(index) {
        const items = suggestionsDropdown.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }

    // Insurance company input event listeners
    insuranceCompanyInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length >= 2) {
            const suggestions = searchInsuranceCompanies(query);
            displaySuggestions(suggestions);
        } else {
            suggestionsDropdown.style.display = 'none';
            currentSuggestions = [];
            insuranceEmailInput.value = '';
        }
    });

    insuranceCompanyInput.addEventListener('keydown', function(e) {
        if (suggestionsDropdown.style.display === 'none') return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                highlightSuggestion(selectedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                highlightSuggestion(selectedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
                    selectInsuranceCompany(currentSuggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                suggestionsDropdown.style.display = 'none';
                selectedIndex = -1;
                break;
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-container')) {
            suggestionsDropdown.style.display = 'none';
            selectedIndex = -1;
        }
    });

    // Form validation
    function validateForm() {
        const requiredFields = ['name', 'address', 'email', 'insuranceCompany', 'policyNumber'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!field.value.trim()) {
                field.style.borderColor = '#e74c3c';
                isValid = false;
            } else {
                field.style.borderColor = '#e1e8ed';
            }
        });

        // Validate email format
        const emailField = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailField.value && !emailRegex.test(emailField.value)) {
            emailField.style.borderColor = '#e74c3c';
            alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            isValid = false;
        }

        // Check if at least one document is selected
        const documentCheckboxes = document.querySelectorAll('input[name="documents"]:checked');
        if (documentCheckboxes.length === 0) {
            alert('Bitte wählen Sie mindestens ein gewünschtes Dokument aus.');
            isValid = false;
        }

        return isValid;
    }

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Generate email content
    function generateEmailContent(formData) {
        const selectedDocuments = Array.from(document.querySelectorAll('input[name="documents"]:checked'))
            .map(cb => `□ ${cb.value}`)
            .join('\n');

        const subject = `Anforderung von Versicherungsunterlagen - ${formData.insuranceCompany}`;
        
        // Get insurance company address if available
        const insuranceAddress = window.selectedInsuranceCompany ? window.selectedInsuranceCompany.address : formData.insuranceCompany;
        
        const body = `${formData.name}
${formData.address}

Name der Versicherungsgesellschaft: ${formData.insuranceCompany}
Datum: ${new Date().toLocaleDateString('de-DE')}
Adresse: ${insuranceAddress}
Versicherungsnehmer/in: ${formData.name}
Versicherungsschein-Nr: ${formData.policyNumber}

Anforderung von Versicherungsunterlagen

Sehr geehrte Damen und Herren,

zu im Betreff näher bezeichnetem Versicherungsvertrag bitte ich um Zusendung nachfolgend genannter, mit einem Kreuz versehenen Versicherungsunterlagen in Kopie.

${selectedDocuments}

Sofern nicht in letzter Standmitteilung enthalten, wird zusätzlich um Mitteilung

1. der vereinbarten Leistung zuzüglich garantierter Überschussbeteiligung bei Vertragsablauf/Rentenbeginn,
2. der vereinbarten Leistung zuzüglich garantierter Überschussbeteiligung zum Vertragsablauf/Rentenbeginn unter der Voraussetzung einer prämienfreien Versicherung,
3. des aktuellen Rückkaufswertes gebeten.

Zudem wird um eine Aufstellung der bislang gezahlten Prämien gebeten. Sie können mir die Unterlagen auch gerne per Email zukommen lassen. Email: ${formData.email}

Ich bitte um Zusendung bis zum ${formatDate(formData.deadline)}.

Mit bestem Dank und freundlichen Grüßen

${formData.name}`;

        // Use the selected insurance email if available
        const recipientEmail = formData.insuranceEmail || 'datenschutz@versicherung.de';
        
        return { subject, body, recipientEmail };
    }

    // Show loading state
    function showLoading() {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    }

    // Hide loading state
    function hideLoading() {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }

    // Simulate document generation (placeholder for Zapier/Make integration)
    function generateDocument(formData) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                console.log('Document generation simulation:', formData);
                // Here you would integrate with Zapier/Make to:
                // 1. Generate document from template
                // 2. Replace placeholders with form data
                // 3. Send PDF via email
                resolve(true);
            }, 2000);
        });
    }

    // Show confirmation page
    function showConfirmation(formData) {
        formSection.style.display = 'none';
        confirmationSection.style.display = 'block';
        confirmationSection.classList.add('show');
        
        // Scroll to confirmation
        confirmationSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Reset form
    function resetForm() {
        form.reset();
        setDefaultDeadline();
        
        // Reset all checkboxes
        document.querySelectorAll('input[name="documents"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset field borders
        document.querySelectorAll('.form-input, .form-textarea').forEach(field => {
            field.style.borderColor = '#e1e8ed';
        });
        
        // Reset insurance email
        insuranceEmailInput.value = '';
        suggestionsDropdown.style.display = 'none';
        currentSuggestions = [];
        selectedIndex = -1;
    }

    // Show form again
    function showForm() {
        confirmationSection.style.display = 'none';
        confirmationSection.classList.remove('show');
        formSection.style.display = 'block';
        formSection.classList.remove('hidden');
        
        // Scroll to form
        formSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Form submission handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const formData = {
            name: document.getElementById('name').value.trim(),
            address: document.getElementById('address').value.trim(),
            email: document.getElementById('email').value.trim(),
            insuranceCompany: document.getElementById('insuranceCompany').value.trim(),
            insuranceEmail: document.getElementById('insuranceEmail').value.trim(),
            policyNumber: document.getElementById('policyNumber').value.trim(),
            deadline: document.getElementById('deadline').value,
            documents: Array.from(document.querySelectorAll('input[name="documents"]:checked'))
                .map(cb => cb.value)
        };

        showLoading();

        try {
            // Simulate document generation
            await generateDocument(formData);
            
            // Store form data for email generation
            window.formData = formData;
            
            hideLoading();
            showConfirmation(formData);
            
        } catch (error) {
            hideLoading();
            alert('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
            console.error('Error:', error);
        }
    });

    // Email button handler
    openEmailBtn.addEventListener('click', function() {
        if (window.formData) {
            const emailContent = generateEmailContent(window.formData);
            const mailtoLink = `mailto:${emailContent.recipientEmail}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`;
            window.open(mailtoLink);
        }
    });

    // New request button handler
    newRequestBtn.addEventListener('click', function() {
        resetForm();
        showForm();
    });

    // Real-time validation
    const requiredFields = ['name', 'address', 'email', 'insuranceCompany', 'policyNumber'];
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        field.addEventListener('blur', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#27ae60';
            } else {
                this.style.borderColor = '#e74c3c';
            }
        });
        
        field.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#e1e8ed';
            }
        });
    });

    // Special email validation
    const emailField = document.getElementById('email');
    emailField.addEventListener('blur', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value.trim() && emailRegex.test(this.value)) {
            this.style.borderColor = '#27ae60';
        } else if (this.value.trim()) {
            this.style.borderColor = '#e74c3c';
        }
    });

    // Checkbox validation
    const documentCheckboxes = document.querySelectorAll('input[name="documents"]');
    documentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCount = document.querySelectorAll('input[name="documents"]:checked').length;
            if (checkedCount > 0) {
                // Remove any error styling
                document.querySelectorAll('.checkbox-item').forEach(item => {
                    item.style.borderColor = '#e1e8ed';
                });
            }
        });
    });

    // Smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add some visual feedback for form interactions
    const formInputs = document.querySelectorAll('.form-input, .form-textarea');
    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});

// Utility function to format German dates
function formatGermanDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export functions for potential external use
window.InsuranceForm = {
    formatGermanDate,
    generateEmailContent: function(formData) {
        const selectedDocuments = Array.from(document.querySelectorAll('input[name="documents"]:checked'))
            .map(cb => `• ${cb.value}`)
            .join('\n');

        const subject = `Versicherungsunterlagen anfordern - ${formData.insuranceCompany}`;
        
        const body = `Sehr geehrte Damen und Herren,

hiermit fordere ich gemäß Art. 15 DSGVO folgende Unterlagen zu meiner Versicherung an:

Versicherungsgesellschaft: ${formData.insuranceCompany}
Versicherungsschein-Nummer: ${formData.policyNumber}

Gewünschte Unterlagen:
${selectedDocuments}

Bitte senden Sie mir die angeforderten Unterlagen bis zum ${formatGermanDate(formData.deadline)} zu.

Mit freundlichen Grüßen
${formData.name}

---
Adresse:
${formData.address}`;

        return { subject, body };
    }
};
