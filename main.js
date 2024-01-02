function awaitForCondition(callback) {
    var i = setInterval(function () {
      var addr = Module.findBaseAddress('libil2cpp.so');
	  if (addr) {
            clearInterval(i);
            callback(+addr);
        }
    }, 0);
}

var libil2cpp_base = null;

/*
 0xFA5694
	public int get_HintCount

	0xFA56A4 - ctor

	private void set_HintCount(int value) { }
	new NativeFunction(libil2cpp_base.add(0xFA5694), 'void', ['int'])


	0xFA568C
	private void set_CurrentState(HintButtonState


	0xFA5694
	public int get_HintCount

	0xFA5AF8
	private void Update


	// RVA: 0xFA6A8C Offset: 0xFA6A8C VA: 0xFA6A8C Slot: 4
	public int get_HintsCount() { }

	0xFA6CC0
	private void OnHintsCountChanged(int newCount, int change) { }

	0xF47A38
	private void AddHints(int count) { }

	 0xF478F4
	public int get_HintsCount() { }
	*/

Java.perform(function () {
    awaitForCondition(function (base) {
        libil2cpp_base = ptr(base);
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

		// Interceptor.attach(libil2cpp_base.add(0xF47A5C), {
		// 	onEnter(args) {
		// 		this.addr = args[0];
		// 		args[1] = ptr(0);
		// 		console.log("removed: " + args[1]);
		// 	},
		// 	onLeave(retval) {
		// 	}
		// });


		// Interceptor.attach(libil2cpp_base.add(0xFA6CC0), {
		// 	onEnter: function (args) {
		// 		args[1] = ptr(0x123);
		// 	},
		// 	onLeave(retval) {
		// 		console.log('sheesh')
		// 	}
		// });

		// Interceptor.attach(libil2cpp_base.add(0xFA6A8C), {
		// 	onEnter: function (args) {
		// 		this.addr = args[0];
		// 		console.log('called inher')
		// 	},
		// 	onLeave(retval) {
		// 		retval.replace(0x123);
		// 	}
		// });


		// Interceptor.attach(libil2cpp_base.add(0xFA5AF8), {
		// 	onEnter: function (args) {
		// 		this.addr = args[0];
		// 		console.log('Update called')
		// 	},
		// 	onLeave(reval) {
		// 		console.log('original hint count:', get_HintCount(this.addr));

		// 		set_CurrentState(this.addr, 0);
		// 		set_HintCount(this.addr, 0x123);
		// 	}
		// });



		// Interceptor.attach(libil2cpp_base.add(0xFA56A4), {
		// 	onEnter: function (args) {
		// 		this.addr = args[0];
		// 		this.settings = args[1];
		// 	},
		// 	onLeave(reval) {
		// 		// reval.replace(0x123);
		// 		console.log('post ctor', this.addr);
		// 		// set_HintCount(this.addr, 0x123);
		// 		set_CurrentState(this.addr, 0);
		// 		console.log('post patch');
		// 	}
		// });
	})
})
