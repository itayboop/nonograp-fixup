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
	// Fields
	private readonly UserProfileManager _userProfileManager; // 0x70
	private readonly IEasyUtils _easyUtils; // 0x78
	[CompilerGenerated]
	private Action<bool> AdsEnabledChanged; // 0x80

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

	// RVA: 0x1230200 Offset: 0x1230200 VA: 0x1230200
	public void .ctor(UserProfileManager userProfileManager, IEasyUtils easyUtils) { }

	// RVA: 0x123CE38 Offset: 0x123CE38 VA: 0x123CE38
	private void OnInitCompleted() { }

	// RVA: 0x123CDF0 Offset: 0x123CDF0 VA: 0x123CDF0
	private void OnAdsStatusChanged(bool isEnabled) { }

	// RVA: 0x123CFB4 Offset: 0x123CFB4 VA: 0x123CFB4
	private void UpdateAdsState(bool isEnabled) { }

	// RVA: 0x123D078 Offset: 0x123D078 VA: 0x123D078
	private void OnAdsStateChanged(AdState state) { }

	// RVA: 0x123D07C Offset: 0x123D07C VA: 0x123D07C
	private void OnCrossPromoStateChange(CrossPromoState state) { }

	// RVA: 0x123D080 Offset: 0x123D080 VA: 0x123D080
	public void RegisterUserAction() { }
}
```
