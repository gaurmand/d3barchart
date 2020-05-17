var d3 = require("d3");

class BarChart {

  constructor(data, title = '', opts = {}) {
    if (!BarChart.isValidBarChartData(data))
      throw 'Invalid bar chart data';

    //initialize chart properties
    this.data = data;
    this.title = title;
    this.color = opts.color || BarChart.getRandomColor();
    this.width = opts.width;
    this.height = opts.height;

    this.margin = opts.margin || {};

    //initialize chart elements
    this.container = d3.create('div')
      .classed('chart_holder', true)

    this.svg = this.container.append("svg");

    this.svg.append('g')
      .classed('bars', true)
      .attr("fill", this.color)
    this.svg.append("g")
      .classed('xAxis', true);
    this.svg.append("g")
      .classed('yAxis', true);

    //draw chart
    this.drawChart(this.data, this.title);
  }

  update({data, color, title}) {
    console.log('Updating chart');
    if (data) {
      if (!BarChart.isValidBarChartData(data))
        throw 'Invalid bar chart data';

      this.data = data;
    }
      
    if(color) {
      this.color = color;
      this.svg.select("g.bars").transition()
        .duration(BarChart.TRANSITION_DURATION)
        .attr("fill", this.color)
    }

    if (title)
      this.title = title;

    this.drawChart(this.data, this.title);
  }

  computeViewBox(chart, chartWidth, chartHeight) {
    let svg = BarChart.getBBox(chart.node());

    //calculate viewbox 
    let ml = this.margin.left || (-svg.x);
    let mr = this.margin.right || (svg.width + svg.x - chartWidth);
    let mt = this.margin.top || (-svg.y);
    let mb = this.margin.bottom || (svg.height + svg.y - chartHeight);

    let x = -ml;
    let y = -mt;
    let width = ml + chartWidth + mr;
    let height = mt + chartHeight + mb;

    return {x, y, width, height};
  }

  setViewBox(viewBox) {
    let svg = this.svg;
    let container = this.container;

    if(svg.attr('viewBox')) {
      svg = svg.transition().duration(BarChart.TRANSITION_DURATION)
      container = container.transition().duration(BarChart.TRANSITION_DURATION)
    }

    svg.attr("viewBox", `${viewBox.x},${viewBox.y},${viewBox.width},${viewBox.height}`);
    container.style('width', viewBox.width+'px')
      .style('height', viewBox.height+'px');

  }

  node() {
    return this.container.node();
  }

  getData() {
    return this.data;
  }

  static getDim(node) {
    //get x and y axes dimensions: create temp svg and append to DOM to get bounding rectangles
    let tempsvg = d3.create('svg').node();
    tempsvg.appendChild(node);

    tempsvg.setAttribute('visibility', 'hidden'); //set visibility so that the element takes up space but is invisible to user
    document.body.appendChild(tempsvg);

    let res = node.getBoundingClientRect()

    tempsvg.remove();
    tempsvg.setAttribute('visibility', 'visible');

    return res;
  }

  static getBBox(node) {
    node.setAttribute('visibility', 'hidden'); //set visibility so that the element takes up sapce but is invisible to user
    document.body.appendChild(node);

    let res = node.getBBox();

    node.remove();
    node.setAttribute('visibility', 'visible');

    return res;
  }

  static computeBandScaleRange(numSteps, bandwidth, padding) {
    return 2*padding + numSteps*bandwidth/(1-padding);
  }

  static isValidBarChartData(data) {
    if (!Array.isArray(data) || data.length < 1)
      return false;

    for (let i = 0; i < data.length; i++) {
      let datum = data[i];
      if (!Array.isArray(datum) || datum.length < 2 || isNaN(datum[1]))
        return false
    }
    return true;
  }

  static getRandomColor() {
    return d3.interpolateRainbow(Math.random());
  }
};

class HorizontalBarChart extends BarChart {

  createXScale(xdomain, xrange) {

    return d3.scaleLinear()
      .domain(xdomain)
      .range(xrange)
      .interpolate(d3.interpolateRound);

    // console.log(`x domain: [${xdomain}]`);
    // console.log(`x range: [${xrange}]`);
    // console.log(`x scaled: [${xScale(xdomain[0])},${xScale(xdomain[1])}]`);
  }

