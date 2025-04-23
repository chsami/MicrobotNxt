const moduleBase = Process.getModuleByName("osclient.exe").base;
const x64 = ptr("0x140000000");
console.log("start ")

/*Interceptor.attach(moduleBase.add('0x5ba40'), {
    onEnter: (args) => {
        let a = args[1]
        console.log(a.toInt32())
    },
    onLeave: (args) => {}
})*/

Interceptor.attach(moduleBase.add('0x5a630'), {
    onEnter: (args) => {
        let entityType = args[1]
        let isNpc = entityType.toInt32() == 7102
        if (isNpc) {
           // console.log(args[2].toInt32())
        }
    },
    onLeave: (args) => {}
})


Interceptor.attach(moduleBase.add('0x3b680'), {
    onEnter: (args) => {
        let entityId = args[2].toInt32()
       // console.log(entityId)
    },
    onLeave: (args) => {}
})

Interceptor.attach(moduleBase.add('0x99db0'), {
    onEnter: (args) => {
        let x = args[1].toInt32()
        let y = args[2].toInt32()
        // follow player = 2046
        // attack npc = 10
        // examine npc = 3
        let menuOpCode = args[3].toInt32()
        let entityIndex = args[4].toInt32() 
        
        
       // console.log(menuOpCode)
    },
    onLeave: (args) => {}
})

const previous = {};


/**
 * TODO REWORK THIS TO USE OFFSETS FROM offset.js
 */
/*setInterval(() => {
    // declare Offsets
    let globalBase = moduleBase.add('0xc27f20').readPointer();  // Adjust if ASLR changes this
    let worldview = globalBase.add(0x6c60).readPointer();
    let npcList = worldview.add(0xb8).readPointer();
    // Read the bucket count (uint32 at offset 0xc0)
    let bucketCount = Memory.readU32(worldview.add(0xc0));
    //declare variable to store all the npc pointers
    const npcPtrs = []
    // loop over the bucket count to fetch every valid npc pointer
    for (let i = 0; i < bucketCount; i++) {
        let entryPtr = npcList.add(i * 8);
        let npcPtr = Memory.readPointer(entryPtr);

        if (!npcPtr.isNull()) {
            npcPtrs.push(npcPtr)
        }
    }

    // loop over the npc pointers and read the data
    for (const npcPtr of npcPtrs) {
        const npcIndex = Memory.readS32(npcPtr);
        if (npcIndex > 0) {
            const scanSize = 0x300;                // how many bytes to track
            const valueSize = 4;                   // track U32s, can be changed
            
            const entity = Memory.readPointer(npcPtr.add(4 * 4));
            for (let offset = 0; offset < scanSize; offset += valueSize) {
                const addr = entity.add(offset);
                try {
                    //  console.log(addr)
                    const value = Memory.readU32(addr); // or readS32/readFloat depending on data
                    if (previous[offset] !== value) {
                     //   console.log(`NpcIndex=${npcIndex}]->[0x${offset.toString(16).padStart(4, "0")}] ${previous[offset]} → ${value}`);
                        previous[offset] = value;
                    }
                } catch (e) {
                    // Optional: log inaccessible offsets
                    console.log(`[0x${offset.toString(16)}] inaccessible`);
                }
            }
        }
    }
}, 1000)*/




/*
Interceptor.attach(moduleBase.add('0x466f0'), {
    onEnter: (args) => {
        console.log(args[0] + " - " + args[1])
    },
    onLeave: (args) => {}
})*/
/*
Interceptor.attach(moduleBase.add('0x466f00'), {
    onEnter(args) {
        const index = args[1].toInt32();
        console.log(`[+] NPC Def requested for index: ${index}`);
        this.paramOut = args[0];
        this.index = index;
    },
    onLeave(retval) {
        const out = this.paramOut;
        const def1 = out.readPointer();
        const def2 = out.add(8).readPointer();
        console.log(`[+] Returned def: ${def1}, ${def2}`);
        try {
            const namePtr = def1.add(0x10).readPointer(); // adjust offset
            const name = Memory.readUtf8String(namePtr);
            console.log(`[+] NPC [${this.index}] name: ${name}`);
        } catch (e) {
            console.error('[!] Could not read name:', e);
        }
    }
});*/


/*
const funAddr = moduleBase.add(0x15b610); // offset from IDA, adjust as needed

Interceptor.attach(funAddr, {
    onEnter(args) {
        this.param1 = args[0]; // param_1 + 0x1f458 will be passed in
        console.log(this.param1)
    },
    onLeave(retval) {
        console.log('[+] FUN_14015b610 called');
        // You can hook the vtable call separately to extract uVar3
    }
});
*/


/**
 * This hook works for getting npc id and their defintion
 */

