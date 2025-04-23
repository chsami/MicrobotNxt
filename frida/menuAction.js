//#region InvokeAction

const mod = Process.getModuleByName('osclient.exe');

// Define the address of VIBE_processEntity (you'll need to update this with the actual offset)
// Example: If your function is at 0x140099940 in the IDA/Ghidra, and module base is 0x140000000
// Then the offset would be 0x99940
const VIBE_PROCESS_ENTITY_OFFSET = 0x99DB0; // UPDATE THIS with your actual offset!
const VIBE_processEntity = mod.base.add(VIBE_PROCESS_ENTITY_OFFSET);

console.log("[+] OSRS Client base: " + mod.base);
console.log("[+] VIBE_processEntity function at: " + VIBE_processEntity);

// Attach an interceptor to the function
Interceptor.attach(VIBE_processEntity, {
    onEnter: function (args) {
        // Store arguments for use in onLeave
        this.clientInstance = args[0];
        this.menuX = args[1].toUInt32();  // Extract the lower 32 bits for X
        this.menuY = args[2].toUInt32();  // Extract the lower 32 bits for Y
        this.menuOpcode = args[3].toUInt32();
        this.menuIdentifier = args[4].toInt32();
        this.menuItemId = args[5].toInt32();
        this.menuAction = args[6];
        this.menuTarget = args[7];
        this.param9 = args[8].toUInt32();
        this.param10 = args[9].toInt32();
        this.worldViewId = args[10];


/*        for (let i = 0; i < 20; i++) {
            console.log(`    args[${i}]: ${args[i]} (${typeof args[i] !== 'undefined' ? args[i].toString() : 'undefined'})`);
        }*/

   /*     console.log('Client Instance:', this.clientInstance);
        console.log('Menu X:', this.menuX);
        console.log('Menu Y:', this.menuY);
        console.log('Menu Opcode:', this.menuOpcode);
        console.log('Menu Identifier:', this.menuIdentifier);
        console.log('Menu Item ID:', this.menuItemId);
        console.log('Menu Action:', this.menuAction);
        console.log('Menu Target:', this.menuTarget);
        console.log('Param 9:', this.param9);
        console.log('Param 10:', this.param10);
        console.log('World View ID:', this.worldViewId);
        
      */  console.log("param 0 " + args[0])
        console.log("param 1 " + args[1])
        console.log("param 2 " + args[2])
        console.log("param 3 " + args[3])
        console.log("menu 4 " + args[4])
        console.log("param 5 " + args[5])
        console.log("param 6 " + args[6])
        console.log("param 7 " + args[7])
        console.log("param 8 " + args[8])
        console.log("param 9 " + args[9])
        console.log("param 10 " + args[10])



        // Log the intercepted parameters
        /*console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=");
        console.log("[+] VIBE_processEntity called with:");
        console.log(`    Client Instance: ${this.clientInstance}`);
        // Add coordinate system detection
        let coordinateSystem = "unknown";
        if (this.menuOpcode === 23) { // Walk Here
            coordinateSystem = "screen";
        } else if ([1, 2, 3, 4, 5, 6].includes(this.menuOpcode)) { // Object interactions
            coordinateSystem = "scene";
        } else if ([7, 8, 9, 10, 11, 12, 13].includes(this.menuOpcode)) { // NPC interactions
            coordinateSystem = "scene";
        }

        console.log(`    Menu X: ${this.menuX} (${coordinateSystem} coordinates)`);
        console.log(`    Menu Y: ${this.menuY} (${coordinateSystem} coordinates)`);
        console.log(`    Menu Opcode: ${this.menuOpcode}`);
        console.log(`    Menu Identifier: ${this.menuIdentifier}`);
        console.log(`    Menu Item ID: ${this.menuItemId}`);

        // Try to read the action text
        try {
            // Get the action text - this may need adjustment based on the actual string structure
            const actionPtr = this.menuAction.readPointer();
            if (!actionPtr.isNull()) {
                const actionText = actionPtr.readUtf8String();
                console.log(`    Menu Action: "${actionText}"`);
            } else {
                console.log(`    Menu Action: <null pointer>`);
            }
        } catch (e) {
            console.log(`    Menu Action: <error reading: ${e.message}>`);
        }

        // Try to read the target text
        try {
            // Get the target text - this may need adjustment based on the actual string structure
            const targetPtr = this.menuTarget.readPointer();
            if (!targetPtr.isNull()) {
                const targetText = targetPtr.readUtf8String();
                console.log(`    Menu Target: "${targetText}"`);
            } else {
                console.log(`    Menu Target: <null pointer>`);
            }
        } catch (e) {
            console.log(`    Menu Target: <error reading: ${e.message}>`);
        }*/
    },

    onLeave: function (retval) {
        console.log("[+] VIBE_processEntity returned");
        console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n");
    }
});

// Create a NativeFunction wrapper for VIBE_processEntity
const processEntity = new NativeFunction(VIBE_processEntity, 'void', [
    'pointer',    // clientInstance
    'int',     // menuX
    'int',     // menuY 
    'int',     // menuOpcode
    'int',        // menuIdentifier
    'int',        // menuItemId
    'pointer',    // menuAction
    'pointer',    // menuTarget
    'uint32',     // param_9
    'int',        // param_10
    'pointer'     // worldViewId
]);

// Helper to create a string pointer for menu actions/targets
function createStringPtr(str) {
    const strPtr = Memory.allocUtf8String(str);
    return strPtr;
}
setInterval(() => {
   
}, 2000)


function processEntityTest() {
    const clientInst = ptr('0x1479828c730');
    const worldView = Memory.readPointer(clientInst.add(0x6c60));

    if (!clientInst || !worldView) {
        console.log("[!] Failed to find client | worldview instance");
        return;
    }

    // Call the function
    processEntity(
        clientInst,            // clientInstance
        50,                  // menuX (args[1]: 0x32)
        46,                  // menuY (args[2]: 0x2e)
        9,                   // menuOpcode (args[3]: 0x9)
        318,                 // menuIdentifier (args[4]: 0x13e) - This appears to be the NPC index
        -1,
        'Talk-to', // itemId (args[5]: 0x7ff6ffffffff)
        createStringPtr('Ranged combat tutor'),   // actionPtr (args[6]: 0x2262fff450)
        0x293,  // targetPtr (args[7]: 0x147bbef03e0)
        490,                 // param_9 (args[8]: 0x21f)
        worldView           // worldViewId (you'd need to provide this separately)
    );

    console.log("[+] Menu action executed");
}