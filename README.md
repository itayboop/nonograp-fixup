# monograp-fixup

First, lets check if we can recompile the app without problems...
A usual usage of apktool & buildapp (thanks mon231) will generate a new working apk. how fun!

so lets start researching on how we can remove ads from nonogram

Now, we want to use frida to dynamically research the app, so lets try to inject frida gadget to it.

for some reason, after using `apktool d`, we cannot seem to find any static constructor, even though we saw it in jadx, therefore we locate the main activity and create a static constructor at the top of the file and inject this

```smali
    const-string v0, "frida-gadget"
    invoke-static {v0}, Ljava/lang/System;->loadLibrary(Ljava/lang/String;)V
```

it succeeded and now we have an apk with frida gadget embed in it and we can freely research the app.
