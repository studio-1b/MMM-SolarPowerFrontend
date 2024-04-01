'use strict';

Module.register("MMM-SolarPowerFrontend", {

	mailCount: 0,
	jsonData: null,
	errorData: null,

	// Default module config.
	defaults: {
		width: "375px",
		//height: "300px",
		chartheight: "200px",
		style: 'border:0;-webkit-filter: grayscale(100%);filter: grayscale(100%);',
		contentAlign: "left",
		mode: "1y",

		refreshInterval: 5*60*1000, //5min
		maxRefreshEvery24h: 288, // refresh 24h data with 144 items, maximum of 288 times/day
		maxRefreshFor12mo: 24,  // refresh annual monthly-avg data with 12 items, maximum of 24 times/year
		maxRefreshFor30d: 60,  // refresh 30d data with 720 items, maximum of 60 times/30days

		power_24h_url: null,
   		power_30d_url: null,
   		power_1yr_url: null,

	},

	start: function () {
		var self=this;
		const config = this.config;

		//this.updateDom(500);
		// run chart building functions, after dom gets build
		//this.waitForDom = setInterval(() => {if(document.all["chart-round"]) {clearInterval(self.waitForDom); self.afterDom();} }, 500);	
		this.waitForDom = setInterval(() => {if(self.isDomReady()) {clearInterval(self.waitForDom);} }, 500);	

		this.sendConfig();
		//this.sendRefresh();
		
		setTimeout(() => self.sendRefresh(), 500);
		setInterval(() => self.sendRefresh(), this.config.refreshInterval);
	},

	// Define required scripts.
	getStyles: function () {
		return ["Chart.min.css"];
	},

	// Define required scripts.
	getScripts: function() {
		return ["Chart.min.js"];
	},

	// Request node_helper to get json from url
	sendConfig: function () {
		console.log("MMM-SolarPowerFrontend_SET_CONFIG");
		this.sendSocketNotification("MMM-SolarPowerFrontend_SET_CONFIG", this.config);
	},
	sendRefresh: function () {
		console.log(this.name + " sendRefresh");
		const config = this.config;
		console.log(config);
		var self=this;

		const decrement = config.refreshInterval;
		const time24h = 24 * 60 * 60 * 1000;
		const time30d = 31 * time24h;
		const time12mo = 365 * time24h;
		var count24h = this.count24h ? this.count24h-decrement : 0;
		var count12mo = this.count12mo ? this.count12mo-decrement : 0;
		var count30d = this.count30d ? this.count30d-decrement : 0;
		console.log(this.name + " waits ");
		console.log([count24h,count30d,count12mo]);

		//console.log(this.name + " refresh for 1day window, multiple per day(24h) data " + rate24h + "/" + config.maxRefreshEvery24h);
		if(count24h<=0){
			console.log("sending MMM-SolarPowerFrontend_GET_24H");
			this.sendSocketNotification("MMM-SolarPowerFrontend_GET_24H", {});
			const wait24h = Math.round(time24h/config.maxRefreshEvery24h);
			count24h = wait24h;
			console.log(this.name + " waiting for " + count24h + "ms");
		}
		//console.log(this.name + " refresh for 30day window, multiple per month (30d) data " + rate30d + "/" + config.maxRefreshFor30d);
		if(count30d<=0){
			console.log("sending SolarPowerFrontend_GET_30D");
			this.sendSocketNotification("MMM-SolarPowerFrontend_GET_30D", {});
			const wait30d = Math.round(time30d/config.maxRefreshFor30d);
			count30d = wait30d;
			console.log(this.name + " waiting for " + count30d + "ms");
		}
		//console.log(this.name + " refresh for 12mo window, multiple per year (12mo) data " + rate12mo + "/" + config.maxRefreshFor12mo);
		if(count12mo<=0){
			console.log("sending MMM-SolarPowerFrontend_GET_12MO");
			this.sendSocketNotification("MMM-SolarPowerFrontend_GET_12MO", {});
			const wait12mo = Math.round(time12mo/config.maxRefreshFor12mo);
			count12mo = wait12mo;
			console.log(this.name + " waiting for " + count12mo + "ms");
		}
		
		if(this.count24h && this.count12mo && this.count30d) {
			this.count24h = count24h;
			this.count12mo = count12mo;
			this.count30d = count30d;	
		} else {
			const wait24h = Math.round(time24h/config.maxRefreshEvery24h);
			const wait30d = Math.round(time30d/config.maxRefreshFor30d);
			const wait12mo = Math.round(time12mo/config.maxRefreshFor12mo);

			const target = new Date();
			const now = target.getTime();

			// set update to next scheduled update, default every 5min mark on clock
			target.setHours(0,0,0);
			const midnight = target.getTime();
			this.count24h = Math.round(wait24h-((now-midnight)%config.maxRefreshEvery24h));

			// set update to next scheduled update, default every 4a then 4p on clock
			target.setHours(4,0,0);
			const finished = target.getTime();
			this.count30d = Math.round(wait30d-((now-finished)%config.maxRefreshFor30d));

			// set update to next scheduled update, default 1st of month at midnight, then 16th on clock
			target.setDate(2);
			target.setHours(0,0,0);
			const first = target.getTime();
			this.count12mo = Math.round(wait12mo-((now-first)%config.maxRefreshFor12mo));
		}
	},

	socketNotificationReceived: function (notification, payload) {
		console.log(this.name + notification);
		console.log(payload);
		var self=this;
		if (notification === "MMM-SolarPowerFrontend_DAY_RESULT") {
			this.day = payload;
			this.processIntervalAvg(payload);
		} else if (notification === "MMM-SolarPowerFrontend_MONTH_RESULT") {
			this.month = payload;
			this.process30dayHistory(payload);
		} else if (notification === "MMM-SolarPowerFrontend_MONTHLY_HOURLY_RESULT") {
			this.annual = payload;
			this.processHourlyAh(payload);
		}
	},


	// Override getHeader method.
	//getHeader: function() {
	//	if (!this.jsonData) {
	//		return "ImapFeed";
	//	}
	//	if (this.config.playSound && this.jsonData.fullcount > this.mailCount) {
	//		new Audio(this.file("eventually.mp3")).play();
	//	}
	//	this.mailCount = this.jsonData.fullcount;
	//	return this.jsonData.title + "  -  " + this.jsonData.fullcount;
	//},

	// Override dom generator.
	getDom: function () {
		const config = this.config;
		console.log(this.config);
		const brk = function() {
			const b = document.createElement("br");
			b.style.margin = "0px";
			b.style.padding = "0px";
			return b;
		}
		

		var div = document.createElement("div");
		div.style = config.style;
		//div.style.width = config.width;
		div.style.color = "white";
		div.style.padding = 0;
		div.style.margin = 0;
		div.style.fontFamily = "Roboto,Roboto Condensed,sans-serif";
		div.style.display = "block";
		div.style.textAlign = config.contentAlign;

		var h1 = document.createElement("h1");
		h1.style.fontSize = "8pt";
		h1.style.color = "#888888";
		h1.style.margin = "0px";
		h1.style.padding = "0px";
		h1.style.lineHeight = "20px";
		h1.innerHTML="Van Power as of ";
		div.append(h1);
		var loadtimespan = this.loadtimespan = document.createElement("span");
		loadtimespan.innerHTML=(new Date()).toLocaleString();
		h1.append(loadtimespan);


		//var canvas1 = document.createElement("canvas");
		//canvas1.id = "chart-1";
		//canvas1.style.width = config.width;
		//canvas1.style.height = config.height;
		//canvas1.style.maxHeight = config.height;
		//this.canvas1 = canvas1;
		//div.append(canvas1);

		const half = "48%"; //(config.width/2) + "px";
		const horizontalchart = {width:half, aspectRatio: "1 / 1", display:"inline-block",verticalAlign:"top",marginBottom:"10px"};
		var div1 = document.createElement("div"); //<div class="horizontalchart">
		div1.style.width = horizontalchart.width;
		//div1.style.height = horizontalchart.height;
		div1.style.aspectRatio = horizontalchart.aspectRatio;
		div1.style.display = horizontalchart.display;
		div1.style.verticalAlign = horizontalchart.verticalAlign;
		div1.style.marginBottom = horizontalchart.marginBottom;
		div1.style.marginTop = 0;
		div.append(div1);
		var canvas1 = document.createElement("canvas");
		canvas1.id = "chart-round";
		canvas1.style.width = horizontalchart.width;
		canvas1.style.aspectRatio = horizontalchart.aspectRatio;
		//canvas1.style.height = horizontalchart.height;
		//canvas1.style.maxHeight = horizontalchart.height;
		this.canvas1 = canvas1;
		div1.append(canvas1);

		var div2 = document.createElement("div"); //<div class="horizontalchart">
		div2.style.width = horizontalchart.width;
		//div2.style.height = horizontalchart.height;
		div2.style.aspectRatio = horizontalchart.aspectRatio;
		div2.style.display = horizontalchart.display;
		div2.style.verticalAlign = horizontalchart.verticalAlign;
		div2.style.marginBottom = horizontalchart.marginBottom;
		div.append(div2);
		var canvas2 = document.createElement("canvas");
		canvas2.id = "chart-horizontal";
		canvas2.style.width = horizontalchart.width;
		canvas2.style.aspectRatio = horizontalchart.aspectRatio;
		//canvas2.style.height = horizontalchart.height;
		//canvas2.style.maxHeight = horizontalchart.height;
		this.canvas2 = canvas2;
		div2.append(canvas2);

		var br = document.createElement("br");
		div.append(br);

		// 24h charts
		const h2style = { fontSize:"8pt",color:"#888888", padding:0, margin:0, lineHeight:"20px"};
		var h2 = document.createElement("h2");
		h2.style.fontSize = h2style.fontSize;
		h2.style.color = h2style.color;
		h2.style.padding = h2style.padding;
		h2.style.margin = h2style.margin;
		h2.style.lineHeight = h2style.lineHeight;
		h2.innerHTML="Last 24 hours";
		div.append(h2);

		var section2 = this.section2 = document.createElement("div");
		section2.style.width = config.width;
		section2.style.backgroundColor = "rgba(64,64,64,0.1)";
		section2.style.display = "inline-block";
		div.append(section2);

		const subchartHeight = (parseInt(config.chartheight)-50) + "px";
		var div3 = document.createElement("div"); //<div class="pane">
		div3.style = config.style;
		div3.style.width = config.width;
		div3.style.height = config.chartheight;
		div3.style.maxHeight = config.chartheight;
		//div3.style.display = "inline-block";
		section2.append(div3);
		var canvas3 = document.createElement("canvas");
		canvas3.id = "chart-3";
		canvas3.style.width = config.width;
		canvas3.style.height = config.chartheight;
		canvas3.style.maxHeight = config.chartheight;
		this.canvas3 = canvas3;
		div3.append(canvas3);

		//div.append(brk());

		var div4 = document.createElement("div"); //<div class="pane">
		div4.style = config.style;
		div4.style.width = config.width;
		div4.style.height = subchartHeight
		div4.style.maxHeight = subchartHeight;
		//div4.style.display = "inline-block";
		section2.append(div4);
		var canvas4 = document.createElement("canvas");
		canvas4.id = "chart-4";
		canvas4.style.width = config.width;
		canvas4.style.height = subchartHeight;
		canvas4.style.maxHeight = subchartHeight;
		this.canvas4 = canvas4;
		div4.append(canvas4);

		//info boxes for 24h
		const fuzzyOverlay = {width:"175px", backgroundColor:"rgba(0,0,0, 0.5)", position:"absolute", display:"none"};
		var infobox1 = this.infobox1 = document.createElement("table");
		infobox1.style.width=fuzzyOverlay.width;
		infobox1.style.backgroundColor=fuzzyOverlay.backgroundColor;
		infobox1.style.position=fuzzyOverlay.position;
		infobox1.style.display=fuzzyOverlay.display;
		var tr11 = document.createElement("tr");
		infobox1.appendChild(tr11);
		var td11a = document.createElement("td");
		tr11.appendChild(td11a).append("Battery Amps");
		//var td11b = document.createElement("td");
		//tr11.appendChild(td11b);
		//var span11 = document.createElement("span");
		//td11b.appendChild(span11);
		//td11b.append();

		var tr12 = document.createElement("tr");
		infobox1.appendChild(tr12);
		var td12a = document.createElement("td");
		tr12.appendChild(td12a).append("&Delta; mA 24h:");
		var td12b = document.createElement("td");
		tr12.appendChild(td12b);
		var span12 = this.ma24 = document.createElement("span");
		td12b.appendChild(span12).id = "ma24";
		td12b.append("mA");

		var tr13 = document.createElement("tr");
		infobox1.appendChild(tr13);
		var td13a = document.createElement("td");
		tr13.appendChild(td13a).append("Graph battery net:");
		var td13b = document.createElement("td");
		tr13.appendChild(td13b);
		var span13 = this.mah24 = document.createElement("span");
		td13b.appendChild(span13).id = "mah24";
		td13b.append("mA");

		var tr14 = document.createElement("tr");
		infobox1.appendChild(tr14);
		var td14a = document.createElement("td");
		tr14.appendChild(td14a).append("Daily Ah (avg mA*24):");
		var td14b = document.createElement("td");
		tr14.appendChild(td14b);
		var span14 = this.mahdaily = document.createElement("span");
		td14b.appendChild(span14).id = "mahdaily";
		td14b.append("mAh");


		var infobox2 = this.infobox2 = document.createElement("table");
		infobox2.style.width=fuzzyOverlay.width;
		infobox2.style.backgroundColor=fuzzyOverlay.backgroundColor;
		infobox1.style.position=fuzzyOverlay.position;
		infobox1.style.display=fuzzyOverlay.display;
		var tr21 = document.createElement("tr");
		infobox2.appendChild(tr21);
		var td21a = document.createElement("td");
		tr21.appendChild(td21a).append("Circuit Volts");
		//var td11b = document.createElement("td");
		//tr11.appendChild(td11b);
		//var span11 = document.createElement("span");
		//td11b.appendChild(span11);
		//td11b.append();

		var tr22 = document.createElement("tr");
		infobox2.appendChild(tr22);
		var td22a = document.createElement("td");
		tr22.appendChild(td22a).append("Voltage yesterday:");
		var td22b = document.createElement("td");
		tr22.appendChild(td22b);
		var span22 = this.mv24 = document.createElement("span");
		td22b.appendChild(span22).id = "mv24";
		td22b.append("mV");

		var tr23 = document.createElement("tr");
		infobox2.appendChild(tr23);
		var td23a = document.createElement("td");
		tr23.appendChild(td23a).append("&Delta; mV 24h:");
		var td23b = document.createElement("td");
		tr23.appendChild(td23b);
		var span23 = this.dmv24 = document.createElement("span");
		td23b.appendChild(span23).id = "dmv24";
		td23b.append("mV");

		var tr24 = document.createElement("tr");
		infobox2.appendChild(tr24);
		var td24a = document.createElement("td");
		tr24.appendChild(td24a).append("Daily range:");
		var td24b = document.createElement("td");
		tr24.appendChild(td24b);
		var span24 = this.mvlow = document.createElement("span");
		td24b.appendChild(span24).id = "mvlow";
		td24b.append(" to ");
		var span24b = this.mvhigh = document.createElement("span");
		td24b.appendChild(span24b).id = "mvhigh";
		td24b.append("mV");

		var tr25 = document.createElement("tr");
		infobox2.appendChild(tr25);
		var td25a = document.createElement("td");
		tr25.appendChild(td25a).append("&Delta; mAh 24h:");
		var td25b = document.createElement("td");
		tr25.appendChild(td25b);
		var span25 = this.dmah24 = document.createElement("span");
		td25b.appendChild(span25).id = "dmah24";
		td25b.append("mAh");

		
		if(["24h"].indexOf(this.config.mode)!=-1) {
			console.log("Stopping display of 30d and annual averages");
			return div;
		}
		//var hr1 = document.createElement("hr");
		//div.append(hr1);

		// 30d charts
		var h3 = this.h3 = document.createElement("h2");
		h3.style.fontSize = h2style.fontSize;
		h3.style.color = h2style.color;
		h3.style.padding = h2style.padding;
		h3.style.margin = h2style.margin;
		h3.style.lineHeight = h2style.lineHeight;
		h3.innerHTML="Last 30 days";
		div.append(h3);

		var section3 = this.section3 = document.createElement("div");
		section3.style.width = config.width;
		section3.style.backgroundColor = "rgba(64,64,64,0.1)";
		section3.style.display = "inline-block";
		div.append(section3);

		var div5 = document.createElement("div"); //<div class="pane">
		div5.style = config.style;
		div5.style.width = config.width;
		div5.style.height = config.chartheight;
		div5.style.maxHeight = config.chartheight;
		//div5.style.display = "inline-block";
		section3.append(div5);
		var canvas5 = document.createElement("canvas");
		canvas5.id = "chart-5";
		canvas5.style.width = config.width;
		canvas5.style.height = config.chartheight;
		canvas5.style.maxHeight = config.chartheight;
		this.canvas5 = canvas5;
		div5.append(canvas5);

		//div.append(brk());

		var div6 = document.createElement("div"); //<div class="pane">
		div6.style = config.style;
		div6.style.width = config.width;
		div6.style.height = subchartHeight;
		div6.style.maxHeight = subchartHeight;
		//div6.style.display = "inline-block";
		section3.append(div6);
		var canvas6 = document.createElement("canvas");
		canvas6.id = "chart-6";
		canvas6.style.width = config.width;
		canvas6.style.height = subchartHeight;
		canvas6.style.maxHeight = subchartHeight;
		this.canvas6 = canvas6;
		div6.append(canvas6);
                var progress3 = document.createElement("div");
		progress3.style.width = "0%";
		progress3.style.height = "4px";
		progress3.style.visibility = "hidden";
		progress3.style.backgroundColor = "white";
		div7.append(progress3);


		if(["24h","30d"].indexOf(this.config.mode)!=-1) {
			console.log("Stopping display of 30d and annual averages");
			return div;
		}

		//var hr2 = document.createElement("hr");
		//div.append(hr2);

		// annual solar by monthly hour chart
		var h4 = this.h4 = document.createElement("h2");
		h4.style.fontSize = h2style.fontSize;
		h4.style.color = h2style.color;
		h4.style.padding = h2style.padding;
		h4.style.margin = h2style.margin;
		h4.style.lineHeight = h2style.lineHeight;
		h4.innerHTML="Average Solar output by hour and month";
		div.append(h4);
		
		var section4 = this.section4 = document.createElement("div");
		section4.style.width = config.width;
		section4.style.backgroundColor = "rgba(64,64,64,0.1)";
		section4.style.display = "inline-block";
		div.append(section4);

		const doubleheight = Math.round(parseInt(config.chartheight)*1.5) + "px";
		var div7 = document.createElement("div"); //<div class="pane">
		div7.style = config.style;
		div7.style.width = config.width;
		div7.style.height = doubleheight;
		div7.style.maxHeight = doubleheight;
		div7.style.display = "inline-block";
		section4.append(div7);
		var canvas7 = document.createElement("canvas");
		canvas7.id = "chart-7";
		canvas7.style.width = config.width;
		canvas7.style.height = doubleheight;
		canvas7.style.maxHeight = doubleheight;
		this.canvas7 = canvas7;
		div7.append(canvas7);
                var progress4 = document.createElement("div");
		progress4.style.width = "0%";
		progress4.style.height = "4px";
		progress4.style.visibility = "hidden";
		progress4.style.backgroundColor = "white";
		div7.append(progress4);

		//console.log("dom returned");
		
		return div;
	},
	newupdateDom: function() {
		this.oldupdateDom();
		this.afterDom();
	},
	transparentize:function (color, opacity) {
		var alpha = opacity === undefined ? 0.5 : 1 - opacity;
		return window.Color(color).alpha(alpha).rgbString();
	},
	isDomReady: function() {
		if(!this.chart3)
			if(document.all["chart-round"]) {
				this.afterDom();
				console.log("DOM is ready for charting");
			} else {
				return false;
			}
		
		return true;
	},
	afterDom: function() {
		const self = this;
		Chart.pluginService.register({
			beforeDraw: function(chart) {
			  if (chart.config.options.elements.center) {
				// Get ctx from string
				var ctx = chart.chart.ctx;
		  
				// Get options from the center object in options
				var centerConfig = chart.config.options.elements.center;
				var fontStyle = centerConfig.fontStyle || 'Arial';
				var txt = centerConfig.text;
				var color = centerConfig.color || '#000';
				var maxFontSize = centerConfig.maxFontSize || 75;
				var sidePadding = centerConfig.sidePadding || 20;
				var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
				// Start with a base font of 30px
				ctx.font = "30px " + fontStyle;
		  
				// Get the width of the string and also the width of the element minus 10 to give it 5px side padding
				var stringWidth = ctx.measureText(txt).width;
				var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;
		  
				// Find out how much the font can grow in width.
				var widthRatio = elementWidth / stringWidth;
				var newFontSize = Math.floor(30 * widthRatio);
				var elementHeight = (chart.innerRadius * 2);
		  
				// Pick a new font size so it will not be larger than the height of label.
				var fontSizeToUse = Math.min(newFontSize, elementHeight, maxFontSize);
				var minFontSize = centerConfig.minFontSize;
				var lineHeight = centerConfig.lineHeight || 25;
				var wrapText = false;
		  
				if (minFontSize === undefined) {
				  minFontSize = 20;
				}
		  
				if (minFontSize && fontSizeToUse < minFontSize) {
				  fontSizeToUse = minFontSize;
				  wrapText = true;
				}
		  
				// Set font settings to draw it correctly.
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
				var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
				ctx.font = fontSizeToUse + "px " + fontStyle;
				ctx.fillStyle = color;
		  
				if (!wrapText) {
				  ctx.fillText(txt, centerX, centerY);
				  return;
				}
		  
				var words = txt.split(' ');
				var line = '';
				var lines = [];
		  
				// Break words up into multiple lines if necessary
				for (var n = 0; n < words.length; n++) {
				  if (words[n].indexOf("\n")>=0) {
					var seg=words[n].split("\n",2);
					line = line + seg[0];
					words[n] = seg[1];
					lines.push(line);
					line = '';
				  }
		  
				  var testLine = line + words[n] + ' ';
				  var metrics = ctx.measureText(testLine);
				  var testWidth = metrics.width;
				  if (testWidth > elementWidth && n > 0) {
					lines.push(line);
					line = words[n] + ' ';
				  } else {
					line = testLine;
				  }
				}
		  
				// Move the center up depending on line height and number of lines
				centerY -= (lines.length / 2) * lineHeight;
		  
				for (var n = 0; n < lines.length; n++) {
				  ctx.fillText(lines[n], centerX, centerY);
				  centerY += lineHeight;
				}
				//Draw text in center
				ctx.fillText(line, centerX, centerY);
			  }
			}
		});

		window.chartColors = {
			white: 'rgb(255, 255, 255)',
			black: 'rgb(0, 0, 0)',
			red: 'rgb(255, 99, 132)',
			orange: 'rgb(255, 159, 64)',
			yellow: 'rgb(255, 205, 86)',
			green: 'rgb(75, 192, 192)',
			blue: 'rgb(54, 162, 235)',
			purple: 'rgb(153, 102, 255)',
			grey: 'rgb(201, 203, 207)',
			aqua: 'rgb(0, 255, 255)',
			teal: 'rgb(0, 128, 128)',
			maroon: 'rgb(128, 0, 0)',
			olive: 'rgb(128, 128, 0)',
			lime: 'rgb(0, 255, 0)',
			fushia: 'rgb(128, 0, 128)',
			navy: 'rgb(0, 0, 128)',
			pink: 'rgb(255, 192, 203)',
			saddlebrown: 'rgb(139, 69, 19)'
		};
		var presets = window.chartColors;

        var horizontaldata = {
			labels: ["Ah","A","A"],
			datasets: [{
				backgroundColor: [this.transparentize(presets.blue),this.transparentize(presets.blue,0.99),this.transparentize(presets.red)],
				borderColor: presets.blue,
				data: [1,2,3],
				label: 'Battery'
			}, {
				backgroundColor: [this.transparentize(presets.yellow), this.transparentize(presets.yellow,0.99)],
				borderColor: presets.yellow,
				data: [4,4],
				label: 'Solar'
			}]
		};

		var horizontalstackedoptions = {
			maintainAspectRatio: false,
			tooltips: {
				enabled: false
			},
			hover :{
				animationDuration:0
			},
			scales: {
				xAxes: [{
					display:false,
					max:1000,
					ticks: {
						beginAtZero:true,
						fontFamily: "'Open Sans Bold', sans-serif",
						fontSize:24,
						mirror: true,
					},
					scaleLabel:{
						display:false
					},
					gridLines: {
					}, 
					stacked: true
				}],
				yAxes: [{
					gridLines: {
						display:false,
						color: "#fff",
						zeroLineColor: "#fff",
						zeroLineWidth: 0
					},
					ticks: {
						fontFamily: "'Open Sans Bold', sans-serif",
						fontSize:14,
					},
					stacked: true
				}]
			},
			legend:{
				display:false
			},
			animation: {
				onComplete: function () {
					var chartInstance = this.chart;
					var ctx = chartInstance.ctx;
					ctx.textAlign = "left";
					ctx.font = "20px sans-serif";
					ctx.fillStyle = "#fff";
		
					Chart.helpers.each(this.data.datasets.forEach(function (dataset, i) {
						var meta = chartInstance.controller.getDatasetMeta(i);
						Chart.helpers.each(meta.data.forEach(function (bar, index) {
							//data = dataset.data[index];
							if(i==0){
								var bylabel = dataset.bylabels[index];
								var bydata = dataset.bydata[index];
								ctx.fillText(bylabel + ": " + bydata, 20, bar._model.y+4);
		//                        ctx.fillText(data, 50, bar._model.y+4);
		//                    } else {
		//                        ctx.fillText(data, bar._model.x-25, bar._model.y+4);
							}
						}),this)
					}),this);
				}
			},
			pointLabelFontFamily : "Quadon Extra Bold",
			scaleFontFamily : "Quadon Extra Bold",
		};		

		// https://stackoverflow.com/questions/20966817/how-to-add-text-inside-the-doughnut-chart-using-chart-js
		// https://www.chartjs.org/docs/latest/samples/other-charts/doughnut.html
		var gauge  = this.gaugechart = new Chart('chart-round', {
			type: 'doughnut',
			data: horizontaldata,
			options: {
			responsive: true,
			cutoutPercentage: 50,
			aspectRatio: 1,
			elements: {
				center: {
					text: '0.0A\n -0.0A',
					color: '#FFFFFF', //'#FF6384', // Default is #000000
					fontStyle: 'Sans-Serif', // Default is Arial
					sidePadding: 0, // Default is 20 (as a percentage)
					minFontSize: 24, // Default is 20 (in px), set to false and text will not wrap.
					lineHeight: 28, // Default is 25 (in px), used for when text wraps
				}
			},
				legend: {
				display: false
			},
				tooltips: {
				enabled: false,
			},
			plugins: {
			  legend: {
				labels: {
				  generateLabels: function(chart) {
					// Get the default label list
					const original = Chart.overrides.pie.plugins.legend.labels.generateLabels;
					const labelsOriginal = original.call(this, chart);
		
					// Build an array of colors used in the datasets of the chart
					let datasetColors = chart.data.datasets.map(function(e) {
					  return e.backgroundColor;
					});
					datasetColors = datasetColors.flat();
		
					// Modify the color and hide state of each label
					labelsOriginal.forEach(label => {
					  // There are twice as many labels as there are datasets. This converts the label index into the corresponding dataset index
					  label.datasetIndex = (label.index - label.index % 2) / 2;
		
					  // The hidden state must match the dataset's hidden state
					  label.hidden = !chart.isDatasetVisible(label.datasetIndex);
		
					  // Change the color to match the dataset
					  label.fillStyle = datasetColors[label.index];
					});
		
					return labelsOriginal;
				  }
				},
				onClick: function(mouseEvent, legendItem, legend) {
				  // toggle the visibility of the dataset from what it currently is
				  legend.chart.getDatasetMeta(
					legendItem.datasetIndex
				  ).hidden = legend.chart.isDatasetVisible(legendItem.datasetIndex);
				  legend.chart.update();
				}
			  },
			  tooltip: {
				callbacks: {
				  label: function(context) {
					const labelIndex = (context.datasetIndex * 2) + context.dataIndex;
					return context.chart.data.labels[labelIndex] + ': ' + context.formattedValue;
				  }
				}
			  }
			}
		  },
		});
		
		var bars = this.barschart = new Chart('chart-horizontal', {
			type: 'horizontalBar',
			data: {
				labels: ["", "", "", ""],
				datasets: [{
					bylabels: ["Capacity","Voltage","Solar","Alternator"],
					bydata: ["36.7/100Ah","13.6V","90W","25.4A"],
					data: [727, 0, 0, 0],
					backgroundColor: self.transparentize(presets.lime),
		//            backgroundColor: "rgba(63,203,226,1)",
		//            backgroundColor: "rgba(63,103,126,1)",
				},{
					data: [0, 589, 0, 0],
					backgroundColor: self.transparentize(presets.blue),
				},{
					data: [0, 0, 123, 0],
					backgroundColor: self.transparentize(presets.yellow),
				},{
					data: [0, 0, 0, 789],
					backgroundColor: self.transparentize(presets.orange),
				},{
					bylabels: ["blue"],
					data: [273, 411, 877, 211],
					backgroundColor: "rgba(63,103,126,0.5)",
				}]
			},
			barPercentage: 1.2,
			categoryPercentage: 1.2,
			options: horizontalstackedoptions,
		});
		

		const ampdata = function () { 
			return {
				labels: ["A","B","C","D"],
				datasets: [{
					backgroundColor: window.Color(window.chartColors.blue).alpha(0.4).rgbString(), //this.transparentize(presets.blue),
					borderColor: presets.blue,
									borderWidth: 1,
									pointRadius: 1,
					data: [1,2,3,4],
					label: 'Batt (mA)',
					fill: 'origin'
				}, {
					backgroundColor: self.transparentize(presets.yellow),
					borderColor: presets.yellow,
									borderWidth: 1,
									pointRadius: 1,
					data: [5,6,7,8],
					label: 'Sol (mA)',
					fill: 'origin'
				}, {
					type:'bar',
					backgroundColor: window.Color(window.chartColors.white).alpha(0.1).rgbString(),
					borderColor: presets.white,
					width:'100%',
					barPercentage:1.25,
					data: [3,4,5,6],
					label: 'Esol (mA)',
					fill: '-1'
				}]
			};
		}
		const voltagedata = function () {
			return {
				labels: ["a","b","c","d"],
				datasets: [{
					type:'line',
					backgroundColor: self.transparentize(presets.blue),
					borderColor: presets.blue,
									borderWidth: 1,
									pointRadius: 1,
					data: [4,3,2,1],
					label: 'Sys (mV)',
					yAxisID: 'y-axis-1',
					fill: false
				}, {
					type:'bar',
					backgroundColor: self.transparentize(presets.lime),
					borderColor: presets.lime,
					data: [8,7,6,5],
					label: 'Batt (mAh)',
					yAxisID: 'y-axis-2',
					fill: 1
				}, {
					type:'line',
					backgroundColor: self.transparentize(presets.white),
					borderColor: presets.white,
					data: [6,5,4,3],
					label: 'full (mAh)',
					yAxisID: 'y-axis-2',
					fill: false
				}]
			};
		}
		var options = {
			maintainAspectRatio: false,
			spanGaps: false,
			elements: {
				line: {
					tension: 0.4
				}
			},
			scales: {
				yAxes: [{
                    position: 'right',
					stacked: false
				}]
			}
		};
		var option2axes = {
			maintainAspectRatio: false,
			spanGaps: false,
			elements: {
				line: {
					tension: 0.4
				}
			},
			scales: {
                xAxes: [{ticks: {display: false}}],
				yAxes: [{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					id: 'y-axis-1',
				}, {
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'left',
					id: 'y-axis-2',
                    ticks: {
                        beginAtZero: true
                    },
					gridLines: {
						drawOnChartArea: false
					}
				}]
			}
		};


        var chart3 = this.chart3 = new Chart('chart-3', {
			type: 'line',
			legend: {
				itemWrap: false,     // Change to true or false 
			},
			data: ampdata(),
			options: options
		});
		var chart4 = this.chart4 = new Chart('chart-4', {
			type: 'line',
			data: voltagedata(),
			options: option2axes
		});


		if(["24h"].indexOf(this.config.mode)!=-1) {
			console.log("Stopping display of 30d and annual averages");
			return false;
		}

		var chart5 = this.chart5 = new Chart('chart-5', {
			type: 'line',
			legend: {
				itemWrap: false,     // Change to true or false 
			},
			data: ampdata(),
			options: options
		});
		var chart6 = this.chart6 = new Chart('chart-6', {
			type: 'line',
			data: voltagedata(),
			options: option2axes
		});



		if(["24h", "30d"].indexOf(this.config.mode)!=-1) {
			console.log("Stopping display of annual averages");
			return false;
		}

		var summarydata = {
			labels: [],
			datasets: [{
				type:'bar',
				backgroundColor: this.transparentize(presets.black),
				borderColor: presets.black,
				data: [],
				label: 'Avg Battery Net(mAh)',
				yAxisID: 'y-axis-2',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.navy),
				borderColor: presets.navy,
				data: [],
				label: 'Jan',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.pink),
				borderColor: presets.pink,
				data: [],
				label: 'Feb',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.lime),
				borderColor: presets.lime,
				data: [],
				label: 'Mar',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.yellow),
				borderColor: presets.yellow,
				data: [],
				label: 'Apr',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.red),
				borderColor: presets.red,
				data: [],
				label: 'May',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.fushia),
				borderColor: presets.fushia,
				data: [],
				label: 'Jun',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.maroon),
				borderColor: presets.maroon,
				data: [],
				label: 'Jul',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.olive),
				borderColor: presets.olive,
				data: [],
				label: 'Aug',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.grey),
				borderColor: presets.grey,
				data: [],
				label: 'Sep',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.orange),
				borderColor: presets.orange,
				data: [],
				label: 'Oct',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.saddlebrown),
				borderColor: presets.saddlebrown,
				data: [],
				label: 'Nov',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}, {
				backgroundColor: this.transparentize(presets.green),
				borderColor: presets.blue,
				data: [],
				label: 'Dec',
				yAxisID: 'y-axis-1',
				fill: 'origin'
			}]
		};

		var option2axesstacked = {
			maintainAspectRatio: false,
			spanGaps: false,
			elements: {
				line: {
					tension: 0.4
				}
			},
			scales: {
				yAxes: [{
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'right',
					id: 'y-axis-1',
					stacked: true
				}, {
					type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
					display: true,
					position: 'left',
					id: 'y-axis-2',
                    ticks: {
                        beginAtZero: true
                    },
					gridLines: {
						drawOnChartArea: false
					}
				}]
			}
		};
		var chart7 = this.chart7 = new Chart('chart-7', {
			type: 'line',
			data: summarydata,
			options: option2axesstacked
		});

		console.log("charts built");
	},


	processIntervalAvg:function(json) {
		if (json == null || !Array.isArray(json))
		{
			console.error('Last polled json response had an error.');
			return false;
		}
		if(!this.isDomReady()) 
		{
			console.error(this.name + 'DOM not ready for .processIntervalAvg');
			return false;
		}
		const gauge = this.gaugechart;
		const bars = this.barschart;
		//const chart1 = window.chart1;
		//const chart2 = window.chart2;
		const chart3 = this.chart3;
		const chart4 = this.chart4;
		//const chart5 = window.chart5;
		
		//detect change
		json.sort(function (a, b) { if (a == b) return 0; if (a == null) return -1; if (b == null) return 1; var diff = Date.parse(a.timestamp) - Date.parse(b.timestamp); return diff < 0 ? -1 : diff > 0 ? 1 : 0 });

		//update ChartJs
		var converter = new this.SessionStatefulConverter();
		chart3.data.labels = this.selectWhere(json, "timestamp", converter.toAbbrDateString, null);
		chart3.data.x = this.selectWhere(json, "timestamp", Date.parse, null); //not documented, but added ad-hoc
		chart3.data.datasets[0].data = this.selectWhere(json, "battery_ma", null, null);
		chart3.data.datasets[1].data = this.selectWhere(json, "solar_ma", null, null);
		chart3.update();

		chart4.data.labels = chart3.data.labels;
		chart4.data.datasets[0].data = this.selectWhere(json, "system_mv", null, null);
		//chart4.data.datasets[1].data = this.selectWhere(json, "solar_mv", null, null);
		chart4.data.datasets[1].data = this.selectWhere(json, "est_available_mah", null, null);
		chart4.data.datasets[2].data = this.selectWhere(json, "max_mah", null, null);
		chart4.update();
		
		//update ChartJs
		var last = json[json.length-1];
		var first = json[1];
		var graphhours = (Date.parse(last.timestamp) - Date.parse(first.timestamp))/(60*60*1000);
		var graphavgamps = json.reduce((a,b) => b==null ? a : a + b.battery_ma, 0)/json.length;
		var totalmah = Math.round(graphhours*graphavgamps);
		
		//document.getElementById("mah24").innerHTML = totalmah;
		//document.getElementById("ma24").innerHTML = Math.round(last.battery_ma - first.battery_ma);
		//document.getElementById("dmv24").innerHTML = Math.round(last.system_mv - first.system_mv);
		//document.getElementById("mv24").innerHTML = Math.round(first.system_mv) ;
		//document.getElementById("dmah24").innerHTML = Math.round(last.est_available_mah - first.est_available_mah);
		//document.getElementById("infobox2").style.top = first.est_available_mah>50000 ? 630 : 530;
		this.mah24.innerHTML = totalmah;
		this.ma24.innerHTML = Math.round(last.battery_ma - first.battery_ma);
		this.dmv24.innerHTML = Math.round(last.system_mv - first.system_mv);
		this.mv24.innerHTML = Math.round(first.system_mv) ;
		this.dmah24.innerHTML = Math.round(last.est_available_mah - first.est_available_mah);
		this.infobox2.style.top = first.est_available_mah>50000 ? 630 : 530;
		var vmax = 0;
		var vmin = 50000;
		for(var i=1; i<json.length-1; i++) {
			vmax = Math.max(vmax, json[i].system_mv);
			vmin = Math.min(vmin, json[i].system_mv);
		}
		//document.getElementById("mvlow").innerHTML = Math.round(vmin);
		//document.getElementById("mvhigh").innerHTML = Math.round(vmax);
		this.mvlow.innerHTML = Math.round(vmin);
		this.mvhigh.innerHTML = Math.round(vmax);
		this.infobox1.style.display="block";
		this.infobox2.style.display="block";

		gauge.data.datasets[0].data[0] = last.battery_ma>=0 ? last.battery_ma : 0;
		gauge.data.datasets[0].data[1] = 20000-Math.abs(last.battery_ma);
		gauge.data.datasets[0].data[2] = last.battery_ma<0 ? -last.battery_ma : 0;
		gauge.data.datasets[1].data[0] = last.solar_ma;
		gauge.data.datasets[1].data[1] = 20000-last.solar_ma;
		var spac = Math.max(  (""+Math.round(last.solar_ma/100)/10).length,  (""+Math.round(last.battery_ma/100)/10).length);
		gauge.options.elements.center.text = "\u2600\xa0"+(Math.round(last.solar_ma/100)/10+"A").padEnd(1+spac,'\xa0') + " \u26a1" + (Math.round(last.battery_ma/100)/10 + "A").padEnd(1+spac,'\xa0');
		gauge.update();

		bars.data.datasets[0].bydata[0] = Math.round(last.est_available_mah/100)/10+"/"+Math.round(last.max_mah/1000)+"Ah";
		bars.data.datasets[0].data[0] = 1000*last.est_available_mah/last.max_mah;
		bars.data.datasets[4].data[0] = 1000-(1000*last.est_available_mah/last.max_mah);

		bars.data.datasets[0].bydata[1] = Math.round(last.system_mv/100)/10+"V";
		bars.data.datasets[1].data[1] = 1000*(last.system_mv-10000)/5000; //10v to 15v
		bars.data.datasets[4].data[1] = 1000-(1000*(last.system_mv-10000)/5000);

		bars.data.datasets[0].bydata[2] = Math.round(last.solar_mw/1000) + "W";
		bars.data.datasets[2].data[2] = 1000*last.solar_mw/300000; //0 - 300W
		bars.data.datasets[4].data[2] = 1000-(1000*last.solar_mw/300000);

		bars.data.datasets[0].bydata[3] = Math.round(Math.max(0,last.battery_ma-last.solar_ma)/100)/10+"A"; //0-30A
		bars.data.datasets[3].data[3] = 1000*Math.max(0,last.battery_ma-last.solar_ma)/30;
		bars.data.datasets[4].data[3] = 1000-(1000*Math.max(0,last.battery_ma-last.solar_ma)/30);
		bars.update();

		// last x-axis label, is as-of-date
		//document.getElementById("loaddatetime").innerHTML = chart1.data.labels[chart1.data.labels.length-1];
		this.loadtimespan.innerHTML = chart3.data.labels[chart3.data.labels.length-1];
	},
	process30dayHistory:function(json) {
		if (json == null || !Array.isArray(json))
		{
			console.error('Last polled json response had an error.');
			return false;
		}
		if(!this.isDomReady()) 
		{
			console.error(this.name + 'DOM not ready for .process30dayHistory');
			return false;
		}
		if(!this.canvas5) 
		{
			console.error(this.name + '30d mode probably not enabled');
			return false;
		}
		const chart5 = this.chart5;
		const chart6 = this.chart6;
			
		//detect change
		json.sort(function (a, b) { if (a == b) return 0; if (a == null) return -1; if (b == null) return 1; var diff = Date.parse(a.timestamp) - Date.parse(b.timestamp); return diff < 0 ? -1 : diff > 0 ? 1 : 0 });

		//update ChartJs
		var converter = new this.SessionStatefulConverter();
		chart5.data.labels = this.selectWhere(json, "timestamp", converter.toMidnightString, null);
		chart5.data.x = this.selectWhere(json, "timestamp", Date.parse, null); //not documented, but added ad-hoc
		chart5.data.datasets[0].data = this.selectWhere(json, "battery_ma", null, null);
		chart5.data.datasets[1].data = this.selectWhere(json, "solar_ma", null, null);

		chart5.update();

		chart6.data.labels = chart5.data.labels;
		chart6.data.datasets[0].data = this.selectWhere(json, "system_mv", null, null);
		//chart6.data.datasets[1].data = this.selectWhere(json, "solar_mv", null, null);
		chart6.data.datasets[1].data = this.selectWhere(json, "est_available_mah", null, null);
		chart6.data.datasets[2].data = this.selectWhere(json, "max_mah", null, null);
		chart6.update();
            

		//document.getElementById("loaddatetime").innerHTML = chart1.data.labels[chart1.data.labels.length-1];
		//this.loaddatetime.innerHTML = chart1.data.labels[chart1.data.labels.length-1];
	},
	processHourlyAh:function(json) {
		if (json == null || !Array.isArray(json)) {
			console.error('Last polled json response had an error.');
			return false;
		}
		if(!this.isDomReady()) 
		{
			console.error(this.name + 'DOM not ready for .processHourlyAh');
			return false;
		}
		if(!this.canvas7) 
		{
			console.error(this.name + '1yr mode probably not enabled');
			return false;
		}
		const chart7 = this.chart7;
		const mo_abbr = [null,"Jan(1)","Feb(2)","Mar(3)","Apr(4)","May(5)","Jun(6)","Jul(7)","Aug(8)","Sep(9)","Oct(10)","Nov(11)","Dec(12)"];

		//update ChartJs
		var overall = json; //[0];

		// the daily solar output for each month
		chart7.data.labels = ["12midnight","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a","12noon", "1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];//Array.from(overall, (v,i) => overall[i]==null ? i+"UTC" : v.hour_local );
		chart7.data.datasets[0].data = Array.from(json[0], (v,i) => v==null ? 0 : v.mah_avg );
		for(var m=1; m<=12;m++)
			chart7.data.datasets[m].data =  json[m-1].data; //Array.from(json[m], (v,i) => v==null ? 0 : v.solar_mah_avg );
		chart7.update();
		
		//document.getElementById("mahdaily").innerHTML = Math.round(json.reduce((o,n)=>o==null ? n : n==null ? o : o+n.mah_total) / json.reduce((o,n)=> o==null ? n : n==null ? o : o+n.sample_count));
		this.mahdaily.innerHTML = Math.round(json.reduce((o,n)=>o==null ? n : n==null ? o : o+n.mah_total) / json.reduce((o,n)=> o==null ? n : n==null ? o : o+n.sample_count));
	},



	////////////////////////////////
	// data manipulation functions
	////////////////////////////////
	selectWhere:function(objarray, fieldname, castfn, where) {
		var count = 0;
		var len = objarray.length;
		var values = new Array();
		for (var i = 0; i < len; i++) {
			var record = objarray[i];
			if(record!=null)
			if (where==null || where(record)) {
				var text = record[fieldname];
				var value = castfn == null ? text : castfn(text);
				if (castfn == null || value!=undefined) {
					values[count] = value;
					count++;
				}
			}
		}
		return values;
	},
	sortSelectWhere:function(objarray, compare, fieldname, castfn, where) {
		var count = 0;
		var len = objarray.length;
		if (compare != null)
			objarray.sort(compare);

		var values = new Array();
		for (var i = 0; i < len; i++) {
			var record = objarray[i];
			if (record != null)
				if (where == null || where(record)) {
					var text = record[fieldname];
					var value = castfn == null ? text : castfn(text);
					if (castfn == null || value!=undefined) {
						values[count] = value;
						count++;
					}
				}
			}
		return values;
	},
	selectOne:function(objarray, where) {
		var count = 0;
		var len = objarray.length;
		for (var i = 0; i < len; i++) {
			var record = objarray[i];
			if (record != null)
				if (where == null || where(record)) {
					return record;
				}
		}
		return value;
	},
	leastsqrregression:function(listxy) {
		var sumx=0;
		var sumx2=0;
		var sumxy=0;
		var sumy=0;
		var sumy2=0;
		var n=0;
		var len = listxy.length;
		for(var i=0; i<len; i++) {
			var pt = listxy[i];
			if(pt!=null) {
				sumx+=pt.x;
				sumx2+=Math.pow(pt.x,2);
				sumxy+=pt.x*pt.y;
				sumy+=pt.y;
				sumy2+=Math.pow(pt.y,2);
				n++;
			}
		}

		var denom = n * sumx2 -Math.pow(sumx,2);
		if(denom==0)
			return null;
		
		var m = (n*sumxy - sumx*sumy)/denom;
		var multiple = Math.min(32000/m,32000);
		var mN = Math.round(m*multiple);
		var mD = Math.round(multiple);
		var intercept = (sumy*sumx2 - sumx*sumxy)/denom;
		return new ymxb(mN,mD,intercept,n); //line equation in algebra is y=mx+b
	},
	xy:function(x,y) {
		this.x = x;
		this.y = y;
		//return { "x":x, "y":y };
	},
	ymxb:function(mN,mD,b,n){
		this.mN = mN;
		this.mD = mD;
		this.b = b;
		this.n = n;
		this.f = function(x){
			return new xy(x, this.mN*x/this.mD + this.b);
		}
		this.inv = function(y){
			//y=mx+b, (y-b)/m = x
			return new xy((y- this.b)*this.mD/this.mN, y);
		}
		//return this;
	},
	// https://www.phpied.com/3-ways-to-define-a-javascript-class/
	SessionStatefulConverter:function() {
		const self=this;
		this.prevDateTokens = null;

		this.toAbbrDateString = function (fullstring) {

			var tokens = fullstring.split(" ");
			if (self.prevDateTokens == null) {
				self.prevDateTokens = tokens;
				return tokens[0];
			}
			var len = Math.min(tokens.length, self.prevDateTokens.length);
			for (var i = 0; i < len; i++) {
				if (self.prevDateTokens[i] != tokens[i]) {
					self.prevDateTokens = tokens;
					return tokens[i];
				}
			}
			self.prevDateTokens = tokens;
			return "";
		}
		this.toMidnightString = function(value) {
			const parsed = Date.parse(value);
			if(!isNaN(parsed)) {
				var date = new Date(parsed);
				return date.getMonth()+"/"+date.getDate();
			} else
				return "";
		}
	},





	////////////////////////////////
	// least regression from another program
	////////////////////////////////
	getDatasets: function(xArray,yArray) {
		var results = [];
		var dataset = {x:[],y:[]};
		const len = xArray.length;
		for(var i=0; i<len; i++) {
			if(i!=0 && yArray[i]>yArray[i-1]) {
				if(dataset.y.length>3)
					results.push(dataset);
				dataset = {x:[],y:[]};
			}
			dataset.x.push(xArray[i]);
			dataset.y.push(yArray[i]);
		}
		if(dataset.y.length>3)
			results.push(dataset);
		return results;
	},

	// https://www.w3schools.com/ai/ai_regressions.asp
	getRegression: function(xArray,yArray) {
		//const xArray = [50,60,70,80,90,100,110,120,130,140,150];
		//const yArray = [7,8,8,9,9,9,10,11,14,14,15];
		console.log(xArray);
		console.log(yArray);

		// Calculate Sums
		let xSum=0, ySum=0 , xxSum=0, xySum=0;
		let count = xArray.length;
		for (let i = 0, len = count; i < count; i++) {
			xSum += xArray[i];
			ySum += yArray[i];
			xxSum += xArray[i] * xArray[i];
			xySum += xArray[i] * yArray[i];
		}

		// Calculate slope and intercept
		let slope = (count * xySum - xSum * ySum) / (count * xxSum - xSum * xSum);
		let intercept = (ySum / count) - (slope * xSum) / count;

		return {m: slope, b:intercept, n:count, maxX:Math.max(...xArray), minX:Math.min(...xArray)};

		/*
		// Generate values
		var i=Math.max(...xArray);
		console.log(new Date(i+step));
		console.log(new Date(extra));

		const xValues = [];
		const yValues = [];
		for (let x = i+step; x < extra; x += step) {
			xValues.push(x);
			yValues.push(x * slope + intercept);
		}

		return {m: slope, b:intercept, x:xValues, y:yValues};
		*/
	},

	getProjection: function(equation,extra,step, filter) {
		const slope = equation.m;
		const intercept = equation.b;
		// Generate values
		var i = equation.maxX;
		console.log(new Date(i+step));
		console.log(new Date(extra));

		const xValues = [];
		const yValues = [];
		for (let x = i+step; x < extra; x += step) {
			if(filter)
				if(filter(x,x * slope + intercept))
					continue;
			xValues.push(x);
			yValues.push(x * slope + intercept);
			console.log(new Date(x));
			console.log(x * slope + intercept);
		}

		return {m: slope, b:intercept, x:xValues, y:yValues};
	},

});
