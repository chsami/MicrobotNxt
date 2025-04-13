using System.Diagnostics;
using System.Net.Mime;
using WpfApp1.Microbot;

namespace ImGuiDemo;

public static class MicrobotLauncher
{
     // Various paths for RuneScape clients
    private static readonly string[] POSSIBLE_RUNESCAPE_PATHS = new[]
    {
        @"C:\Program Files (x86)\Jagex Launcher\Games\Old School RuneScape\Client\osclient.exe", // Official launcher
        
    };
     // Launch RuneScape client
    private static async Task LaunchRuneScapeAsync()
    {
        // Try to find and start RuneScape
        string runescapePath = FindRuneScapePath();

        if (!string.IsNullOrEmpty(runescapePath))
        {
            try
            {
                // Check if RuneScape is already running
                Process[] existingProcesses = Process.GetProcessesByName("RuneScape");
                if (existingProcesses.Length == 0)
                {
                    existingProcesses = Process.GetProcessesByName("RuneLite");
                }

                if (existingProcesses.Length > 0)
                {
                    // RuneScape is already running, use the existing process
                    OSClientProcess.Process = existingProcesses[0];
                    Console.WriteLine("Connected to existing RuneScape process");
                }
                else
                {
                    // Start RuneScape
                    ProcessStartInfo startInfo = new ProcessStartInfo(runescapePath);
                    startInfo.WorkingDirectory = Path.GetDirectoryName(runescapePath);
                    OSClientProcess.Process = Process.Start(startInfo);
                    Console.WriteLine($"Started RuneScape process from: {runescapePath}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to start RuneScape: {ex.Message}\n\n");
            }
        }
        else
        {
            Console.WriteLine($"Failed to start RuneScape not found.");
        }
    }

    // Find the RuneScape executable
    private static string FindRuneScapePath()
    {
        foreach (string path in POSSIBLE_RUNESCAPE_PATHS)
        {
            if (File.Exists(path))
            {
                return path;
            }
        }

        // Optionally, prompt user to locate the executable
        Console.WriteLine("Could not find RuneScape automatically.");

        return null;
    }
    public static void Launch()
    { 
        #if DEBUG
            // you can’t reliably shutdown osrsclient when the debugger shuts down your app
            Console.WriteLine("Debug mode is enabled. We are not launching the osrs client for you.");
        #else
            // Start RuneScape
            LaunchRuneScapeAsync().GetAwaiter().GetResult();
        
            // Checks if the process is still alive so the C# App keeps running
            MonitorOsrsClient();
            
            AppDomain.CurrentDomain.ProcessExit += (_, __) => ShutdownClient();
            AppDomain.CurrentDomain.UnhandledException += (sender, e) =>
            {
                ShutdownClient();
            };
        #endif
   
        

        Task.Run(() =>
        {
            var frida = new MicrobotHooks();

            frida.Create().GetAwaiter().GetResult();
        });
   
    }

    private static void ShutdownClient()
    {
        if (OSClientProcess.Process != null && !OSClientProcess.Process.HasExited)
        {
            try
            {
                OSClientProcess.Process.Kill();
                Console.WriteLine("osclient.exe process killed.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to kill osclient.exe: {ex.Message}");
            }
        }
    }

    
    static void MonitorOsrsClient()
    {
        Task.Run(() =>
        {
            try
            {
                OSClientProcess.Process.WaitForExit(); // blocks until it exits
            }
            catch
            {
                // ignore
            }
            ShutdownClient();
            Environment.Exit(1);
        });
    }
}