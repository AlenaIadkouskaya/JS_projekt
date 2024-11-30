document.addEventListener("DOMContentLoaded", () => {
    // po załadowaniu strony pobieramy kursy z API
    fetchRates();

    // elementy przycisków i tabeli
    const toggleTableBtn = document.getElementById("toggleTableBtn");
    const historicalRatesTable = document.getElementById("historicalRatesTable");

    // przycisk pokaż/ukryj historję kursów
    if (toggleTableBtn) {
        toggleTableBtn.addEventListener("click", () => {
            const displayStyle = window.getComputedStyle(historicalRatesTable).display;

            // jeżeli tabela jest niewidoczna - pokazujemy, jeżeli widoczna - odwrotnie
            if (displayStyle === "none") {
                historicalRatesTable.style.display = "table";
                toggleTableBtn.textContent = "Ukryj wszystkie kursy";
            } else {
                historicalRatesTable.style.display = "none";
                toggleTableBtn.textContent = "Pokaż wszystkie kursy";
            }
        });
    }

    // przycisk Porównaj w historji
    const compareBtn = document.getElementById("compareBtn");
    let historicalRates = [];
    if (compareBtn) {
        compareBtn.addEventListener("click", async () => {
            // elementy strony
            const startDateInput = document.getElementById("startDate");
            const endDateInput = document.getElementById("endDate");
            const currencySelect = document.getElementById("currency");

            const selectedCurrency = currencySelect.value.split(' - ')[0];
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;

            // sprawdzanie czy wszystko wprowadzone
            if (!selectedCurrency || !startDate || !endDate) {
                alert("Please select currency and date range.");
                return;
            }

            try {
                // URL do zapytania z API
                const url = `https://api.nbp.pl/api/exchangerates/rates/A/${selectedCurrency}/${startDate}/${endDate}?format=json`;

                // zapytanie do API
                const response = await fetch(url);
                const data = await response.json();

                // otrzymane dane historyczne zapisujemy do listy
                historicalRates = data.rates;
                // metoda pokazywania na stronie
                displayHistoricalData(historicalRates, selectedCurrency);
            } catch (error) {
                console.error("Error fetching historical data:", error);
            }
        });
    }

    // przycisk Przelicz na stronie konwertowania
    const convertBtn = document.getElementById("convertBtn");
    if (convertBtn) {
        convertBtn.addEventListener("click", () => {
            // pobieramy elementy
            const amount = parseFloat(document.getElementById("amount").value);
            const fromCurrency = document.getElementById("from").value.split(' - ')[0];
            const toCurrency = document.getElementById("to").value.split(' - ')[0];

            // sprawdzamy 
            if (isNaN(amount) || amount <= 0) {
                alert("Proszę wprowadzić poprawną kwotę.");
                return;
            }

            if (!fromCurrency || !toCurrency) {
                alert("Proszę wybrać walutę źródłową i docelową.");
                return;
            }

            // szukamy kursów dla wybranych walut
            const fromRate = rates.find(rate => rate.code === fromCurrency);
            const toRate = rates.find(rate => rate.code === toCurrency);

            // jeżeli kursy nie zostały znalezione
            if (!fromRate || !toRate) {
                alert("Nie udało się znaleźć kursów dla wybranych walut.");
                return;
            }

            // przeliczamy z jednej waluty na drugą
            const convertedAmount = (amount / toRate.mid) * fromRate.mid;
            // wynik
            document.getElementById("result").textContent = `Wynik: ${convertedAmount.toFixed(2)} ${toCurrency}`;
        });
    }
});

// zmienna przechowująca kursy
let rates = [];

// funkcja pobierająca kursy walutowe z API
async function fetchRates() {
    try {
        // wysyłamy zapytania
        const sources = [
            fetch("https://api.nbp.pl/api/exchangerates/tables/A/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/B/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/C/?format=json")
        ];

        // czekamy na odpowiedzi z serwera
        const responses = await Promise.all(sources);
        const data = await Promise.all(responses.map(res => res.json()));

        let allRates = [];
        // łączymy wszystkie kursy w jedną tablicę
        data.forEach(table => allRates = [...allRates, ...table[0].rates]);
        // dodajemy PLN (złoty) do kursów
        allRates.push({ code: "PLN", currency: "Złoty", mid: 1 });

        // uzupełniamy tabelę kursów z listy
        if (document.getElementById("ratesTable")) fillRatesTable(allRates);
        // uzupełniamy listy wyboru walut
        if (document.getElementById("from")) fillCurrencySelects(allRates);
        if (document.getElementById("currency")) fillCurrencySelect(allRates);

        rates = allRates;
    } catch (error) {
        console.error("Błąd podczas ładowania kursów:", error);
    }
}

// funkcja do uzupełnienia kursów walutowych z listy
function fillRatesTable(rates) {
    const tbody = document.querySelector("#ratesTable tbody");


    rates.forEach(rate => {
        const row = document.createElement("tr");
        const midValue = typeof rate.mid === "number" ? rate.mid.toFixed(2) : "N/A";
        row.innerHTML = `<td>${rate.code} - ${rate.currency}</td><td>${midValue}</td>`;
        tbody.appendChild(row);
    });
}

// funkcja do uzupełnienia selectów dla "from" i "to"
function fillCurrencySelects(rates) {
    const fromSelect = document.getElementById("from");
    const toSelect = document.getElementById("to");

    rates.forEach(rate => {
        const option = document.createElement("option");
        option.value = `${rate.code} - ${rate.currency}`;
        option.textContent = `${rate.code} - ${rate.currency}`;
        fromSelect.appendChild(option);
        toSelect.appendChild(option.cloneNode(true));
    });
}

// funkcja do uzupełnienia selectu dla wyboru waluty (currency) w historji
function fillCurrencySelect(rates) {
    const currencySelect = document.getElementById("currency");
    rates.forEach(rate => {
        const option = document.createElement("option");
        option.value = rate.code;
        option.textContent = `${rate.code} - ${rate.currency}`;
        currencySelect.appendChild(option);
    });
};

// funkcja do wyświetlania danych historycznych (kursów walutowych)
function displayHistoricalData(historicalRates, selectedCurrency) {
    // sprawdzamy
    if (historicalRates.length === 0) {
        alert("No data found for the selected period.");
        return;
    }
    // wyliczamy min & max
    let minRate = Math.min(...historicalRates.map(rate => rate.mid)); 
    let maxRate = Math.max(...historicalRates.map(rate => rate.mid)); 

    const tableBody = document.querySelector("#historicalRatesTable tbody");
    tableBody.innerHTML = ''; // czyścimy tabele na formie

    historicalRates.forEach(rate => {
        const row = document.createElement("tr");

        // format 2 znaki po przecinku
        const midValue = typeof rate.mid === "number" ? rate.mid.toFixed(2) : "N/A";

        // wyliczamy min/max
        const midClass = (rate.mid === minRate) ? 'min-rate' : (rate.mid === maxRate) ? 'max-rate' : '';

        // budujemy linijke do tabeli
        row.innerHTML = `<td>${rate.effectiveDate}</td><td class="${midClass}">${midValue}</td>`;

        tableBody.appendChild(row);
    });

    // dane do wykresu
    const labels = historicalRates.map(rate => rate.effectiveDate);
    const data = historicalRates.map(rate => rate.mid);

    // tworzymy wykres 
    const chart = new Chart(document.getElementById("rateChart"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Exchange Rate of ${selectedCurrency}`,
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Rate'
                    }
                }
            }
        }
    });
}
