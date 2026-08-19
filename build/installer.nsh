!ifndef BUILD_UNINSTALLER
  Function AddToStartup
    CreateShortCut "$SMSTARTUP\Snacka.lnk" "$INSTDIR\Snacka.exe" ""
  FunctionEnd

  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Run at startup"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION AddToStartup
!endif

!ifdef BUILD_UNINSTALLER
  Function un.AddAppData
    RMDir /r "$APPDATA\Snacka"
  FunctionEnd

  ; Using the read me setting to add option to remove app data
  !define MUI_FINISHPAGE_SHOWREADME
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Remove user data"
  !define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION un.AddAppData
!endif

!macro customInstall
  ; Remove dangling reference of version 2.13.1
  ${If} $installMode == "all"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\66bed7da-e601-54e6-b2e8-7be611d82556"
  ${Else}
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\66bed7da-e601-54e6-b2e8-7be611d82556"
  ${EndIf}
  !insertMacro disableAutoUpdates
  Delete "$SMSTARTUP\Snacka.lnk"
  !insertMacro registerTelephonyCapabilities
!macroend

!macro customUnInstall
  ${IfNot} ${Silent}
    Delete "$SMSTARTUP\Snacka.lnk"
  ${EndIf}
  !insertMacro unregisterTelephonyCapabilities
!macroend

; Register Snacka in RegisteredApplications + Capabilities\URLAssociations so
; the Windows 11 Default Apps picker exposes it as a candidate for tel/callto/sip
; and the `ms-settings:defaultapps?registeredApp{User|Machine}=Snacka` deep
; link lands on the app-specific page.
!macro registerTelephonyCapabilities
  ${If} $installMode == "all"
    !insertMacro writeTelephonyCapabilities HKLM
  ${Else}
    !insertMacro writeTelephonyCapabilities HKCU
  ${EndIf}
!macroend

!macro writeTelephonyCapabilities ROOT
  ; Per-scheme ProgIDs that the picker references through URLAssociations.
  WriteRegStr ${ROOT} "Software\Classes\Snacka.tel" "" "URL:Snacka Telephony"
  WriteRegStr ${ROOT} "Software\Classes\Snacka.tel" "URL Protocol" ""
  WriteRegStr ${ROOT} "Software\Classes\Snacka.tel\DefaultIcon" "" "$INSTDIR\Snacka.exe,0"
  WriteRegStr ${ROOT} "Software\Classes\Snacka.tel\shell\open\command" "" '"$INSTDIR\Snacka.exe" "%1"'

  WriteRegStr ${ROOT} "Software\Classes\Snacka.callto" "" "URL:Snacka Telephony"
  WriteRegStr ${ROOT} "Software\Classes\Snacka.callto" "URL Protocol" ""
  WriteRegStr ${ROOT} "Software\Classes\Snacka.callto\DefaultIcon" "" "$INSTDIR\Snacka.exe,0"
  WriteRegStr ${ROOT} "Software\Classes\Snacka.callto\shell\open\command" "" '"$INSTDIR\Snacka.exe" "%1"'

  ; Capabilities surface consumed by Windows 11 Default Apps.
  WriteRegStr ${ROOT} "Software\Snacka\Capabilities" "ApplicationName" "Snacka"
  WriteRegStr ${ROOT} "Software\Snacka\Capabilities" "ApplicationDescription" "Snacka Desktop"
  WriteRegStr ${ROOT} "Software\Snacka\Capabilities" "ApplicationIcon" "$INSTDIR\Snacka.exe,0"
  WriteRegStr ${ROOT} "Software\Snacka\Capabilities\URLAssociations" "tel" "Snacka.tel"
  WriteRegStr ${ROOT} "Software\Snacka\Capabilities\URLAssociations" "callto" "Snacka.callto"

  ; Entry point picked up by Default Apps and the ms-settings deep link.
  WriteRegStr ${ROOT} "Software\RegisteredApplications" "Snacka" "Software\Snacka\Capabilities"
!macroend

!macro unregisterTelephonyCapabilities
  ${If} $installMode == "all"
    !insertMacro deleteTelephonyCapabilities HKLM
  ${Else}
    !insertMacro deleteTelephonyCapabilities HKCU
  ${EndIf}
!macroend

!macro deleteTelephonyCapabilities ROOT
  DeleteRegValue ${ROOT} "Software\RegisteredApplications" "Snacka"
  DeleteRegKey ${ROOT} "Software\Snacka\Capabilities"
  DeleteRegKey /ifempty ${ROOT} "Software\Snacka"
  DeleteRegKey ${ROOT} "Software\Classes\Snacka.tel"
  DeleteRegKey ${ROOT} "Software\Classes\Snacka.callto"
  ; Snacka har aldrig skapat en .sip-ProgID, men nyckeln städas för paritet
  ; med uppströms registrering.
  DeleteRegKey ${ROOT} "Software\Classes\Snacka.sip"
!macroend

!macro disableAutoUpdates
  ${GetParameters} $R0
  ClearErrors
  ${GetOptions} $R0 "/disableAutoUpdates" $R1
  ${IfNot} ${Errors}
    !insertMacro writeUpdateFile
  ${EndIf}
!macroend

!macro writeUpdateFile
  FileOpen $4 '$INSTDIR\resources\update.json' w
  FileWrite $4 '{$\r$\n'
  FileWrite $4 '  "canUpdate": false,$\r$\n'
  FileWrite $4 '  "autoUpdate": false$\r$\n'
  FileWrite $4 '}$\r$\n'
  FileClose $4
!macroend
