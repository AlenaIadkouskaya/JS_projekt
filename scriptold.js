const ratesTable = document.querySelector("#ratesTable tbody");
const fromSelect = document.getElementById("from");
const toSelect = document.getElementById("to");
const result = document.getElementById("result");
const amountInput = document.getElementById("amount");
const currencySelect = document.getElementById("currency");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const compareBtn = document.getElementById("compareBtn");
const rateChartCanvas = document.getElementById("rateChart");

let rates = [];
let allRates = [];

async function fetchRates() {
    try {

        const sources = [
            fetch("https://api.nbp.pl/api/exchangerates/tables/A/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/B/?format=json"),
            fetch("https://api.nbp.pl/api/exchangerates/tables/C/?format=json")
        ];

        const responses = await Promise.all(sources);
        const data = await Promise.all(responses.map(res => res.json()));

        allRates = [];
        data.forEach(table => {
            allRates = [...allRates, ...table[0].rates];
        });


        allRates.push({
            code: 'PLN',
            currency: 'złoty',
            mid: 1
        });


        const uniqueRates = [];
        const seenCodes = new Set();
        allRates.forEach(rate => {
            if (rate.code && rate.currency && rate.mid && !seenCodes.has(rate.code)) {
                uniqueRates.push(rate);
                seenCodes.add(rate.code);
            }
        });


        uniqueRates.sort((a, b) => a.code.localeCompare(b.code));


        ratesTable.innerHTML = '';
        uniqueRates.forEach(rate => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${rate.code} - ${rate.currency}</td><td>${rate.mid.toFixed(2)}</td>`;
            ratesTable.appendChild(row);
        });

        rates = uniqueRates;


        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        uniqueRates.forEach(rate => {
            const option = document.createElement("option");
            option.value = `${rate.code} - ${rate.currency}`;
            option.textContent = `${rate.code} - ${rate.currency}`;
            fromSelect.appendChild(option);
            toSelect.appendChild(option.cloneNode(true));
        });
        fromSelect.innerHTML = '';
        toSelect.innerHTML = '';
        uniqueRates.forEach(rate => {
            const option = document.createElement("option");
            option.value = `${rate.code} - ${rate.currency}`;
            option.textContent = `${rate.code} - ${rate.currency}`;
            fromSelect.appendChild(option);
            toSelect.appendChild(option.cloneNode(true));
            currencySelect.appendChild(option.cloneNode(true));
        });

    } catch (error) {
        console.error("Błąd podczas ładowania danych:", error);
    }
}
compareBtn.addEventListener("click", async () => {
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
        displayHistoricalData();
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
});

function displayHistoricalData() {
    if (historicalRates.length === 0) {
        alert("No data found for the selected period.");
        return;
    }
    console.log('Historical Rates:', historicalRates);
    const tableBody = document.createElement("tbody");
    historicalRates.forEach(rate => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${rate.effectiveDate}</td><td>${rate.mid.toFixed(2)}</td>`;
        tableBody.appendChild(row);
    });
    ratesTable.appendChild(tableBody);

    const labels = historicalRates.map(rate => rate.effectiveDate);
    const data = historicalRates.map(rate => rate.mid);
    console.log('Labels:', labels);
    console.log('Data:', data);
    const chart = new Chart(rateChartCanvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Exchange Rate of ${currencySelect.value.split(' - ')[1]}`,
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
fetchRates();