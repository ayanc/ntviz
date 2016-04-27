// Interactive Multi-series line chart in d3js
// customized for viewing loss functions during
// deep neural network training.
//
// Ayan Chakrabarti <ayanc@ttic.edu>


/////////////////////////////// From fisheye.js by @mbostock

(function() {
  d3.fisheye = {
    scale: function(scaleType) {
      return d3_fisheye_scale(scaleType(), 3, 0);
    }
  };

  function d3_fisheye_scale(scale, d, a) {

    function fisheye(_) {
      var x = scale(_),
          left = x < a,
          range = d3.extent(scale.range()),
          min = range[0],
          max = range[1],
          m = left ? a - min : max - a;
      if (m == 0) m = max - min;
      return (left ? -1 : 1) * m * (d + 1) / (d + (m / Math.abs(x - a))) + a;
    }

    fisheye.distortion = function(_) {
      if (!arguments.length) return d;
      d = +_;
      return fisheye;
    };

    fisheye.focus = function(_) {
      if (!arguments.length) return a;
      a = +_;
      return fisheye;
    };

    fisheye.copy = function() {
      return d3_fisheye_scale(scale.copy(), d, a);
    };

    fisheye.clamp = scale.clamp;
    fisheye.nice = scale.nice;
    fisheye.ticks = scale.ticks;
    fisheye.tickFormat = scale.tickFormat;
    return d3.rebind(fisheye, scale, "domain", "range");
  }
})();
////////////////////////////////

// Sizes
var Swidth=1000, Sheight=600, fWidth=750, fHeight=530,
fTop=20,fLeft=60;

// DOM containers
var svg, fig, p = [], lg = [];
var fEye = false;

// Stuff to code into location hash
var active = [], leftI=0, sLev=0.3; 


// Scale stuff
var xEx, yEx;
var x = d3.scale.linear().range([0,fWidth]).clamp(true);
var y = d3.scale.linear().range([fHeight,0]).clamp(true);
var cScale;

var xAxis = d3.svg.axis().scale(x).orient("bottom")
    .tickSize(-fHeight,-fHeight,0).tickPadding(15);

var yAxis = d3.svg.axis().scale(y).orient("left")
    .ticks(20).tickSize(-fWidth,-fWidth,0)
    .tickFormat(d3.format(".2e"));

// Line map
var line = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); });

// UX Controls
var brush = d3.svg.brush().x(x).extent([0, 0]).on("brush", brushed);
var slider, handle, scap;



