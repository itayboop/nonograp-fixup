Java.perform(() => {
	let AdsPlugin = Java.use("com.easybrain.ads.unity.AdsPlugin");
	AdsPlugin["AdsInit"].implementation = function (str) {
		console.log(`AdsPlugin.AdsInit is called: str=${str}`);
		this["AdsInit"](str);
	};
})
