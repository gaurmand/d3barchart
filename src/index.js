var {
  HorizontalBarChart,
  VerticalBarChart
} = require('./bar_chart')

function getRandomBit(prob = 0.5) {
  return Math.random() > (1 - prob);
}

function getRandomInteger(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

const MAX_DATUM = 1000;

function getRandomData(arr) {
  let data = [];
  let MAX_ENTRIES = 20;

  for (let i = 0; i < arr.length; i++) {
    if (data.length >= MAX_ENTRIES)
      break;

    if (getRandomBit(0.052)) {
      let datum = [arr[i], getRandomInteger(MAX_DATUM)];
      data.push(datum);
    }
  }

  if (data.length < 2)
    return getRandomData(arr);

  return data;
}

function getRandomTitle(arr) {
  let noun = arr[getRandomInteger(arr.length)]
  return `Number of ${noun[1]} per capita`;
}

// function getRandomData(arr) {
//   return [['Albania', 100],['Canada', 300], ['Ethiopia', 400]];
// }

function updateDataValues(data) {
  let newData = [];
  data.forEach(datum => {
    let newDatum = [];
    if (getRandomBit(0.75))
      newDatum = [datum[0], getRandomInteger(MAX_DATUM)];
    else
      newDatum = datum;
    newData.push(newDatum);
  });
  return newData;
}

function getElemNotInArray(arr, src) {
  let randElem = src[getRandomInteger(src.length - 1)];
  while (arr.some(elem => elem[0] == randElem))
    randElem = src[getRandomInteger(src.length - 1)];
  return randElem;
}

function updateData(data, src) {
  let newData = [];

  for (let i = 0; i < data.length; i++) {
    let newDatum = [];
    let datum = data[i];

    if (getRandomBit(0.3))
      newDatum = [datum[0], getRandomInteger(MAX_DATUM)];
    else if (getRandomBit(0.143))
      continue;
    else if (getRandomBit(0.167)) {
      newData.push([getElemNotInArray(data, src), getRandomInteger(MAX_DATUM)]);
      newDatum = datum;
    } else
      newDatum = datum;
    newData.push(newDatum);
  }

  if (newData.length < 2)
    return updateData(data, src);

  return newData;
}

// function updateData(data, src) {
//   return [['Albania', 100],['Canada', 300], ['Benin', 600]];
// }

const countries = require('../data/countries.json');
const nouns = require('../data/nouns.json');
let charts = [];

function appendRandomBarChart(Chart) {
  let chart = new Chart(
    getRandomData(countries),
    'Number of cats per capita', {
      margin: {
        left: 120,
        bottom: 120
      }
    });
  document.body.appendChild(chart.node());
  charts.push(chart);
}

const NUM_CHARTS = 1;
for (let i = 0; i < NUM_CHARTS; i++)
  appendRandomBarChart(HorizontalBarChart);

for (let i = 0; i < NUM_CHARTS; i++)
  appendRandomBarChart(VerticalBarChart);

charts.forEach((chart, i) => {
  chart.node().onmousedown = e => {
    let data, title, color;
    if (e.ctrlKey && !e.altKey)
      data = updateDataValues(chart.getData());
    else if (!e.ctrlKey && e.altKey)
      data = updateData(chart.getData(), countries);
    else if (!e.ctrlKey && !e.altKey) {
      data = getRandomData(countries);
      color = HorizontalBarChart.getRandomColor();
      title = getRandomTitle(nouns);
    }

    chart.update({
      data,
      color,
      title
    });

  };
});