window.onload = function() {

    var count, i, j, Swidth2;

    setActive(); loadHash();
    if(active.length <= 10)
	cScale = d3.scale.category10();
    else
	cScale = d3.scale.category20();

    // Compute height and width based on number of labels
    count = 1;
    for(i = 0; i < data.length; i++)
	count += data[i].val.length;
    count = 25+count*25;
    Sheight = Sheight > count ? Sheight : count;

    count = 0;
    for(i = 0; i < data.length; i++)
	for(j = 0; j < data[i].lbls.length; j++)
	    count = count > data[i].lbls[j].length ? count : data[i].lbls[j].length;
    count = -235 + count*8; Swidth2 = Swidth;
    if(count > 0)
	Swidth2 = Swidth2+count;
        
    // SVG setup
    d3.select("#graph").style("width",Swidth2+"px").style("height",Sheight+"px");
    svg = d3.select("#graph").append("svg").attr("xmlns","http://www.w3.org/2000/svg")
	.attr("width",Swidth2).attr("height",Sheight);
    fig = svg.append("g").attr("transform", "translate(" + fLeft + "," + fTop + ")");

    // Create line elements
    xEx = [];
    for(i = 0; i < data.length;i++)
	xEx = d3.extent(xEx.concat(data[i].it));
    x.domain(xEx);
    count=0;
    for(i = 0; i < data.length;i++)
	for(j = 0; j < data[i].val.length;j++) {
	    p[count] = fig.append("path")
	    .datum(getData(i,j))
	    .attr("class","data").attr("stroke",cScale(count));

	    if(!active[count])
		p[count].style("opacity",0);
	    else
		p[count].style("opacity",0.9);
	    count++;
	}

    // Draw axes and lines
    getExtents();
    fig.append("g").attr("class","xax axis").call(xAxis)
	.attr("transform","translate(0,"+fHeight+")");
    fig.append("g").attr("class","yax axis").call(yAxis);
    fig.selectAll(".data").attr("d",line);


    // Draw legend
    count=0;
    for(i = 0; i < data.length;i++)
	for(j = 0; j < data[i].val.length;j++,count++) {
	    lg[count] = fig.append("g")
		.attr("transform","translate("+(Swidth-235)+","+(25+count*25)+")")
		.datum(count).style("opacity",active[count] ? 1.0:0.5)
		.on("click",function (d) { toggle(d); })
		.style("cursor","pointer");
	    lg[count].append("circle")
		.attr("r",4).attr("fill",cScale(count));
	    lg[count].append("text").attr("x",6).attr("y",5).attr("font-size",12)
		.text(data[i].lbls[j]);
	}

    // Add Smooth controls
    svg.append("text").attr("x",Swidth-155).attr("y",20)
	.attr("font-size",12).text("Smooth:").attr("class","noexp");
    scap=svg.append("text").attr("x",Swidth-86).attr("y",20)
	.attr("font-size",14).attr("class","noexp");
    svg.append("text").attr("x",Swidth-105).attr("y",20).attr("font-size",16)
	.text('\u25bc').style('cursor','pointer').attr("class","noexp")
	.on("click",function() {sLev -= 0.1; sLev = sLev < 0 ? 0 : sLev; doSmooth();});
    svg.append("text").attr("x",Swidth-65).attr("y",20).attr("font-size",16)
	.text('\u25b2').style('cursor','pointer').attr("class","noexp")
	.on("click",function() {sLev += 0.1; sLev = sLev > 1 ? 1 : sLev; doSmooth();});
    scap.text(sLev == 1 ? "1.0" : sLev == 0 ? "0.0" : sLev+"");

    // Add axis slider
    slider = fig.select(".xax").append("g").attr("class", "slider noexp").call(brush);
    slider.selectAll(".extent,.resize").remove();
    slider.select(".background").attr("height", 20);
    handle = fig.append("circle").attr("class", "handle").attr("r", 10).attr("opacity",0.5)
	.attr("transform", "translate(0," + fHeight + ")")
	.attr("cx",x(leftI)).attr("class","noexp");

    // Add save button
    svg.append("text").attr("x",Swidth-20).attr("y",20)
	.attr("font-size",14).text('\u2197').attr("class","noexp")
	.on("click",doExp).style("cursor","pointer");


    // Add fisheye button
    svg.append("text").attr("x",Swidth-35).attr("y",20)
	.attr("font-size",14).text('+').attr("class","noexp")
	.on("click",doFeye).style("cursor","pointer");

    // Fisheye zooming
    svg.on("mousemove", function() {
	if(fEye) {
	    var mouse = d3.mouse(this);
	    x.distortion(5).focus(mouse[0]-fLeft);
	    y.distortion(5).focus(mouse[1]-fTop);
	    fig.select(".xax").call(xAxis);
	    fig.select(".yax").call(yAxis);
	    fig.selectAll(".data").attr("d",line);
	    handle.attr("cx",x(leftI));
	}
    });

}

function doFeye() {

    if(!fEye) {
	fEye = true;
	x = d3.fisheye.scale(d3.scale.linear).range([0,fWidth]).domain(xEx); x.clamp(true);
	y = d3.fisheye.scale(d3.scale.linear).range([fHeight,0]).domain(yEx); y.clamp(true);

	x.distortion(5); xAxis.ticks(50).scale(x);
	y.distortion(5); yAxis.ticks(100).scale(y);

	fig.select(".xax").call(xAxis); fig.select(".yax").call(yAxis);

	fig.selectAll(".data").transition().duration(100).attr("d",line);
	handle.transition().duration(100).attr("cx",x(leftI));

    } else {
	fEye = false;
	x = d3.scale.linear().range([0,fWidth]).domain(xEx).clamp(true);
	y = d3.scale.linear().range([fHeight,0]).domain(yEx).clamp(true);

	xAxis.ticks(10).scale(x);
	yAxis.ticks(20).scale(y);

	fig.select(".xax").call(xAxis); fig.select(".yax").call(yAxis);

	fig.selectAll(".data").transition().duration(100).attr("d",line);
	handle.transition().duration(100).attr("cx",x(leftI));
    }
}

