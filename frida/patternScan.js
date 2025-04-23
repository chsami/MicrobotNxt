// Look for the specific memory access pattern
Memory.scan(Process.enumerateRangesSync({protection: 'r-x', coalesce: true})[0].base,
    Process.enumerateRangesSync({protection: 'r-x', coalesce: true})[0].size,
    "?? ?? ?? ?? 10 5F 06 00", { // Little-endian representation of 0x6f510
        onMatch: function(address, size) {
            console.log('[+] Potential reference to LocalPlayerPtr at:', address);
            // Disassemble the instruction at this address to confirm
            console.log(Instruction.parse(address).toString());
        }
    });