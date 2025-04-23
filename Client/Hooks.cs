using System.Runtime.InteropServices;
using System.Text;
using Process.NET;
using Process.NET.Applied.Detours;
using Process.NET.Extensions;
using Process.NET.Memory;
using Process.NET.Patterns;

namespace MicrobotNxt;

public static class Hooks
{
    [DllImport("kernel32.dll")]
    static extern bool ReadProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress,
        [Out] byte[] lpBuffer, int dwSize, out int lpNumberOfBytesRead);
    
    // Declare function sig
    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    delegate IntPtr OnConsoleHook(IntPtr one, IntPtr two);

    //method instance to inject
    private static OnConsoleHook EnableConsoleHook;

    // detour handler for the method. has various CallOriginal/Enable/Disable methods.
    private static Detour EnableConsoleHookDetour;

    private static ProcessSharp _process;
    private static IMemory _memory;
    private static IntPtr _baseAddress;
    private static int _moduleSize;
    private static DetourManager detourManager;
    private const string ProcessName = "osclient";

    public static void Create()
    {
        // Attach to process
        var proc = System.Diagnostics.Process.GetProcessesByName(ProcessName)[0];
        _process = new ProcessSharp(proc, MemoryType.Remote);
        _memory = _process.Memory;
        _baseAddress = proc.MainModule.BaseAddress;
        _moduleSize = proc.MainModule.ModuleMemorySize;
        detourManager = new DetourManager(_process.Memory);

        Console.WriteLine($"[+] Attached to {ProcessName}.exe @ 0x{_baseAddress.ToInt64():X}");

        while (true)
        {
                // we could simply get the values straight from memory with Process.NET library
                // But i'm still trying to get everything to work in js/ts. This could be used as a backup
            var ClientObject = _memory.Read<IntPtr>(_process.ModuleFactory.MainModule.BaseAddress
                                                    + 0xC27F20); // Read the static client object ptr
            var username = _memory.Read<int>(_process.ModuleFactory.MainModule.BaseAddress + 0xB53500);
        }
    
       /*
          var ClientObject = _memory.Read<IntPtr>(_process.ModuleFactory.MainModule.BaseAddress
                                                    + 0xC27F20); // Read the static client object ptr        
var LocalPlayerIndex = _memory.Read<int>(ClientObject + 0x6F4D0); // get the player index.
        var LocalPlayerPtr = _memory.Read<IntPtr>(ClientObject + 0x6f510);
        var LocalPlayerXPos = _memory.Read<int>(LocalPlayerPtr +  0x20);
        var LocalPlayerYPos = _memory.Read<int>(LocalPlayerPtr +  0x24); */


        //ScanEntryPoint();
    }

    public static void ScanEntryPoint()
    {
        EnableConsoleHook = (one, two) =>
        {
            Console.WriteLine($"[+] Enabled Console Hook");
            // Do Whatever here. 
            return (IntPtr)EnableConsoleHookDetour.CallOriginal(one, two); // Example just calls original and returns.
            // you can return your own results or fuck with inputs.
            // you dont have to call the original func
        };

        EnableConsoleHookDetour = detourManager.CreateAndApply(
            Marshal.GetDelegateForFunctionPointer<OnConsoleHook>(_process.ModuleFactory.MainModule.BaseAddress +
                                                                 0x304070),
            EnableConsoleHook, "EnableConsoleShim");
        // To hook it, you'd need EasyHook or write a trampoline.
    }
}