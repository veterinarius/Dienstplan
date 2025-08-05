const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  win.loadFile('dienstplan.html');
  // Optional: Open DevTools
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const employeeNameInput = document.getElementById('employee-name');
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    const employeeList = document.querySelector('.employee-list');

    let employees = [];

    function renderEmployees() {
        employeeList.innerHTML = '';
        employees.forEach((employee, index) => {
            const employeeTag = document.createElement('div');
            employeeTag.classList.add('employee-tag');
            employeeTag.setAttribute('draggable', 'true');
            employeeTag.dataset.id = index;
            
            const employeeNameSpan = document.createElement('span');
            employeeNameSpan.textContent = employee;
            
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent other events
                removeEmployee(index);
            });

            employeeTag.appendChild(employeeNameSpan);
            employeeTag.appendChild(removeBtn);
            employeeList.appendChild(employeeTag);
        });
    }

    function addEmployee() {
        const name = employeeNameInput.value.trim();
        if (name) {
            if (!employees.includes(name)) {
                employees.push(name);
                employeeNameInput.value = '';
                renderEmployees();
                generateSchedule(); // Update schedule when employee is added
            } else {
                alert('Dieser Mitarbeiter existiert bereits.');
            }
        }
    }

    function removeEmployee(index) {
        employees.splice(index, 1);
        renderEmployees();
        generateSchedule(); // Update schedule when employee is removed
    }

    addEmployeeBtn.addEventListener('click', addEmployee);
    employeeNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addEmployee();
        }
    });

    // --- Schedule Generation ---
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const scheduleHead = document.getElementById('schedule-head');
    const scheduleBody = document.getElementById('schedule-body');
    const dateInfo = document.querySelector('.date-info span');

    function generateSchedule() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        if (!startDateInput.value || !endDateInput.value || startDate > endDate) {
            scheduleHead.innerHTML = '';
            scheduleBody.innerHTML = '';
            dateInfo.textContent = 'Bitte gültigen Zeitraum wählen.';
            return;
        }

        // --- Render Header ---
        scheduleHead.innerHTML = '';
        let headerRow = '<tr><th>Mitarbeiter</th>';
        let currentDate = new Date(startDate);
        const dates = [];

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            const day = String(currentDate.getDate()).padStart(2, '0');
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            headerRow += `<th>${day}.${month}</th>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        headerRow += '</tr>';
        scheduleHead.innerHTML = headerRow;

        // --- Render Body ---
        scheduleBody.innerHTML = '';
        employees.forEach(employee => {
            let bodyRow = `<tr class="employee-row" data-employee="${employee}"><td>${employee}</td>`;
            dates.forEach(() => {
                bodyRow += '<td contenteditable="true"></td>';
            });
            bodyRow += '</tr>';
            scheduleBody.innerHTML += bodyRow;
        });

        // Update Date Info
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24) + 1;
        dateInfo.textContent = `${dayDiff} Tage ausgewählt`;
    }

    startDateInput.addEventListener('change', generateSchedule);
    endDateInput.addEventListener('change', generateSchedule);

    // --- Initial Call ---
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    startDateInput.valueAsDate = firstDayOfMonth;
    endDateInput.valueAsDate = lastDayOfMonth;
    
    renderEmployees();
    generateSchedule();

    // Mitarbeiter-Datenstruktur
    let mitarbeiter = [];

    // Local Storage laden
    function ladeMitarbeiter() {
      const data = localStorage.getItem('mitarbeiter');
      if (data) {
        try {
          mitarbeiter = JSON.parse(data);
        } catch (e) {
          mitarbeiter = [];
        }
      }
    }

    // Local Storage speichern
    function speichereMitarbeiter() {
      localStorage.setItem('mitarbeiter', JSON.stringify(mitarbeiter));
    }

    // Hilfsfunktion: Kommagetrennte Zahlen in Array umwandeln
    function parseTage(str) {
      return str.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    }

    // Mitarbeiterliste im DOM aktualisieren
    function renderMitarbeiterListe() {
      const liste = document.getElementById('mitarbeiterListe');
      if (mitarbeiter.length === 0) {
        liste.innerHTML = '<em>Noch keine Mitarbeiter hinzugefügt.</em>';
        return;
      }
      liste.innerHTML = '<ul>' + mitarbeiter.map((m, idx) => `
        <li>
          <strong>${m.name}</strong> | Schichten: ${m.schichten.join(', ')} | Wunsch-Tage: ${m.wunschTage.join(', ') || '-'} | Frei-Tage: ${m.freiTage.join(', ') || '-'}
          <button onclick="removeMitarbeiter(${idx})">Entfernen</button>
        </li>
      `).join('') + '</ul>';
    }

    // Mitarbeiter entfernen
    function removeMitarbeiter(idx) {
      mitarbeiter.splice(idx, 1);
      speichereMitarbeiter();
      renderMitarbeiterListe();
    }

    // Event Listener für das Formular
    const form = document.getElementById('mitarbeiterForm');
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const schichtSelect = document.getElementById('schicht');
      const schichten = Array.from(schichtSelect.selectedOptions).map(opt => opt.value);
      const wunschTage = parseTage(document.getElementById('wunschTage').value);
      const freiTage = parseTage(document.getElementById('freiTage').value);

      if (!name || schichten.length === 0) {
        alert('Bitte Name und mindestens eine Schicht angeben.');
        return;
      }

      mitarbeiter.push({ name, schichten, wunschTage, freiTage });
      speichereMitarbeiter();
      renderMitarbeiterListe();
      form.reset();
    });

    // Initiales Laden und Rendering
    ladeMitarbeiter();
    renderMitarbeiterListe();

// Standardschichten
const standardschichten = ["Früh", "Spät", "Nacht"];

// Hilfsfunktion: Anzahl Tage im Monat
function tageImMonat(monat, jahr) {
  return new Date(jahr, monat, 0).getDate();
}

// Dienstplan-Tabelle generieren
function generiereDienstplanTabelle() {
  const monat = parseInt(document.getElementById('monat').value, 10);
  const jahr = parseInt(document.getElementById('jahr').value, 10);
  const tage = tageImMonat(monat, jahr);
  const tabelle = document.getElementById('dienstplanTabelle');

  // Kopfzeile
  let thead = '<thead><tr><th class="schicht-label">Schicht</th>';
  for (let tag = 1; tag <= tage; tag++) {
    thead += `<th>${tag}</th>`;
  }
  thead += '</tr></thead>';

  // Zeilen für Schichten
  let tbody = '<tbody>';
  standardschichten.forEach(schicht => {
    tbody += `<tr><td class="schicht-label">${schicht}</td>`;
    for (let tag = 1; tag <= tage; tag++) {
      tbody += '<td></td>';
    }
    tbody += '</tr>';
  });
  tbody += '</tbody>';

  tabelle.innerHTML = thead + tbody;
}

// Event Listener für Button
const planBtn = document.getElementById('planErstellen');
if (planBtn) {
  planBtn.addEventListener('click', generiereDienstplanTabelle);
}

// Initial: Tabelle leeren
const tabelle = document.getElementById('dienstplanTabelle');
tabelle.innerHTML = '';
});