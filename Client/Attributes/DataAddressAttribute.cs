namespace MicrobotNxt.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Property | AttributeTargets.Field)]
class DataAddressAttribute : Attribute
{
    public long Address { get; }

    public DataAddressAttribute(long address)
    {
        Address = address;
    }
}