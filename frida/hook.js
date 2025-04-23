const microbot = {
    client: null,
    playerList: null,
    playerIndex:  -1,
    username: '',
    password: '',
    loginScreen: 0,
    x: 0,
    y: 0
}

//#region Utility methods

const getPatternByteCount = (pattern) => {
    return pattern
        .trim()
        .split(/\s+/)
        .filter(byte => byte !== '??') // exclude wildcards if any
        .length;
}

/**
 * scans memory based on pattern until a match is found
 * @param pattern
 * @param onMatch
 */
function scanMatch(pattern, onMatch) {
    let ghidraFunctionName = ''
    Memory.scan(mod.base, mod.size, pattern, {
        onMatch(address) {
            try {
                const addr = ptr(address);
                const offset = addr.sub(mod.base);
                const ghidraAddr = x64base.add(offset);
                ghidraFunctionName = 'FUN_' + ghidraAddr.toString(16)
                onMatch(address);
            } catch (err) {
                console.error(`Disassembly error at ${address}:`, err.message);
            }
        },
        onComplete() {
            console.log(`[+] Pattern scan complete for: ${pattern} = ${ghidraFunctionName}`);
        }
    });
}

/**
 * scans memory based on pattern and instructions until a match is found
 * @param pattern
 * @param expectedInstructions
 * @param onMatch
 */
function scanAndMatchPattern(pattern, expectedInstructions, onMatch) {
    const patternSize = getPatternByteCount(pattern);
    let ghidraFunctionName = '' 
    Memory.scan(mod.base, mod.size, pattern, {
        onMatch(address) {
            try {
                let current = address.add(patternSize);
                let matched = true;

                for (const expected of expectedInstructions) {
                    const insn = Instruction.parse(current);

                    if (insn.mnemonic !== expected.mnemonic || insn.opStr !== expected.opStr) {
                        matched = false;
                        break;
                    }

                    current = current.add(insn.size);
                }

                if (matched) {
                    const offset = address.sub(mod.base)
                    const addressPointer = mod.base.add(offset)
                    ghidraFunctionName = 'FUN_' + ptr(0x140000000).add(offset).toString(16)
                    onMatch(addressPointer);
                }

            } catch (err) {
                console.error(`Disassembly error at ${address}:`, err.message);
            }
        },
        onComplete() {
            console.log(`[+] Pattern scan complete for: ${pattern} = ${ghidraFunctionName}`);
        }
    });
}


//#endregion

const mod = Process.getModuleByName('osclient.exe');
const x64base = ptr('0x140000000');

console.log("Base = " + mod.base) // rev 230 = 0x7ff6509a0000

//#region Entry point
const entryPattern = '48 89 5c 24 10 48 89 4c 24 08 55 56 57 41 54 41 55 41 56 41 57 48 8d ac 24 00 fb'

setInterval(() => {
    try {
        microbot.client = mod.base.add(0xC27F20)
/*        microbot.username = mod.base.add(0xB53500)
        microbot.password = mod.base.add(0xB533D8)
        Memory.writeUtf8String(microbot.password, 'itachi3555');
        console.log(microbot.password.readUtf8String())*/
        //0 = reset login screen
        //2 = username & passsword login
        //3 = incorect username or password
        const loginScreenPtr = mod.base.add(0xC27F08); // Adjust offset as needed
        microbot.loginScreen = Memory.readU8(loginScreenPtr)

        const password = mod.base.add(0xb533d8); // password

    } catch(ex) {
        console.log('Error in interval:', ex);
    }
}, 100)
setTimeout(function() {
    const target = mod.base.add(0xC4CB0); // 0x1400C4CB0 - 0x140000000
    const passwordField = mod.base.add(0x0B533D8); // DAT_140b533d8 - DAT_1412f5590
    Interceptor.attach(target, {
        onEnter(args) {
            console.log("[+] FUN_1400c4cb0 -> enter oldschool runescape login details");
        },
        onLeave(retval) {
            console.log("[+] Returned from FUN_1400c4cb0");
        }
    });
    Interceptor.attach(mod.base.add(0x35e60), {
        onEnter(args) {
            console.log("[FUN_140035e60] -> Login")
        },
        onLeave(retval) {
        }
    });

 /*   Interceptor.attach(mod.base.add(0xae830), {
        onEnter(args) {
            this.ctx = args[0]; // param_1
            this.param2 = args[1]; // param_2
            this.x = args[3].toInt32();
            this.y = args[4].toInt32();
            this.z = args[7].toInt32();
            
         //   console.log(this.param2 + " " + microbot.playerIndex)

            //console.log('[+] worldToScreen called');
            //console.log('  Floor (param_2):', this.param2);
         //  console.log('  In: x =', this.x, 'y =', this.y, 'z =', this.z);
        },

        onLeave(retval) {
            const resultX = Memory.readS32(this.ctx.add(0x79cd0));
            const resultY = Memory.readS32(this.ctx.add(0x79cd4));

          //  console.log('  Result -> x:', resultX, 'y:', resultY);

            if (resultX === -1 || resultY === -1) {
                console.log('  → Not on screen');
            } else {
                console.log('  → On screen at:', resultX, resultY);
            }
        }
    });*/
    
    
}, 1000)

