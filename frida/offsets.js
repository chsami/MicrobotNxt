const moduleBase = Process.getModuleByName("osclient.exe").base;


const _client = moduleBase.add(0xC27F20)
const _worldview = getWorldView(_client)
const _localPlayer = getLocalPlayer(_client)
const _menu = getMenu(_client)
const npcList = getNpcs(_worldview)
const npc = getNpc(index, _client, _worldview)


function getNpc(index) {
    const npcs = getNpcs(_worldview)
    for (let i = 1; i < npcs.length; i += 1) {
        if (npcs[i] === index) {
            return {
                x: npcs[i].add(0x0020).readInt(),
                y: npcs[i].add(0x0024).readInt(),
                z: npcs[i].add(0x0028).readInt(),
                sceneX: npcs[i].add(0x01b4).readInt(),
                sceneY: npcs[i].add(0x01b8).readInt(),
                lastDamageReceived: npcs[i].add(0x00e4).readInt(),
                unknownIdle: npcs[i].add(0x017c).readInt() === 0,
                isAnimating: npcs[i].add(0x002c).readInt() === 1,
                unknown: npcs[i].add(0x0164).readInt(),
                unknownAnimCycle: npcs[i].add(0x0170).readInt(),
                unknownAnimCycle2: npcs[i].add(0x0174).readInt(),
                animationId: npcs[i].add(0x016c).readInt(),
                unknown_hpBar: npcs[i].add(0x0128).readInt(),
                unknown_hpBar2: npcs[i].add(0x0130).readInt(),
                unknown_isHpBarVisible: npcs[i].add(0x0128).readInt() === 2835890448,
                //returns 0 or 1 depending if you are in combat or not
                unknown_inCombat: npcs[i].add(0x0138).readInt() === 1, 
                // 13 when blue hitsplat. 17 for red hitsplat
                unknown_hitsplat: npcs[i].add(0x00d4).readInt(),
                unknown_interactingWith: npcs[i].add(0x0140).readInt(),
                unknown_combatTimer: npcs[i].add(0x00f4).readInt(),
                poseAnimation: npcs[i].add(0x015c).readInt(),
                unknown_SomethingWithWalking: npcs[i].add(0x01a8).readInt(),
                // value changed when npc changed direction
                isTurning: npcs[i].add(0x01a0).readInt() > 0,
                /**
                 * The direction the npc is facing
                 * 0 = south
                 * 512 = west
                 * 1024 = north
                 * 1536 = east
                 */
                direction: npcs[i].add(0x0028).readInt(),
                /**
                 * same as 0x0028 ?
                 * 
                 */
                unknown_direction2: npcs[i].add(0x019c).readInt(),
                unknown_0x022c: npcs[i].add(0x022c).readInt(),
                unknown_0x01d8_x: npcs[i].add(0x01d8).readInt(),
                /**
                 * Some sort of timer when the npc has just been respawned
                 */
                respawnTimer: npcs[i].add(0x0094).readInt(),
            }
        }
    }
    return undefined;
}


function getNpcs(_worldview) {
    const npcs = []
    
    let npcList = worldview.add(0xb8).readPointer();

    // Read the bucket count (uint32 at offset 0xc0)
    let bucketCount = Memory.readU32(worldview.add(0xc0));

    for (let i = 0; i < bucketCount; i++) {
        let entryPtr = npcList.add(i * 8);
        let npcPtr = Memory.readPointer(entryPtr);

        if (!npcPtr.isNull()) {
            npcs.push(npcPtr)
        }
    }

    return npcs
}



function getMenu(_client) {
    const base = _client.add(0x6f740).readPointer()
    return {
        totalMenuOptions: base.add(0x3EC).readS32()
    }
}



const getWorldView = (client) => {
    const base = client.add(0x6c60).readPointer()
    return {
        plane: base.add(0x18).readU32(),
    }
}

const getLocalPlayer = (client) =>{
    const base = client.add(0x6f510)
    return {
        localX: base.add(0x20).toInt32(),
        localY: base.add(0x24).toInt32(),
    }
}