  createYScale(ydomain, yrange) {

    return d3.scaleBand()
      .domain(ydomain)
      .range(yrange)
      .padding(HorizontalBarChart.DEFAULT_PADDING)

    // console.log(`y domain: [${ydomain}]`);
    // console.log(`y range: [${yrange}]`);
    // console.log(`y scaled: [${yScale(ydomain[0])},${yScale(ydomain[ydomain.length-1])}]`);
  }

  drawChart(data, title) {
    data.sort((a,b) => a<b?-1:1)
    //set chart dimensions
    let chartWidth = this.width || HorizontalBarChart.DEFAULT_WIDTH;
    let chartHeight = this.height || HorizontalBarChart.computeBandScaleRange(data.length, HorizontalBarChart.DEFAULT_BANDWIDTH, HorizontalBarChart.DEFAULT_PADDING);

    //initialize x scale
    let xdomain = [0, d3.max(data, d => d[1])];
    let xrange = [0, chartWidth];
    let xScale = this.createXScale(xdomain, xrange);

    //initialize y scale
    let ydomain = data.map(d => d[0]);
    let yrange = [0, chartHeight];
    let yScale = this.createYScale(ydomain, yrange);

    //draw bars
    this.svg.select("g.bars")
      .selectAll("rect")
      .data(data, d=>d[0])
      .join(
        enter => enter
          .call(enter => {
            console.log('ENTER:')
            console.log(enter.nodes())
          })
          .append('rect')
            .attr("x", 0)
            .attr("y", d => yScale(d[0]))
            .attr("height", yScale.bandwidth())
            .attr("width", 0),
        update => update
          .call(update => {
            console.log('UPDATE:')
            console.log(update.nodes())
          }),
        exit => exit
          .call(exit => {
            console.log('EXIT:')
            console.log(exit.nodes())
          })
          .transition()
            .duration(HorizontalBarChart.TRANSITION_DURATION)
            .attr("width", 0)
            .remove()
      )
      .transition()
        .duration(HorizontalBarChart.TRANSITION_DURATION)
        .attr("y", d => yScale(d[0]))
        .attr("width", d => xScale(d[1]))
      
    //draw axes
    this.svg.select('g.xAxis')
      .transition()
      .duration(HorizontalBarChart.TRANSITION_DURATION)
      .call(d3.axisTop(xScale));

    this.svg.select('g.yAxis')
      .transition()
      .duration(HorizontalBarChart.TRANSITION_DURATION)
      .call(d3.axisLeft(yScale));
          
    //set viewbox
    let chart = this.getChart(data, xScale, yScale);
    let viewBox = this.computeViewBox(chart, chartWidth, chartHeight);
    this.setViewBox(viewBox);
  }

  //without transitions -> for internal use
  getChart(data, xScale, yScale) {
    let svg = d3.create('svg')

    svg.append("g")
      .selectAll("rect")
      .data(data, d=>d[0])
      .join('rect')
        .attr("x", 0)
        .attr("y", d => yScale(d[0]))
        .attr("height", yScale.bandwidth())
        .attr("width", d => xScale(d[1]));

    svg.append('g')
      .call(d3.axisTop(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale));

    return svg;
  }

};

class VerticalBarChart extends BarChart {

  createXScale(xdomain, xrange) {
    return d3.scaleBand()
      .domain(xdomain)
      .range(xrange)
      .padding(VerticalBarChart.DEFAULT_PADDING)

    // console.log(`x domain: [${xdomain}]`);
    // console.log(`x range: [${xrange}]`);
    // console.log(`x scaled: [${xScale(xdomain[0])},${xScale(xdomain[1])}]`);
  }

  createYScale(ydomain, yrange) {
    return d3.scaleLinear()
      .domain(ydomain)
      .range(yrange);

    // console.log(`y domain: [${ydomain}]`);
    // console.log(`y range: [${yrange}]`);
    // console.log(`y scaled: [${yScale(ydomain[0])},${yScale(ydomain[ydomain.length-1])}]`);
  }