scanMatch(entryPattern, (addressPointer) => {
    try {
        Interceptor.attach(addressPointer, {
            onEnter(args) {
                for (let i = 0; i < 10; i++) {
                    console.log(`    args[${i}]: ${args[i]} (${typeof args[i] !== 'undefined' ? args[i].toString() : 'undefined'})`);
                }
                microbot.client = args[0];
               // console.log(microbot.client)
                microbot.playerIndex = microbot.client.add(0x6F4D0).readU32();
                microbot.username = microbot.client.add(0xB53500).readUtf8String()
                microbot.playerList = microbot.client.add(0x6c80).add(0x2008).readPointer();
            }
        });
    } catch (err) {
        // Instruction.parse can fail on bad alignment
        console.error(err.message);
    }
});
//#endregion Entry point

//#region Update Players - FUN_14012d310

const updatePlayersPattern = '48 89 5c 24 08 48 89 6c 24 10 48 89 74 24 18 57 41 56 41 57 48 83 ec 20' // FUN_14012d310

const updatePlayersExpectedSequence = [
    {mnemonic: "mov", opStr: "rsi, rdx"},
    {mnemonic: "movsxd", opStr: "r14, r8d"},
    {mnemonic: "mov", opStr: "rdi, rcx"},
    {mnemonic: "mov", opStr: "edx, 1"}
];

scanAndMatchPattern(updatePlayersPattern, updatePlayersExpectedSequence, (addressPointer) => {
    Interceptor.attach(addressPointer, {
        onEnter: function (args) {
          //  console.log(addressPointer)
            this.entityIndex = args[2].toInt32();
          //  console.log(this.entityIndex + " = " + microbot.client.add(1).toInt32());
            this.param3 = args[3].toInt32();
            this.entityPtr = microbot.playerList.add(this.entityIndex * 0xB8);
         //   console.log(args[2])
        },
        onLeave: function (retval) {
            try {
                if (microbot.playerIndex === this.entityIndex) {
console.log("playerIndex = " + microbot.client.add(0x2008).add(this.entityIndex * 0xB8).add(0x3C).readU32())
                    var player = {
                        x: this.entityPtr.add(0x3C).readU32(),
                        y: this.entityPtr.add(0x40).readU32(),
                        plane: this.entityPtr.add(0x38).readU32(),
                        local_x: this.entityPtr.add(0x20).readU32(),
                        local_y: this.entityPtr.add(0x24).readU32(),
                    }

                  // console.log("index ? : " + microbot.client.add(0x34).readU32())
                    
                    
                   // console.log(microbot.client.add(0x5e030 + this.param3).toInt32())
                  //  console.log(microbot.client.add(0x5e030 + this.param3  * 8).toInt32())
                    
                    microbot.x = player.x;
                    microbot.y = player.y;
                    
                 //  w2s(player.plane, {x:player.x, y:player.y, z:0})

                  /*  setTimeout(() => {
                        walkHere(634, 550)
                    }, 1000)*/

                    publish('update_player', player);

                }
            } catch (e) {
                console.log('Failed to read position:', e);
            }
        }
    });
});

//#endregion Update Players FUN_14012d310

//#region Set Player Index

