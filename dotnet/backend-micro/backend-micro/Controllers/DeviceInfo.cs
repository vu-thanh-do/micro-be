using System.Management;

namespace backend_micro.Utils
{
    public class DeviceInfo
    {
        public static string GetProcessorId()
        {
            try
            {
                string processorId = string.Empty;
                ManagementObjectSearcher searcher = new ManagementObjectSearcher("select ProcessorId from Win32_Processor");
                foreach (ManagementObject obj in searcher.Get())
                {
                    processorId = obj["ProcessorId"].ToString();
                    break;
                }
                return processorId;
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }
    }
}
