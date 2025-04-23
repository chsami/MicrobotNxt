// player_struct_analysis.js
// Script to analyze and dump the LocalPlayerPtr structure

// Base address of the module
const moduleBase = Process.getModuleByName('osclient.exe').base;

// Client object pointer (static)
const CLIENT_OBJECT_OFFSET = 0xC27F20;
const clientObjectPtr = moduleBase.add(CLIENT_OBJECT_OFFSET).readPointer();

console.log("[+] Client object located at:", clientObjectPtr);

// Local player offsets from your provided info
const LOCAL_PLAYER_INDEX_OFFSET = 0x6F4D0;
const LOCAL_PLAYER_PTR_OFFSET = 0x6F510;
const PLAYER_X_POS_OFFSET = 0x20;
const PLAYER_Y_POS_OFFSET = 0x24;

// Get the local player pointer
const localPlayerPtr = clientObjectPtr.add(LOCAL_PLAYER_PTR_OFFSET).readPointer();
console.log("[+] Local player pointer:", localPlayerPtr);

if (localPlayerPtr.isNull()) {
    console.log("[!] Local player pointer is null. Are you logged in?");
    // Exit if player pointer is null
} else {
    // Dump the player structure memory for analysis
    console.log("\n[+] Dumping LocalPlayer structure memory (first 512 bytes):");
    console.log(hexdump(localPlayerPtr, { length: 512 }));

    // Try to identify and parse common structure fields
    const knownFields = [
        { offset: 0x20, name: "X Position", type: "int" },
        { offset: 0x24, name: "Y Position", type: "int" },
        // Let's try some common fields based on typical game structures
        { offset: 0x00, name: "Entity Type/ID", type: "int" },
        { offset: 0x04, name: "Potential Flag/Status", type: "int" },
        { offset: 0x08, name: "Potential Pointer", type: "pointer" },
        { offset: 0x0C, name: "Potential Value 1", type: "int" },
        { offset: 0x10, name: "Potential Value 2", type: "int" },
        { offset: 0x14, name: "Potential Value 3", type: "int" },
        { offset: 0x18, name: "Potential Value 4", type: "int" },
        { offset: 0x1C, name: "Potential Value 5", type: "int" },
        { offset: 0x28, name: "Potential Z Position", type: "int" },
        { offset: 0x2C, name: "Potential Rotation/Angle", type: "int" },
        { offset: 0x30, name: "Potential Animation ID", type: "int" },
        { offset: 0x34, name: "Potential Action State", type: "int" },
        { offset: 0x38, name: "Potential Health", type: "int" },
        { offset: 0x3C, name: "Potential Max Health", type: "int" },
        { offset: 0x40, name: "Potential Combat Level", type: "int" },
        { offset: 0x44, name: "Potential Player Flag", type: "int" },
        { offset: 0x48, name: "Potential Model ID", type: "int" }
        // Add more potential fields to check
    ];

    console.log("\n[+] Analyzing potential LocalPlayer fields:");
    console.log("    %-25s %-10s %-20s", "Field Name", "Offset", "Value");
    console.log("    " + "-".repeat(60));

    knownFields.forEach(field => {
        let value;

        switch(field.type) {
            case "int":
                value = localPlayerPtr.add(field.offset).readInt();
                break;
            case "short":
                value = localPlayerPtr.add(field.offset).readShort();
                break;
            case "byte":
                value = localPlayerPtr.add(field.offset).readU8();
                break;
            case "float":
                value = localPlayerPtr.add(field.offset).readFloat();
                break;
            case "pointer":
                try {
                    const ptrValue = localPlayerPtr.add(field.offset).readPointer();
                    value = ptrValue.toString() + (ptrValue.isNull() ? " (NULL)" : "");
                } catch (e) {
                    value = "Invalid pointer";
                }
                break;
            default:
                value = "Unknown type";
        }

        console.log(`    %-25s 0x%-8X %s`, field.name, field.offset, value);
    });

    // Attempt to detect potential pointers in the structure
    console.log("\n[+] Scanning for additional pointers in structure...");
    for (let i = 0; i < 512; i += 4) {
        try {
            const potentialPtr = localPlayerPtr.add(i).readPointer();

            // Check if this could be a valid pointer (non-null and pointing to readable memory)
            if (!potentialPtr.isNull()) {
                try {
                    // Try to read a byte from the address to verify it's valid
                    Memory.readU8(potentialPtr);
                    console.log(`    Potential pointer at offset 0x${i.toString(16).padStart(2, '0')}: ${potentialPtr}`);

                    // Peek at the first few bytes of what this points to
                    console.log(`    > First 16 bytes at ${potentialPtr}:`);
                    console.log(`      ${hexdump(potentialPtr, { length: 16, header: false }).split('\n')[0]}`);
                } catch (e) {
                    // Not a valid readable pointer, ignore
                }
            }
        } catch (e) {
            // Skip invalid memory reads
        }
    }

    // Check for string-like data
    console.log("\n[+] Scanning for potential string data...");
    for (let i = 0; i < 512; i += 4) {
        try {
            // Try to read a potential string pointer
            const potentialStrPtr = localPlayerPtr.add(i).readPointer();

            if (!potentialStrPtr.isNull()) {
                try {
                    // Check if it points to a printable ASCII string
                    const str = potentialStrPtr.readCString();
                    if (str && str.length > 2 && /^[\x20-\x7E]+$/.test(str)) {
                        console.log(`    Potential string at offset 0x${i.toString(16).padStart(2, '0')}: "${str}"`);
                    }
                } catch (e) {
                    // Not a valid string pointer, ignore
                }
            }
        } catch (e) {
            // Skip invalid memory reads
        }
    }

    // Try to detect arrays or repeated patterns
    console.log("\n[+] Looking for array patterns...");
    const bytes = Memory.readByteArray(localPlayerPtr, 512);
    const u8arr = new Uint8Array(bytes);
    const u32arr = new Uint32Array(bytes.buffer);

    for (let i = 0; i < u32arr.length - 4; i++) {
        // Check for sequential integers (possible array indices)
        if (u32arr[i] + 1 === u32arr[i+1] &&
            u32arr[i+1] + 1 === u32arr[i+2] &&
            u32arr[i+2] + 1 === u32arr[i+3]) {
            console.log(`    Potential array indices at offset 0x${(i*4).toString(16).padStart(2, '0')}: ${u32arr[i]}, ${u32arr[i+1]}, ${u32arr[i+2]}, ${u32arr[i+3]}`);
        }

        // Check for repeated patterns (possible array of structs)
        if (u32arr[i] !== 0 && u32arr[i] === u32arr[i+2] && u32arr[i+1] === u32arr[i+3]) {
            console.log(`    Potential struct pattern at offset 0x${(i*4).toString(16).padStart(2, '0')}: Pattern [${u32arr[i]}, ${u32arr[i+1]}] repeats`);
        }
    }

    // Dynamic field investigation by monitoring changes
    console.log("\n[+] Setup dynamic field monitoring...");
    console.log("    Move your character in-game to help identify changing fields");

    // Array to store previous values for comparison
    let prevValues = [];
    for (let i = 0; i < 512/4; i++) {
        try {
            prevValues[i] = localPlayerPtr.add(i*4).readInt();
        } catch (e) {
            prevValues[i] = null;
        }
    }

    // Set up timer to check for changes periodically
    const timerId = setInterval(() => {
        let changesFound = false;

        for (let i = 0; i < 512/4; i++) {
            try {
                const currentValue = localPlayerPtr.add(i*4).readInt();

                // Skip null/invalid values
                if (prevValues[i] === null) {
                    prevValues[i] = currentValue;
                    continue;
                }

                // Check if value changed
                if (currentValue !== prevValues[i]) {
                    console.log(`    Field at offset 0x${(i*4).toString(16).padStart(2, '0')} changed: ${prevValues[i]} -> ${currentValue}`);
                    prevValues[i] = currentValue;
                    changesFound = true;
                }
            } catch (e) {
                // Skip invalid memory reads
            }
        }

        if (!changesFound) {
            //console.log("    No changes detected in this interval");
        }
    }, 500); // Check every 500ms

    console.log("\n[*] Monitoring player structure for 30 seconds...");
    console.log("    Move your character or perform actions to trigger field changes");

    // Stop monitoring after 30 seconds
    setTimeout(() => {
        clearInterval(timerId);
        console.log("\n[+] Field monitoring complete");
        console.log("[*] Analysis finished");
    }, 30000);

    // Additional function to drill down into a specific field if needed
    function inspectField(offset, length = 64) {
        const fieldPtr = localPlayerPtr.add(offset);
        console.log(`\n[+] Detailed inspection of field at offset 0x${offset.toString(16)}:`);
        console.log(hexdump(fieldPtr, { length: length }));

        // Try different interpretations of the data
        console.log("    As Int32:", fieldPtr.readInt());
        console.log("    As UInt32:", fieldPtr.readUInt());
        console.log("    As Float:", fieldPtr.readFloat());
        console.log("    As Double:", fieldPtr.readDouble());

        try {
            const ptrValue = fieldPtr.readPointer();
            console.log("    As Pointer:", ptrValue);
            if (!ptrValue.isNull()) {
                console.log("    > First 16 bytes at pointer:");
                console.log(`      ${hexdump(ptrValue, { length: 16, header: false }).split('\n')[0]}`);
            }
        } catch (e) {
            console.log("    As Pointer: Invalid");
        }
    }

    // Inspect a few critical fields in detail
    console.log("\n[+] Detailed inspection of key fields:");
    inspectField(0x00); // Entity ID/Type field
    inspectField(0x20); // X Position
    inspectField(0x24); // Y Position
}