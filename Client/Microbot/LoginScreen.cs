using MicrobotNxt.Attributes;

namespace MicrobotNxt.Microbot;

public static class LoginScreen
{
    // 2 = email/password, 4 = wrong username/password ...
    [DataAddress(0xC27F08)]
    public static int State { get; set; } 
    
    // TODO: Find the correct address
    [DataAddress(-1)] 
    public static string Username { get; set; }
    
    [DataAddress(0xb533d8)]
    public static string Password { get; set; }
}