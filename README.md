# Microbot OSRS NXT Client Hooking Project

> **⚠️ This project is for educational purposes only.**  
> It is intended to help developers understand reverse engineering, runtime memory hooking, and interprocess communication using modern tools.


This project hooks into the **OSRS NXT client** (`osclient.exe`) using:

- **Frida** (runtime hooking)
- **C# Microbot Client**
- **Cheat Engine** (for address finding)
- **Ghidra** (for static analysis)

The goal is to extract in-game data and display it in the C# Debug UI.

---

## 🔧 Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/en-us/download)
- [Visual Studio](https://visualstudio.microsoft.com/) or [JetBrains Rider](https://www.jetbrains.com/rider/)
- [Cheat Engine](https://www.cheatengine.org/)  
  📺 [Tutorial](https://www.youtube.com/watch?v=aE6TJ3yao_0)
- [Ghidra](https://ghidra-sre.org/) – for reverse engineering the NXT binary
- [Frida](https://frida.re/) – for injecting JavaScript hooks
- [Node.js](https://nodejs.org/) – required for Frida's runtime

---

## 🚀 How to Run

1. Start **`osclient.exe`** (the NXT client).
2. Open the solution file (`.sln`) in Visual Studio or Rider.
3. Run the **Microbot Client** project.
4. On first run, it will do an automatic `npm install` (this may take a minute).
5. If `osclient.exe` is running, the Frida-based hook system will auto-attach.

---

## 🧠 How It Works

- The **C# Microbot Client** launches a debug UI and starts the **Frida** hook engine.
- Frida uses **pattern scanning** (sigscanning) to find function addresses.
- Hooks are injected at runtime and communicate back to the C# process using `process.OutputDataReceived`.

---

## 🪝 Example: Finding and Hooking Functions with Frida

```js
const mod = Process.getModuleByName('osclient.exe');
const x64base = ptr('0x140000000');

console.log(mod.base); // Example: rev 230 = 0x7ff6509a0000

// Function signature to scan
const entryPattern = '48 89 5c 24 10 48 89 4c 24 08 55 56 57 41 54 41 55 41 56 41 57 48 8d ac 24 00 fb';

scanMatch(entryPattern, (addressPointer) => {
    try {
        Interceptor.attach(addressPointer, {
            onEnter(args) {
                microbot.client = args[0]; // param_1
                microbot.playerIndex = microbot.client.add(0x6F4D0).readU32();
                microbot.playerList = microbot.client.add(0x6c80).add(0x2008).readPointer();
            }
        });
    } catch (err) {
        console.error(err.message); // alignment or parse error
    }
});
```

## 📂 Project Overview

| Component           | Description                                                             |
|---------------------|-------------------------------------------------------------------------|
| `MicrobotClient`    | C# project that starts the hook logic  + displays the UI with ImGUI.NET |
| `frida/`            | JavaScript hook definitions                                             |
| `npm` packages      | Automatically installed at first startup                                |
| `scanMatch`         | Helper for signature scanning in Frida                                  |
| `OutputDataReceived`| C# listener for Frida output                                            |
