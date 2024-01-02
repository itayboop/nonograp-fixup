function awaitForCondition(callback) {
	var i = setInterval(function () {
	  var addr = Module.findBaseAddress('libil2cpp.so');
	  if (addr) {
			clearInterval(i);
			callback(+addr);
		}
	}, 0);
}

Java.perform(function () {
	awaitForCondition(function (base) {
		const libil2cpp_base = ptr(base);
		const AddHintsRVA = 0xF47A38;
		const RemoveHintsRVA = 0xF47A5C;
		const GameplayDataControllerCTOR = 0xF47DC8;
		const get_IsAdsEnabled = 0x123C904;

		const get_HintCount = new NativeFunction(libil2cpp_base.add(0xFA5694), 'int', ['pointer']);
		const set_HintCount = new NativeFunction(libil2cpp_base.add(0xFA5694), 'void', ['pointer', 'int']);
		const set_CurrentState = new NativeFunction(libil2cpp_base.add(0xFA568C), 'void', ['pointer', 'int']);
		const AddHints = new NativeFunction(libil2cpp_base.add(AddHintsRVA), 'void', ['pointer', 'int']);
		const Controller_get_HintsCount = new NativeFunction(libil2cpp_base.add(0xF478F4), 'int', ['pointer']);

		// apply "Remove Ads"
		Interceptor.attach(libil2cpp_base.add(get_IsAdsEnabled), {
			onLeave(retval) {
				retval.replace(0x0);
			}
		});
		
		// using hint will not decrease hints count
		Interceptor.replace(
			libil2cpp_base.add(RemoveHintsRVA), 
			new NativeCallback((this_addr, count_to_remove) => {}, 'void', ['pointer', 'int'])
		);

		// make sure we have at least 1 hint every time
		Interceptor.attach(libil2cpp_base.add(GameplayDataControllerCTOR), {
			onEnter(args) {
				this.addr = args[0];
			},
			onLeave(retval) {
				AddHints(this.addr, 0x1)
			}
		});
	})
})
