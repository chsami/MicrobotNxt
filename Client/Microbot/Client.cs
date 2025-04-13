namespace ImGuiDemo.Microbot;

public class Client 
{
    public static Player Player
    {
        get;
        set;
    } = new();
    
    public static Client Instance { get; } = new Client();
}