setInterval(() => {
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
                        console.log(`NpcIndex=${npcIndex}]->[0x${offset.toString(16).padStart(4, "0")}] ${previous[offset]} → ${value}`);
                        previous[offset] = value;
                    }
                } catch (e) {
                    // Optional: log inaccessible offsets
                    console.log(`[0x${offset.toString(16)}] inaccessible`);
                }
            }
        }
    }
}, 1000)