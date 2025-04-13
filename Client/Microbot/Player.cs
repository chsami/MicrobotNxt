

namespace ImGuiDemo.Microbot;

public class Player
{
    public int X { get; set; }
    public int Y { get; set; }
    
    public string Coordinates => $"X: {X}, Y: {Y}";
}