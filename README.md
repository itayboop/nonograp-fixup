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
// Namespace: Easybrain.Nonogram.Scripts.Store
public class ProductInfoType // TypeDefIndex: 2075
{
	// Fields
	public const string StarterPack = "StarterPack";
	public const string BankPack = "BankPack";
	public const string RemoveAds = "RemoveAds";
	public const string NBO = "NBO";

	// Methods

	// RVA: 0x1DD273C Offset: 0x1DD273C VA: 0x1DD273C
	public void .ctor() { }
}
```

IMO, going for the 3rd vector and trying to get `RemoveAds` is the best. so lets try it out.

## Getting RemoveAds bundle

if we take a look at this class:

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

maybe if we can make
```C#
public bool get_RemoveAds() { }
```

always return true...
