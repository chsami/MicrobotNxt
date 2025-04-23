using MicrobotNxt.Attributes;

namespace MicrobotNxt.Microbot;

[DataAddress(0xC27F20)]
public static class Client
{
    public static Player Player
    {
        get;
        set;
    } = new();
}

[DataAddress(0x6f510)]
public class Player
{
    [DataAddress(0x3C)]
    public int X { get; set; }
    
    [DataAddress(0x40)]
    public int Y { get; set; }
    
    [DataAddress(0x20)]
    public int LocalX { get; set; }
    
    [DataAddress(0x24)]
    public int LocalY { get; set; }
    
    [DataAddress(0x6F4D0)]
    public int Index { get; set; }
}