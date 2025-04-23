using System.Diagnostics;
using System.Numerics;
using ImGuiNET;
using MicrobotNxt.Microbot;
using Veldrid;
using Veldrid.Sdl2;
using Veldrid.StartupUtilities;

namespace MicrobotNxt;

class Program
{
    private static Sdl2Window _window;
    private static GraphicsDevice _gd;
    private static CommandList _cl;
    private static ImGuiController _controller;
    // private static MemoryEditor _memoryEditor;

    // UI state
    private static float _f = 0.0f;
    private static int _counter = 0;
    private static int _dragInt = 0;
    private static Vector3 _clearColor = new Vector3(0.0f, 0.0f, 0.6f);
    private static bool _showImGuiDemoWindow = true;
    private static bool _showAnotherWindow = false;
    private static bool _showMemoryEditor = false;
    private static byte[] _memoryEditorData;
    private static uint s_tab_bar_flags = (uint)ImGuiTabBarFlags.Reorderable;
    static bool[] s_opened = { true, true, true, true }; // Persistent user state


    static void Main(string[] args)
    {
        // Create window, GraphicsDevice, and all resources necessary for the demo.
        VeldridStartup.CreateWindowAndGraphicsDevice(
            new WindowCreateInfo(50, 50, 1280, 720, WindowState.Normal, "ImGui.NET Sample Program"),
            new GraphicsDeviceOptions(
                debug: true,
                swapchainDepthFormat: null,
                syncToVerticalBlank: true,
                resourceBindingModel: ResourceBindingModel.Improved,
                preferStandardClipSpaceYDirection: true,
                preferDepthRangeZeroToOne: true)
            {
                SwapchainSrgbFormat = false
            },out _window,
            out _gd);
        Win32.MakeWindowTopMost(_window.Handle);
        _window.Resized += () =>
        {
            _gd.MainSwapchain.Resize((uint)_window.Width, (uint)_window.Height);
            _controller.WindowResized(_window.Width, _window.Height);
        };
        _cl = _gd.ResourceFactory.CreateCommandList();
        _controller = new ImGuiController(_gd, _gd.MainSwapchain.Framebuffer.OutputDescription, _window.Width, _window.Height);
        Random random = new Random();
        _memoryEditorData = Enumerable.Range(0, 1024).Select(i => (byte)random.Next(255)).ToArray();

        var stopwatch = Stopwatch.StartNew();
        float deltaTime = 0f;
            
        // Start Hooking Process
        
         //Hooks.Create();

          MicrobotLauncher.Launch();
            
        while (_window.Exists)
        {
            deltaTime = stopwatch.ElapsedTicks / (float)Stopwatch.Frequency;
            stopwatch.Restart();
            InputSnapshot snapshot = _window.PumpEvents();
            //if (!_window.Exists) { break; }
            _controller.Update(deltaTime, snapshot); // Feed the input events to our ImGui controller, which passes them through to ImGui.
                
            RenderUI();

            _cl.Begin();
            _cl.SetFramebuffer(_gd.MainSwapchain.Framebuffer);
            _cl.ClearColorTarget(0, new RgbaFloat(0f, 0f, 0f, 0f)); // Transparent black
            _controller.Render(_gd, _cl);
            _cl.End();
            _gd.SubmitCommands(_cl);
            _gd.SwapBuffers(_gd.MainSwapchain);
        }
    }

    private static void RenderUI()
    {
        {
            ImGui.Text("");
            ImGui.Text(string.Empty);
            ImGui.Text("Player Position: X:" + Client.Player.X + " Y:" + Client.Player.Y); 
        }
    }
}