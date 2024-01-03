# nonograp-fixup

## Setting up frida with frida-gadget

First, lets check if we can recompile the app without problems...
A usual usage of [`apkmod`](https://github.com/mon231/apkpatcher) & buildapp (thanks mon231) will generate a new working apk. how fun!

so lets start researching on how we can remove ads from nonogram

Now, we want to use frida to dynamically research the app, so lets try to inject frida gadget to it.

for some reason, after using `apktool d`, we cannot seem to find any static constructor, even though we saw it in jadx, therefore we locate the main activity and create a static constructor at the top of the file and inject this

```
    const-string v0, "frida-gadget"
    invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
```

it succeeded and now we have an apk with frida gadget embed in it and we can freely research the app.

## il2CppDumper

it is a unity app. so we will use a wonderful tool: [`il2CppDumper`](https://github.com/Perfare/Il2CppDumper).

we run `Il2CppDumper.exe libil2cpp.so global-metadata.dat cppDumperResult`. (`global-metadata.bat` can be found under `original_nonogram_apkpure/assets/bin/managed/Metadata`).

we get a lot of intresting dump in `cppDumperResult`.

for example, this C# code:

```C#
// Namespace: Easybrain.Nonogram.Scripts.Ads
public class NonoAdsManager : AdsManager // TypeDefIndex: 3377
{
    ...
	// Properties
	public bool IsAdsEnabled { get; set; }

	// Methods

	[CompilerGenerated]
	// RVA: 0x123C9DC Offset: 0x123C9DC VA: 0x123C9DC
	public void add_AdsEnabledChanged(Action<bool> value) { }

	[CompilerGenerated]
	// RVA: 0x123CB14 Offset: 0x123CB14 VA: 0x123CB14
	public void remove_AdsEnabledChanged(Action<bool> value) { }

	// RVA: 0x123C904 Offset: 0x123C904 VA: 0x123C904
	public bool get_IsAdsEnabled() { }

	// RVA: 0x123CDB0 Offset: 0x123CDB0 VA: 0x123CDB0
	public void set_IsAdsEnabled(bool value) { }
    
    ...
}
```

or this:
```C#
// Namespace: Easybrain.Ads
public enum AdState // TypeDefIndex: 10198
{
	// Fields
	public int value__; // 0x0
	public const AdState noads = 0;
	public const AdState showing = 1;
	public const AdState shown = 2;
	public const AdState cached = 3;
	public const AdState clicked = 4;
	public const AdState completed = 5;
	public const AdState closed = 6;
	public const AdState idle = 7;
}
```

or this...:

```C#
// Namespace: Easybrain.Nonogram.Scripts.Features.InApp
[Serializable]
public class InAppBankItem // TypeDefIndex: 2467
{
	// Fields
	[SerializeField]
	protected int _coins; // 0x10
	[SerializeField]
	protected InAppBankItem.MarkerType _marker; // 0x14
	[SerializeField]
	protected bool _ads; // 0x18
	[SerializeField]
	protected InAppBankItem.InAppName _name; // 0x1C

	// Properties
	public int Coins { get; }
	public InAppBankItem.MarkerType Marker { get; }
	public bool RemoveAds { get; set; }
	public InAppBankItem.InAppName Name { get; }

	// Methods

    ...
	// RVA: 0x1F27250 Offset: 0x1F27250 VA: 0x1F27250
	public bool get_RemoveAds() { }

	// RVA: 0x1F27258 Offset: 0x1F27258 VA: 0x1F27258
	public void set_RemoveAds(bool value) { }
    ...
}
```

IMO, going for the 3rd vector and trying to get `RemoveAds` "bundle" is the best. so lets try it out.

## Getting RemoveAds bundle

maybe if we can make
```C#
public bool get_RemoveAds() { }
```

always return true...

looking a bit into the dumped C# code, we see the `SetRemoveAdsActive` function. with this following frida code:

```js
function awaitForCondition(callback) {
    var i = setInterval(function () {
      var addr = Module.findBaseAddress('libil2cpp.so');
	  if (addr) {
			console.log("found adress: " + addr)
            clearInterval(i);
            callback(+addr);
        }
    }, 0);
}

var libil2cpp_base = null;
// SetRemoveAdsActive 0xB37CBC
Java.perform(function () {
    awaitForCondition(function (base) {
        libil2cpp_base = ptr(base);

		Interceptor.attach(libil2cpp_base.add(0xB37CBC), {
			onEnter: function (args) {
				args[1] = ptr(0x0);
				console.log("SetRemoveAdsActive")
			}
		});
	})
})
```

that way, we patch `SetRemoveAdsActive` arg to get the boolean variable that determines if the button should be shown,
and we see that it actually works and the Remove Ads button isnt shown. A cool approach should be to check the flow of the program to see who calls `SetRemoveAdsActive` with false parameter and try to emulate the behavior. We could do that with ida by loading symbols and checking xrefs but we need a time (and idapython lol) which we don't have at the moment.

we kind of "satinu me'adereh" and we patched it to have infinite guesses in the app. the following code does that:

```js
Java.perform(function () {
    awaitForCondition(function (base) {
        libil2cpp_base = ptr(base);
		const AddHintsRVA = 0xF47A38;
		const GameplayDataControllerCTOR = 0xF47DC8;

		const get_HintCount = new NativeFunction(libil2cpp_base.add(0xFA5694), 'int', ['pointer']);
		const set_HintCount = new NativeFunction(libil2cpp_base.add(0xFA5694), 'void', ['pointer', 'int']);
		const set_CurrentState = new NativeFunction(libil2cpp_base.add(0xFA568C), 'void', ['pointer', 'int']);
		const AddHints = new NativeFunction(libil2cpp_base.add(AddHintsRVA), 'void', ['pointer', 'int']);

		Interceptor.attach(libil2cpp_base.add(GameplayDataControllerCTOR), {
			onEnter(args) {
				this.addr = args[0];
				console.log(this.addr);
			},
			onLeave(retval) {
				AddHints(this.addr, 0x123);
			}
		});

	})
})
```

we created `addHints`, called the constructor, got its address and stored it in `this.addr` so we can call `AddHints` with the
instance of the class we are using, and added as much as hints as we wanted. <br />
Just for fun, we created another hook, to have infinite count of hints (note that it requires having more than 0 hints at first place)

```js
awaitForCondition(function (base) {
	const libil2cpp_base = ptr(base);
	const RemoveHintsRVA = 0xF47A5C;

	Interceptor.replace(
		libil2cpp_base.add(RemoveHintsRVA), 
		new NativeCallback((this_addr, count_to_remove) => {}, 'void', ['pointer', 'int'])
	);
});
```

Then we did the final hook, remove ads from the app:
```js
awaitForCondition(function (base) {
	const libil2cpp_base = ptr(base);
	const get_IsAdsEnabled = 0x123C904;

	Interceptor.attach(libil2cpp_base.add(get_IsAdsEnabled), {
		onLeave(retval) {
			retval.replace(0x0);
		}
	});
});
```

In order to be more cool, we created a complete script which contains both no-ads logic and infinite-hints (we add 1 hint in each constructor call to make sure we never, somehow gets down to 0, even tho using a hint will never decrease):

```js
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
```

we will use objection in order to inject the script with the frida gadget (since for some reason apkmod does not work...):
`objection patchapk --source .\original_nonogram.apk -l .\main.js --gadget-config .\config.json`

results in a patched, pwned APK. 
