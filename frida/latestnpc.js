// --- adjust these to your game’s base addresses / your captured values ---
const mod = Process.getModuleByName('osclient.exe');

const CLIENT_THIS       = ptr("0x1479828c730");
const DO_ACTION_ADDR    = mod.base.add(0x99DB0)
// Build the NativeFunction with the exact signature:
const DoAction = new NativeFunction(
    DO_ACTION_ADDR,
    'void',
    [
        'pointer', // this
        'int',     // worldX
        'int',     // worldY
        'int',     // menuSlot
        'int',     // spawnIndex
        'int',     // subject (MinimenuSubject, always -1)
        'pointer', // std::string* (action text)
        'pointer', // CoordType* (world coords struct)
        'int',     // screenX (px)
        'int',     // screenY (px)
        'pointer'  // shared_ptr<Entity>*
    ]
);

// Helper to fire “Talk‑to” on that tutor you clicked:
function invokeTalkTo(xTile, yTile, slot, spawnIdx, strPtr, subj, worldCPtr, scrX, scrY, entPtr) {
    console.log("execute")
    DoAction(
        CLIENT_THIS,
        xTile,    // world X
        yTile,    // world Y
        slot,     // menu slot (9 for “Talk‑to”)
        spawnIdx, // spawn‑index (318)
        strPtr,   // std::string* pointer to “Talk‑to”
        subj,     // MinimenuSubject (-1)
        worldCPtr,// CoordType* world coords struct
        scrX,     // screen X
        scrY,     // screen Y
        entPtr    // shared_ptr<Entity>* to that NPC
    );
}

setInterval(() => {
   invokeTalkTo(
        31,        // worldX
        37,        // worldY
        9,         // menu slot for Talk‑to
        318,       // spawn index
        -1,
        ptr("0x2262fff450"), // stringPtr (std::string for “Talk‑to”)
        ptr("0x147bbef03e0"),// worldCoordPtr
        773,                 // screen X
        524,                 // screen Y
        ptr("0x2262fff440")  // entityPtr
    );
}, 2000)



Interceptor.attach(DO_ACTION_ADDR, {
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
        
        console.log("param 0 " + args[0])
        console.log("param 1 " + args[1])
        console.log("param 2 " + args[2])
        console.log("param 3 " + args[3])
        console.log("param 4 " + args[4])
        console.log("param 5 " + args[5])
        console.log("param 6 " + args[6])
        console.log("param 7 " + args[7])
        console.log("param 8 " + args[8])
        console.log("param 9 " + args[9])
        console.log("param 10 " + args[10])



    },

    onLeave: function (retval) {
        console.log("[+] DoAction returned");
        console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n");
    }
});