function getData(i,j) {
    smooth = sLev*xEx[1]/25.0/(data[i].it[1]-data[i].it[0]);
    smooth = smooth > data[i].it.length/2 ? data[i].it.length/2 : smooth;
    smooth = Math.round(smooth);
    smooth = smooth > 1 ? smooth : 1;

    if(smooth > 1) { // Convolve
	var d = [], k1,k2, c = 0, s1 = 0.0,s2 = 0.0;
	for(k = 0; k < data[i].it.length; k += Math.round(smooth/2)) {
	    s1=0;s2=0;c=0;
	    for(k2 = 0; k2 < smooth && k+k2 < data[i].it.length;k2++) {
		s1+=data[i].it[k+k2]; s2+=data[i].val[j][k+k2];c++;
	    }
	    if(c > 0)
		d.push([s1/c,s2/c]);
	}

	return d;
    } else
	return data[i].val[j].map(function (d,idx) {
	    return [data[i].it[idx],d];
	});
}


function setActive() {
    var i, j;
    active = [];
    for(i = 0; i < data.length;i++)
	for(j = 0; j < data[i].val.length; j++)
	    active.push(true);
}

function getExtents() {
    var i;
    yEx = []; count = 0;
    for(i = 0; i < p.length;i++)
	if(active[i]) {
	    pid = p[i].data()[0];
	    if(pid[pid.length-1][0] >= leftI)
		yEx = d3.extent(yEx.concat(
		    pid.map(function(d) { return d[0] >= leftI ? d[1] : null; })
		));
	}
    if(yEx.length == 0)	yEx = [0,1];
    y.domain(yEx);
}

function toggle(idx) {
    active[idx] = ! active[idx];
    lg[idx].style("opacity",active[idx] ? 1.0 : 0.5);
    p[idx].style("opacity",active[idx] ? 0.9 : 0);

    getExtents();
    fig.select(".yax").transition().duration(100).call(yAxis);
    fig.selectAll(".data").transition().duration(100).attr("d",line);

    upHash();
}


function doSmooth() {
    var i,j,count=0;

    sLev = Math.round(sLev*10)/10;
    scap.text(sLev == 1 ? "1.0" : sLev == 0 ? "0.0" : sLev+"");

    for(i = 0; i < data.length; i++)
	for(j = 0; j < data[i].val.length; j++)
	    p[count++].datum(getData(i,j));

    getExtents();
    fig.selectAll(".data").attr("d",line);
    fig.select(".yax").call(yAxis);

    upHash();
}


function brushed() { 
    var value = Math.round(brush.extent()[0]);

    handle.attr("cx",x(value));
    leftI = value; getExtents();
    fig.select(".yax").transition().duration(100).call(yAxis);
    fig.selectAll(".data").transition().duration(100).attr("d",line);

    upHash();
}


function loadHash() {
    var h = window.location.hash;
    if(h == "") return;

    h = h.substr(1,h.length-1);
    h = h.split('_');

    leftI = Number(h[0]);

    sLev = Number(h[1])/10; 
    sLev = sLev > 1.0 ? 1.0 : (sLev < 0 ? 0 : sLev);
    
    h[2].split('',active.length)
	.map(function(d,idx) { return active[idx] = d == '1';});
}

function upHash() {
    h = leftI + "_" + Math.round(sLev*10) + "_";
    h = h + active.map(function(d) { return d ? '1' : '0';}).join('');
    window.location.hash = h;
}

function doExp() {
    var i,count=0;

    for(i = 0; i < p.length;i++) {
	if(!active[i]) {
	    p[i].remove(); lg[i].remove();
	} else {
	    lg[i].attr("transform","translate("+(Swidth-235)+","+(25+count*25)+")")	    
	    count++;
	}
    }

    d3.selectAll('.noexp').remove();
    applyStyles();
    imgsrc = 'data:image/svg+xml;base64,' + btoa(svg.node().parentNode.innerHTML);
    window.location.assign(imgsrc);
}

// Styles to match .css file
function applyStyles() {
    d3.selectAll(".axis path")
	.style("fill","none")
	.style("stroke","#000")
	.style("shape-rendering","crispEdges");

    d3.selectAll(".axis line")
	.style("fill","none")
	.style("stroke","#000")
	.style("shape-rendering","crispEdges");

    d3.selectAll(".xax .domain")
	.style("stroke-width","5px")
	.style("stroke-opacity","0.25");

    d3.selectAll(".tick")
	.style("font-family","sans-serif")
	.style("font-size","12px");

    d3.selectAll(".tick line").style("opacity","0.1");

    d3.selectAll(".data")
	.style("fill","none")
	.style("stroke-width","1.25px");
}