  drawChart(data, title) {
    //set chart dimensions
    let chartWidth = this.width || VerticalBarChart.computeBandScaleRange(data.length, VerticalBarChart.DEFAULT_BANDWIDTH, VerticalBarChart.DEFAULT_PADDING);
    let chartHeight = this.height || VerticalBarChart.DEFAULT_HEIGHT

    //initialize x scale
    let xdomain = data.map(d => d[0]);
    let xrange = [0, chartWidth];
    let xScale = this.createXScale(xdomain, xrange);

    //initialize y scale
    let ydomain = [0, d3.max(data, d => d[1])];
    let yrange = [chartHeight, 0];
    let yScale = this.createYScale(ydomain, yrange);

    //draw bars
    this.svg.select("g.bars")
      .selectAll("rect")
      .data(data, d => d[0])
      .join(
        enter => enter
          .append('rect')
            .attr("x", d => xScale(d[0]))
            .attr("y", chartHeight)
            .attr("height", 0)
            .attr("width", xScale.bandwidth()),
        update => update,
        exit => exit
          .transition()
            .duration(VerticalBarChart.TRANSITION_DURATION)
            .attr("y", chartHeight)
            .attr("height", 0)
            .remove()
      )
      .transition()
        .duration(VerticalBarChart.TRANSITION_DURATION)
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => chartHeight - yScale(d[1]))

    //draw axes
    this.svg.select('g.xAxis')
      .attr('transform', `translate(0,${chartHeight})`)
      .transition()
        .duration(VerticalBarChart.TRANSITION_DURATION)
        .call(d3.axisBottom(xScale));

    this.svg.select('g.yAxis')
      .transition()
        .duration(VerticalBarChart.TRANSITION_DURATION)
        .call(d3.axisLeft(yScale))

    let chart = this.getChart(data, xScale, yScale);
    let transforms = this.getXAxisTransforms(chart);
    this.applyXAxisTransforms(this.svg, transforms);
    // this.transformAxisLabels(this.svg.selectAll('g.xAxis > .tick > text'), labelTransforms);

    //set viewbox
    this.applyXAxisTransforms(chart, transforms);
    let viewBox = this.computeViewBox(chart, chartWidth, chartHeight);
    this.setViewBox(viewBox);
  }

  //without transitions -> for internal use
  getChart(data, xScale, yScale) {
    let svg = d3.create('svg');
    let chartHeight = yScale.range()[0];
    let chartWidth = xScale.range()[1];

    svg.append("g")
      .selectAll("rect")
      .data(data, d=>d[0])
      .join('rect')
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => chartHeight - yScale(d[1]))
        .attr("width", xScale.bandwidth()),

    svg.append('g')
      .classed('xAxis', true)
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    svg.append('g')
      .call(d3.axisLeft(yScale));

    return svg;
  }

  getXAxisTransforms(svg) {
    let transforms = {};

    svg.attr('visibility', 'hidden');
    document.body.appendChild(svg.node());

    svg.selectAll('g.xAxis > .tick > text').each(function(data, index, group) {
      let dim = this.getBBox();
      let dx = -dim.width/2 - 2;
      let dy = -0.5;
      let transform = `rotate(-70, ${dim.x -  dx}, ${dim.y})`;

      transforms[data] = {dx, dy, transform};

      // console.log(this)
      // console.log(this.getBoundingClientRect())
      // console.log(dim)

      // console.log(data)
      // console.log(index)
      // console.log(group)
    });

    svg.attr('visibility', 'visible');
    svg.remove();

    return transforms;
  }

  applyXAxisTransforms(svg, transforms) {
    svg.selectAll('g.xAxis > .tick > text').each(function(data, i, group) {
      if(transforms[data]) {
        this.setAttribute('dx', transforms[data].dx);
        this.setAttribute('dy', transforms[data].dy);
        this.setAttribute('transform', transforms[data].transform);
      }
    });
  }
};

BarChart.DEFAULT_COLOR = 'steelblue';
BarChart.TRANSITION_DURATION = 750;

HorizontalBarChart.DEFAULT_BANDWIDTH = 60;
HorizontalBarChart.DEFAULT_PADDING = 0.1;
HorizontalBarChart.DEFAULT_WIDTH = 800;
HorizontalBarChart.TRANSITION_DURATION = BarChart.TRANSITION_DURATION;


VerticalBarChart.DEFAULT_BANDWIDTH = 60;
VerticalBarChart.DEFAULT_PADDING = 0.1;
VerticalBarChart.DEFAULT_HEIGHT = 800;
VerticalBarChart.TRANSITION_DURATION = BarChart.TRANSITION_DURATION;

module.exports = {
  HorizontalBarChart,
  VerticalBarChart
};