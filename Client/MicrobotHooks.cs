using System.Diagnostics;
using System.Text.Json;
using ImGuiDemo.Microbot;

namespace ImGuiDemo;
/// <summary>
/// Listens to the frida hook.js script and handles events.
/// </summary>
public sealed class MicrobotHooks
{
    public async Task Create()
    {
        
        Console.WriteLine($"Starting frida...");
        
        await WaitForProcessAsync("osclient");
        
        string fridaFolder = Directory.GetParent(AppContext.BaseDirectory)?
            .Parent?
            .Parent?
            .Parent?
            .Parent?
            .FullName + "\\frida";

        if (!Path.Exists(fridaFolder))
        {
            Console.WriteLine("Frida folder not found. Please ensure the path is correct.");
            return;
        }

        EnsureNpmDependencies(fridaFolder);
        
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "frida",
                Arguments = "-n osclient.exe -l hook.js",
                WorkingDirectory = fridaFolder,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            },
            EnableRaisingEvents = true
        };

        process.OutputDataReceived += (sender, args) =>
        {
            var line = args.Data;
            if (!string.IsNullOrWhiteSpace(line))
            {
                if (line.Contains("\"type\":\"event\""))
                {
                    HandleGameEvents(line);
                }
                else
                {
                    Console.WriteLine(line);
                }
            }
        };

        process.ErrorDataReceived += (sender, args) =>
        {
            if (args.Data != null)
                Console.WriteLine("[FRIDA ERR] " + args.Data);
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
    }

    private void HandleGameEvents(string line)
    {
        try
        {
            var json = JsonDocument.Parse(line);
            var eventName = json.RootElement.GetProperty("name").GetString();
            var data = json.RootElement.GetProperty("data");

            switch (eventName)
            {
                case "update_player":
                    Client.Player.X = data.GetProperty("x").GetInt32();
                    Client.Player.Y = data.GetProperty("y").GetInt32();
                    break;
            }
            
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
        }
    }
    
    /// <summary>
    /// Find the npm executable in the system PATH.
    /// </summary>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    static string FindNpm()
    {
        var paths = Environment.GetEnvironmentVariable("PATH")?.Split(';') ?? Array.Empty<string>();

        foreach (var path in paths)
        {
            var candidate = Path.Combine(path.Trim(), "npm.cmd");
            if (File.Exists(candidate))
            {
                // Optional: filter out AppData shim if needed
                if (!candidate.Contains("AppData"))
                    return candidate;
            }
        }

        throw new Exception("npm.cmd not found in PATH");
    }
    
    /// <summary>
    /// Ensure that npm dependencies are installed.
    /// </summary>
    /// <param name="fridaFolder"></param>
    /// <exception cref="Exception"></exception>
    void EnsureNpmDependencies(string fridaFolder)
    {
        string nodeModulesPath = Path.Combine(fridaFolder, "node_modules");

        if (Directory.Exists(nodeModulesPath))
        {
            Console.WriteLine("node_modules already exists. Skipping npm install.");
            return;
        }

        Console.WriteLine("node_modules not found. Running npm install...");
        
        string npmPath = FindNpm();
        
        var npmProcess = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = npmPath,
                Arguments = "install",
                WorkingDirectory = fridaFolder,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        npmProcess.Start();
        npmProcess.WaitForExit();
    
        if (npmProcess.ExitCode != 0)
        {
            throw new Exception("npm install failed: " + npmProcess.StandardError.ReadToEnd());
        }
    }
    
    /// <summary>
    /// Wait for a process to start.
    /// </summary>
    /// <param name="processName"></param>
    /// <param name="checkIntervalMs">default 1 second</param>
    /// <param name="timeoutMs">default 10 seconds</param>
    /// <exception cref="TimeoutException"></exception>
    private async Task WaitForProcessAsync(string processName, int checkIntervalMs = 1000, int timeoutMs = 5000)
    {
        var timeout = TimeSpan.FromMilliseconds(timeoutMs);
        var start = DateTime.UtcNow;

        while (DateTime.UtcNow - start < timeout)
        {
            var found = Process.GetProcessesByName(processName).Length > 0;
            if (found)
                return;

            await Task.Delay(checkIntervalMs);
        }

        Console.WriteLine($"Process '{processName}' not found within {timeoutMs / 1000} seconds.");
        throw new TimeoutException($"Process '{processName}' not found within {timeoutMs / 1000} seconds.");
    }
}