/*Interceptor.attach(moduleBase.add(0x466f00), {
    onEnter(args) {
        this.npcId = args[1].toInt32();
        this.retStruct = args[0]; // ulonglong* param_1
        console.log(`\n[+] NPC DEF requested for ID: ${this.npcId}`);
    },
    onLeave(retval) {
        try {
            const npcDefPtr = this.retStruct.readPointer(); // actual NPC def
            const scanSize = 0x300;
            const valueSize = 4;

            for (let offset = 0; offset < scanSize; offset += valueSize) {
                const addr = npcDefPtr.add(offset);
                try {
                    const value = Memory.readU32(addr);
                    console.log(`NPC[${this.npcId}] → [0x${offset.toString(16).padStart(4, "0")}] ${previous[offset]} → ${value}`);
                } catch {
                    // Optional: comment this out if spammy
                    // console.log(`[0x${offset.toString(16)}] inaccessible`);
                }
            }

            // Optional: log a specific known field
            console.log(`Name hash (offset 0x20) = ${npcDefPtr.add(0x20).readU32()}`);
        } catch (e) {
            console.error("[!] Exception in onLeave:", e);
        }
    }
});*/

const fnAddr = moduleBase.add(0x0b59f0); // adjust offset of FUN_1400b59f0

// TODO: Find the npcId that gets passed to  FUN_140466f00_Get_Npc_Def

/*Interceptor.attach(fnAddr, {
    onEnter(args) {
        const stream = args[1]; // param_2
        console.log("[+] FUN_1400b59f0 called");
        console.log("    param_1 (object): " + args[0]);
        console.log("    param_2 (stream): " + stream);

        // Try reading from stream
        try {
            const buffer = stream.add(0x10).readPointer();
            const pos = stream.add(0x18).readU64();
            console.log(`    buffer: ${buffer}`);
            console.log(`    pos:    ${pos}`);
        } catch (e) {
            console.error("    [!] Failed to read stream structure:", e);
        }
    },
    onLeave(retval) {
        console.log("[+] FUN_1400b59f0 returned " + retval.readU32());
        console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n");
    }
});*/

// Function that returns the npc id
/*
Interceptor.attach(moduleBase.add('0x049470'), {
    onEnter(args) {
        const entityPtr = args[0];
        console.log(`    Entity Pointer: ${entityPtr}`);
    },
    onLeave(npcId) {
        console.log("[+] FUN_140049470 returned " + npcId.toInt32());
        console.log("=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n");
    }
})
*/

// hashtable: 0x7ff65e0a2ac0 hashSize: 61
// hashtable: 0x7ff65e0a2ac0 hashSize: 61
setInterval(function () {
    const npcId = 561; // example
    const hashtableBase = moduleBase.add(0xbd2ac0);   // DAT_140bd2ac0
    const hashSize = Memory.readU32(moduleBase.add(0xbd2ac8)); // DAT_140bd2ac8
    console.log("hashtable: " + hashtableBase + " hashSize: " + hashSize);
    
    const index = npcId % hashSize;
    const bucketPtr = hashtableBase.add(index * 8).readPointer();
    
    var list = []
    
    for (let i = 0; i < 10000; i++) {
        const bucketCounter = hashtableBase.add(i * 8).readPointer()
        if (bucketCounter > 0) {
            list.push(bucketCounter)
            console.log(i + " - " + bucketCounter)
        }
    }
    
    // Loop over list of bucket pointers
    // and then do the logic like we do for current.add(8)L...

    for (let i = 0; i < 2048; i++) {
        if (!hashtableBase.add(i * 8).readPointer().isNull()) {
           // console.log(`[+] bucket: ${i} has values`);
        }
    }

    let current = bucketPtr;
    console.log(`[+] Bucket[${index}] = ${current}`);
    
    while (!current.isNull()) {
     

// Try reading a string? Assume +0x20 is the name pointer

        try {
            const npcDefPtr = current.add(8).readPointer(); // actual NPC def
            const scanSize = 0x300;
            const valueSize = 4;

            for (let offset = 0; offset < scanSize; offset += valueSize) {
                const addr = npcDefPtr.add(offset * 4).readPointer();
                try {
                    const value = addr.readUtf8String();
                    if (value)
                        console.log(value)
                } catch {
                    // Optional: comment this out if spammy
                    // console.log(`[0x${offset.toString(16)}] inaccessible`);
                }
            }

            // Optional: log a specific known field
            // console.log(`Name hash (offset 0x20) = ${npcDefPtr.add(0x20).readU32()}`);
        } catch (e) {
            console.error("[!] Exception in onLeave:", e);
        }
        
        const entryNpcId = current.readU32();
        const defObject = current.add(8).readPointer();
        //console.log(`[+] defObject ptr: ${defObject}`);
         /*   for (let i = 0; i < 300; i+=4) {
                try {
                    const name = defObject.add(i*4).readPointer().readUtf8String();
                    if (name != null)
                        console.log(`[+] NPC Name: ${name}`);
                } catch (e) {
                  // console.warn(`[!] Could not read name: ${e.message}`);
                }
            }*/
      
      
        
        current = current.add(8 * 8).readPointer(); // go to next entry in chain
        console.log(current)
    }
}, 1000);