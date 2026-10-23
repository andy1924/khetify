param(
  [Parameter(Mandatory)][string[]]$DeviceCommand,
  [string]$Serial = 'emulator-5554',
  [string]$DeviceSession = 'khetify-emulator-qa'
)

# Session pinned by T3 device_open for the current connected OnePlus.
$launcher = 'C:\Users\p\.t3\userdata\device\bin\agent-device.cmd'
$deviceArguments = @('--platform', 'android', '--serial', $Serial, '--config', 'C:\Users\p\.t3\userdata\device\hosts\25bf8e1a2393f1108d37029b.json', '--session', $DeviceSession)
& $launcher @DeviceCommand @deviceArguments
exit $LASTEXITCODE
