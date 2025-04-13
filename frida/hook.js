const microbot = {
    client: null,
    playerList: null,
    playerIndex:  -1
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

scanMatch(entryPattern, (addressPointer) => {
    try {
        Interceptor.attach(addressPointer, {
            onEnter(args) {
                microbot.client = args[0];
                microbot.playerIndex = microbot.client.add(0x6F4D0).readU32();
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
            this.entityIndex = args[2].toInt32();
            this.entityPtr = microbot.playerList.add(this.entityIndex * 0xB8);
        },
        onLeave: function (retval) {
            try {
                if (microbot.playerIndex === this.entityIndex) {

                    var player = {
                        x: this.entityPtr.add(0x3C).readU32(),
                        y: this.entityPtr.add(0x40).readU32(),
                        plane: this.entityPtr.add(0x38).readU32()
                    }

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


//#endregion