const initializePlayerPattern = '8B 81 D0 F4 06 00 89 81 24 F5 06 00 C7 81 1C F5 06 00 00'

scanMatch(initializePlayerPattern, (address) => {
    try {
        Interceptor.attach(ptr(address), {
            onEnter(args) {
                this.rcx = this.context.rcx;
                globalThis.playerIndex = this.rcx.add(0x6F4D0).readU32(); // 0x6F524 is the offset to the player index (seems to be stable across revisions)
            }
        });
    } catch (err) {
        // Instruction.parse can fail on bad alignment
        console.error(err.message);
    }
});
//#endregion

//#region Communication between js & C# overlay

/**
 * To communicate back to the C# overlay
 * @param name
 * @param data
 */
function publish(name, data) {
    var event = {
        type: 'event',
        name: name,
        data: data
    }
    console.log(JSON.stringify(event));
}

// Replace these with the actual values
const worldToScreenPtr = mod.base.add('0xAE830'); // Address of osrs::functions::worldtoscreen

Interceptor.attach(worldToScreenPtr, {
    onEnter(args) {
        const ctx = args[0]; // param_1
        //console.log("[+] param_1 (ctx):", ctx);
 //  0x2412939c730
        if (!microbot.client) return
        try {
            const x = Memory.readS32(microbot.client.add(0x79cd0));
            const y = Memory.readS32(microbot.client.add(0x79cd4));
          //  console.log(`[+] w2s result: ${x}, ${y}`);
        } catch (err) {
            console.error("[!] Failed to read screen coords:", err.message);
        }
    }
});

const worldToScreen = new NativeFunction(worldToScreenPtr, 'void', [
    'pointer',  // VIBE_client
    'pointer',  // VIBE_worldView
    'int',      // VIBE_plane (current plane/floor level)
    'int',      // VIBE_x (x coordinate in world)
    'int',      // VIBE_y (y coordinate in world)
    'int',      // VIBE_var3 (likely x for tile height calculation)
    'int',      // VIBE_var4 (likely y for tile height calculation)
    'int'       // VIBE_height (height adjustment)
]);

function w2s(floor, inputVec3) {
    const out = { x: 0, y: 0 };
    console.log("received " + inputVec3.x + " " + inputVec3.y + " " + inputVec3.z);

    // Get the worldView pointer - this seems to be at client+0x6c60 in your code
    const worldView = Memory.readPointer(microbot.client.add(0x6c60));

    // Read the world view offsets for proper coordinate calculation
    const worldViewXOffset = Memory.readS32(worldView.add(0x48));
    const worldViewYOffset = Memory.readS32(worldView.add(0x4c));

    // Calculate the world coordinates using the same formula from FUN_1400a0b70
    // (entity_coord - worldView_offset) * 0x80 + fine_adjustment

    // Since we're working with direct coordinates and not entity structures,
    // we'll assume fine adjustment is zero
    const x = Math.floor((inputVec3.x - worldViewXOffset) * 0x80);
    const y = Math.floor((inputVec3.y - worldViewYOffset) * 0x80);
    const z = Math.floor(inputVec3.z); // Height value

    // Get the plane/z-level from worldView
    const plane = Memory.readS32(worldView.add(0x18));

    // Call the worldToScreen function with all required parameters
    worldToScreen(
        microbot.client,     // VIBE_client
        worldView,           // VIBE_worldView
        plane,               // VIBE_plane (from worldView+0x18)
        x,                   // VIBE_x (calculated)
        y,                   // VIBE_y (calculated)
        x,                   // VIBE_var3 (same as x for tile height lookup)
        y,                   // VIBE_var4 (same as y for tile height lookup)
        z * 2                // VIBE_height (multiplied by 2 as seen in the code)
    );

    // Read screen coordinates from the client object
    out.x = Memory.readS32(microbot.client.add(0x79cd0));
    out.y = Memory.readS32(microbot.client.add(0x79cd4));
    console.log("Screen coords:", out.x, out.y);

    // Return false if out of screen
    if (out.x === -1 || out.y === -1) {
        console.log("Point is out of screen");
        return { success: false, screenPos: out };
    }

    return { success: true, screenPos: out };
}


//#endregion










const npcMgr = mod.base.add(0x12F5590);
