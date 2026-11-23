#ifndef BuildDir
  #error BuildDir must point to the compiled application.
#endif
#ifndef OutputDir
  #error OutputDir is required.
#endif
#ifndef AppVersion
  #error AppVersion is required.
#endif

[Setup]
AppId={{66E281C0-C678-4AB4-BE45-FCBBD9F45174}
AppName={cm:AppName}
AppVersion={#AppVersion}
VersionInfoDescription=Ozgecmis Asistani Setup
VersionInfoProductName=Ozgecmis Asistani
AppPublisher=Selçuk Uçar
AppPublisherURL=https://github.com/selcukucar/cv-companion-pro
AppSupportURL=https://github.com/selcukucar/cv-companion-pro/issues
AppUpdatesURL=https://github.com/selcukucar/cv-companion-pro/releases
DefaultDirName={localappdata}\Programs\OzgecmisAsistani
DefaultGroupName={cm:AppName}
PrivilegesRequired=lowest
SetupArchitecture=x86
MinVersion=10.0
DisableProgramGroupPage=yes
OutputDir={#OutputDir}
OutputBaseFilename=OzgecmisAsistani-{#AppVersion}-setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayIcon={app}\OzgecmisAsistani.exe
CloseApplications=yes
RestartApplications=no
AppMutex=Local\OzgecmisAsistani.Desktop

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
turkish.AppName=Öz Geçmiş Asistanı
english.AppName=CV Assistant
turkish.NetRequired=Öz Geçmiş Asistanı için Microsoft .NET Framework 4.8 veya üzeri gerekir.%n%nMicrosoft indirme sayfası açılsın mı? Yükleme bittikten sonra bu kurulumu yeniden başlatın.
english.NetRequired=CV Assistant requires Microsoft .NET Framework 4.8 or later.%n%nOpen the Microsoft download page? Run this installer again after installing the runtime.
turkish.NetOpenFailed=Tarayıcı açılamadı. Microsoft indirme adresi: https://dotnet.microsoft.com/download/dotnet-framework/net48
english.NetOpenFailed=The browser could not be opened. Microsoft download address: https://dotnet.microsoft.com/download/dotnet-framework/net48
turkish.PortableFolder=Bu klasör bir taşınabilir kurulum içeriyor. Kurulum için farklı bir klasör seçin.
english.PortableFolder=This folder contains a portable copy. Select a different installation folder.
turkish.DraftArchiveFailed=Önceki yerel taslaklar arşivlenemedi. Dosya erişimini kontrol edip kurulumu yeniden deneyin.
english.DraftArchiveFailed=Previous local drafts could not be archived. Check file access and retry setup.

[Files]
Source: "{#BuildDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{cm:AppName}"; Filename: "{app}\OzgecmisAsistani.exe"

[Run]
Filename: "{app}\OzgecmisAsistani.exe"; Description: "{cm:LaunchProgram,{cm:AppName}}"; Flags: nowait postinstall skipifsilent

[Code]
function InitializeSetup: Boolean;
var
  Release: Cardinal;
  ErrorCode: Integer;
begin
  Result := RegQueryDWordValue(HKLM32, 'SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full', 'Release', Release) and (Release >= 528040);
  if Result then
    Exit;
  if SuppressibleMsgBox(ExpandConstant('{cm:NetRequired}'), mbConfirmation, MB_YESNO or MB_DEFBUTTON2, IDNO) = IDYES then
  begin
    if not ShellExec('open', 'https://dotnet.microsoft.com/download/dotnet-framework/net48', '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode) then
      SuppressibleMsgBox(ExpandConstant('{cm:NetOpenFailed}'), mbError, MB_OK, IDOK);
  end;
end;

function ExistingInstall: Boolean;
var
  Folder: String;
begin
  Result := RegQueryStringValue(HKCU32,
    'Software\Microsoft\Windows\CurrentVersion\Uninstall\{66E281C0-C678-4AB4-BE45-FCBBD9F45174}_is1',
    'InstallLocation', Folder) and FileExists(AddBackslash(Folder) + 'OzgecmisAsistani.exe');
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  DataFolder, Library, Archive, Stamp: String;
  Suffix: Integer;
begin
  Result := '';
  if FileExists(ExpandConstant('{app}\portable.mode')) then
  begin
    Result := ExpandConstant('{cm:PortableFolder}');
    Exit;
  end;
  if ExistingInstall then
    Exit;

  DataFolder := ExpandConstant('{localappdata}\OzgecmisAsistaniDesktop');
  Library := DataFolder + '\taslaklar.json';
  if not FileExists(Library) then
    Exit;

  Stamp := GetDateTimeString('yyyymmdd-hhnnss', '', '');
  Archive := DataFolder + '\taslaklar-onceki-' + Stamp + '.json';
  Suffix := 1;
  while FileExists(Archive) do
  begin
    Archive := DataFolder + '\taslaklar-onceki-' + Stamp + '-' + IntToStr(Suffix) + '.json';
    Suffix := Suffix + 1;
  end;
  if not RenameFile(Library, Archive) then
    Result := ExpandConstant('{cm:DraftArchiveFailed}');
end;
