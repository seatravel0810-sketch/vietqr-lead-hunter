Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = "D:\Replica skill\vietqr-lead-hunter"

' 1. Kiem tra xem port 3001 da co server lang nghe chua
Set execNetstat = WshShell.Exec("cmd /c netstat -ano | findstr :3001 | findstr LISTENING")
isListening = False
Do While Not execNetstat.StdOut.AtEndOfStream
    line = execNetstat.StdOut.ReadLine()
    If InStr(line, "LISTENING") > 0 Then
        isListening = True
        Exit Do
    End If
Loop

' 2. Neu chua co, khoi dong server ngam (0 = Hidden window, hoan toan khong hien cua so den)
If Not isListening Then
    WshShell.Run "cmd /c cd /d """ & projectDir & """ && node node_modules\next\dist\bin\next start -p 3001", 0, False
    
    ' Doi server khoi dong san sang (toi da 12 giay)
    For i = 1 To 12
        WScript.Sleep 1000
        Set checkExec = WshShell.Exec("cmd /c netstat -ano | findstr :3001 | findstr LISTENING")
        ready = False
        Do While Not checkExec.StdOut.AtEndOfStream
            chkLine = checkExec.StdOut.ReadLine()
            If InStr(chkLine, "LISTENING") > 0 Then
                ready = True
                Exit Do
            End If
        Loop
        If ready Then Exit For
    Next
End If

' 3. Mo che do Cua So Ung Dung doc lap (App Window) khong co thanh dia chi
WshShell.Run "msedge.exe --app=http://localhost:3001", 1, False
