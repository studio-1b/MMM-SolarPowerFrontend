var NodeHelper = require('node_helper');
const http = require('http');
const https = require('https');
//const textToImage = require('text-to-image');

module.exports = NodeHelper.create({
	start: function () {
		console.log('MMM-SolarPowerFrontend helper started...');
	},


	//Subclass socketNotificationReceived received.
	socketNotificationReceived: function (notification, payload) {
		console.log(this.name + ' Received ' + notification);
		console.log(payload)
		if (notification === "MMM-SolarPowerFrontend_SET_CONFIG") {
			this.config = payload;
		} else if (notification === "MMM-SolarPowerFrontend_GET_24H") {
			this.fetch24h();
		} else if (notification === "MMM-SolarPowerFrontend_GET_30D") {
			this.fetch30d();
		} else if (notification === "MMM-SolarPowerFrontend_GET_12MO") {
			this.fetch12mo();
		}
		
	},


	fetch24h: function() {
		var self=this;
		var url=this.config.power_24h_url;

		this.fetchURL(url, json =>{
			self.data24h = json;
			self.sendSocketNotification('MMM-SolarPowerFrontend_DAY_RESULT', json);
		});

	},
	
	fetch30d: function() {
		var self=this;
		var url=this.config.power_30d_url;

		this.fetchURL(url, json =>{
			self.data30d = json;
			self.sendSocketNotification('MMM-SolarPowerFrontend_MONTH_RESULT', json);
		});

	},

	fetch12mo: function() {
		var self=this;
		var url=this.config.power_1yr_url;

		this.fetchURL(url, json =>{
			self.data12mo = json;
			self.sendSocketNotification('MMM-SolarPowerFrontend_MONTHLY_HOURLY_RESULT', json);
		});

	},

	fetchURL: function(url,callback) {
		var self=this;
		const cacheurl = new URL(url);
		const protocol = cacheurl.protocol.startsWith("https://") ? https : http ;
	
		protocol.get(url, res => {
				console.log("https callback handler for " + url);
				let data = [];
				const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
				res.on('data', chunk => {
				  data.push(chunk);
				});
				res.on('end', () => {
				  var html = ""+data.join('');
				  //console.log('Response ended: ' + html.substring(0,100));
				  console.log('Response ended: ' + html);
				  console.log('Response ended: ' + html.replace("\n","").replace("\r",""));
				  //console.log(html.indexOf('"status" : "OK"'));
				  if(html != "{\"data\": \"\"}") {
					var o=JSON.parse(html.replace("\n","").replace("\r",""));
					if(typeof o=="array")
						callback(o);
					else if('data' in o && Array.isArray(o.data))
						callback(o.data);
					else
						console.error(self.name + " did not receive expected value from:" + url);
				  }
				});
		}).on('error', err => {
		  console.log('Error: ', err.message);
		});
	},
	
});


