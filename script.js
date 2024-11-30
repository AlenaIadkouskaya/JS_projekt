
document.addEventListener("DOMContentLoaded", () => {
    fetchRates();
    const toggleTableBtn = document.getElementById("toggleTableBtn");
    const historicalRatesTable = document.getElementById("historicalRatesTable");

    if (toggleTableBtn) {
        toggleTableBtn.addEventListener("click", () => {
            
            const displayStyle = window.getComputedStyle(historicalRatesTable).display;
            if (displayStyle === "none") {
                historicalRatesTable.style.display = "table";  
                toggleTableBtn.textContent = "Ukryj wszystkie kursy";  
            } else {
                historicalRatesTable.style.display = "none";  
                toggleTableBtn.textContent = "Pokaż wszystkie kursy";  
            }
        });
    }

    const compareBtn = document.getElementById("compareBtn");
    let historicalRates = [];
    if (compareBtn) {
        compareBtn.addEventListener("click", async () => {

            const startDateInput = document.getElementById("startDate");
            const endDateInput = document.getElementById("endDate");
            const currencySelect = document.getElementById("currency");

            const selectedCurrency = currencySelect.value.split(' - ')[0];
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;


            if (!selectedCurrency || !startDate || !endDate) {
                alert("Please select currency and date range.");
                return;
            }

            try {
                const url = `https://api.nbp.pl/api/exchangerates/rates/A/${selectedCurrency}/${startDate}/${endDate}?format=json`;

                const response = await fetch(url);
                const data = await response.json();

                historicalRates = data.rates;
                displayHistoricalData(historicalRates, selectedCurrency);
            } catch (error) {
                console.error("Error fetching historical data:", error);
            }
        });
    }
    // document.getElementById('rateChart').style.display = 'block';

    const convertBtn = document.getElementById("convertBtn");
    if (convertBtn) {
        convertBtn.addEventListener("click", () => {
            const amount = parseFloat(document.getElementById("amount").value);
            const fromCurrency = document.getElementById("from").value.split(' - ')[0];
            const toCurrency = document.getElementById("to").value.split(' - ')[0];

            if (isNaN(amount) || amount <= 0) {
                alert("Proszę wprowadzić poprawną kwotę.");
                return;
            }

            if (!fromCurrency || !toCurrency) {
                alert("Proszę wybrać walutę źródłową i docelową.");
                return;
            }


            const fromRate = rates.find(rate => rate.code === fromCurrency);
            const toRate = rates.find(rate => rate.code === toCurrency);

            if (!fromRate || !toRate) {
                alert("Nie udało się znaleźć kursów dla wybranych walut.");
                return;
            }


            const convertedAmount = (amount / toRate.mid) * fromRate.mid;
            document.getElementById("result").textContent = `Wynik: ${convertedAmount.toFixed(2)} ${toCurrency}`;
        });
    }
});

let rates = [];

async function fetchRates() {
    try {
        const sources = [
            fetch("https://api.nbp.pl/api/exchangerates/tables/A/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/B/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/C/?format=json")
        ];

        const responses = await Promise.all(sources);
        const data = await Promise.all(responses.map(res => res.json()));

        let allRates = [];
        data.forEach(table => allRates = [...allRates, ...table[0].rates]);
        allRates.push({ code: "PLN", currency: "Złoty", mid: 1 });

        if (document.getElementById("ratesTable")) fillRatesTable(allRates);
        if (document.getElementById("from")) fillCurrencySelects(allRates);
        if (document.getElementById("currency")) fillCurrencySelect(allRates);

        rates = allRates;
    } catch (error) {
        console.error("Błąd podczas ładowania kursów:", error);
    }
}

function fillRatesTable(rates) {
    const tbody = document.querySelector("#ratesTable tbody");
    rates.forEach(rate => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${rate.code} - ${rate.currency}</td><td>${rate.mid.toFixed(2)}</td>`;
        tbody.appendChild(row);
    });
}

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

function fillCurrencySelect(rates) {
    const currencySelect = document.getElementById("currency");
    rates.forEach(rate => {
        const option = document.createElement("option");
        option.value = rate.code;
        option.textContent = `${rate.code} - ${rate.currency}`;
        currencySelect.appendChild(option);
    });
};

function displayHistoricalData(historicalRates, selectedCurrency) {
    if (historicalRates.length === 0) {
        alert("No data found for the selected period.");
        return;
    }

    console.log('Historical Rates:', historicalRates);

    const tableBody = document.querySelector("#historicalRatesTable tbody");
    tableBody.innerHTML = '';

    historicalRates.forEach(rate => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${rate.effectiveDate}</td><td>${rate.mid.toFixed(2)}</td>`;
        tableBody.appendChild(row);
    });

    const labels = historicalRates.map(rate => rate.effectiveDate);
    const data = historicalRates.map(rate => rate.mid);

    console.log('Labels:', labels);
    console.log('Data:', data);

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
