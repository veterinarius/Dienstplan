// Dienstplan-bezogene Funktionen// --- Dienstplan generieren (dynamisch) ---
        export function generateSchedule() {
            if (!startDate || !endDate) {
                showCustomAlert('Bitte wählen Sie Start- und Enddatum aus.');
                return;
            }
            if (employees.length === 0) {
                showCustomAlert('Bitte fügen Sie mindestens einen Mitarbeiter hinzu.');
                return;
            }
            // Mitarbeiter sortieren: Alle mit 'Dr.' zuerst
            const sortedEmployees = [...employees].sort((a, b) => {
                const aDr = a.toLowerCase().includes('dr.');
                const bDr = b.toLowerCase().includes('dr.');
                if (aDr && !bDr) return -1;
                if (!aDr && bDr) return 1;
                return 0;
            });
            const generatedSchedule = {};
            shiftNames.forEach((shift, sIdx) => {
                generatedSchedule[shift] = [];
                for (let row = 0; row < (rowCounts[sIdx] || 7); row++) {
                    const weekSchedule = [];
                    dayNames.forEach(() => weekSchedule.push(''));
                    generatedSchedule[shift].push(weekSchedule);
                }
            });
            sortedEmployees.forEach(employee => {
                const employeePrefs = preferences[employee] || {};
                const shiftPreferences = {};
                shiftNames.forEach(shift => shiftPreferences[shift] = []);
                Object.keys(employeePrefs).forEach(day => {
                    const dayPrefs = employeePrefs[day] || [];
                    dayPrefs.forEach(shift => {
                        if (shiftPreferences[shift]) {
                            shiftPreferences[shift].push(day);
                        }
                    });
                });
                Object.keys(shiftPreferences).forEach(shift => {
                    const preferredDays = shiftPreferences[shift];
                    if (preferredDays.length > 0) {
                        preferredDays.forEach(day => {
                            const dayIndex = dayNames.indexOf(day);
                            if (dayIndex !== -1) {
                                for (let i = 0; i < generatedSchedule[shift].length; i++) {
                                    if (!generatedSchedule[shift][i][dayIndex]) {
                                        generatedSchedule[shift][i][dayIndex] = employee;
                                        break;
                                    }
                                }
                            }
                        });
                    }
                });
            });
            displayGeneratedScheduleUniversal(generatedSchedule);
            schedule = generatedSchedule;
            saveDataToLocalStorage();
            // Event-Listener für Farbauswahl nach dem Generieren hinzufügen
            setTimeout(() => {
                addCellColorListeners();
                applyCellColors();
            }, 100);
            showCustomAlert('Dienstplan wurde erfolgreich generiert!');
        }
        // Dienstplan anzeigen
        export function displaySchedule() {
            const container = document.getElementById('schedule-container');
            container.innerHTML = '';
            shiftNames.forEach((shift, sIdx) => {
                const shiftTitle = document.createElement('div');
                shiftTitle.className = 'table-title';
                shiftTitle.textContent = shift;
                container.appendChild(shiftTitle);
                const table = document.createElement('table');
                let tableHTML = `
                    <thead>
                        <tr>
                            <th>lfd. Nr. / Zeit</th>
                            ${dayNames.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody id="shiftBody_${sIdx}">
                        ${Array(rowCounts[sIdx] || 7).fill('').map((_, index) => `
                            <tr>
                                <td class="row-number" contenteditable="true">${index + 1}</td>
                                ${dayNames.map(() => `<td contenteditable="true" style="white-space: pre-wrap; word-wrap: break-word;"></td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                table.innerHTML = tableHTML;
                container.appendChild(table);
            });
            // Event-Listener für Farbauswahl nach dem Anzeigen hinzufügen
            setTimeout(() => {
                addCellColorListeners();
                applyCellColors();
            }, 100);
        }