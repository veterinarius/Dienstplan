// Mitarbeiter-bezogene Funktionen         
export function addEmployee() {
    const input = document.getElementById('employeeName');
    const name = input.value.trim();
    if (name) {
        employees.push(name);
        // Initialisiere Präferenzen für neuen Mitarbeiter (nur wenn tatsächlich gesetzt)
        preferences[name] = {};
        input.value = '';
        updateEmployeeList();
        displaySchedule();
        saveDataToLocalStorage();
    }
}

export function removeEmployee(employeeName) {
    employees = employees.filter(emp => emp !== employeeName);
    delete preferences[employeeName]; // Lösche auch Präferenzen
    updateEmployeeList();
    displaySchedule();
    saveDataToLocalStorage();
}