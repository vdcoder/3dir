// C:\Windows, C:\Program Files, C:\Program Files (x86) and C:\ProgramData.
// Realistic but compact: these areas exist so the computer feels real, and
// the world keeps them visually quiet (charter section 3).

import type { SeedFolder } from '../seedTypes'
import { dir, f, files, kinded, photo, text } from './helpers'

const INSTALLED = '2022-09-03 10:00'
// October 2026 cumulative update, installed overnight after Patch Tuesday (13 Oct).
const PATCHED = '2026-10-14 03:12'
// Files replaced by an update get a fresh created date, as on a real install.
const patched = (...names: string[]) => names.map((n) => f(n, { at: PATCHED }))

export const windows: SeedFolder = dir(
  'Windows',
  [
    dir('Boot', [
      dir('EFI', files('bootmgfw.efi', 'memtest.efi')),
      dir('Fonts', files('segoe_slboot.ttf', 'segmono_boot.ttf')),
    ]),
    dir('Fonts', [
      ...files('arial.ttf', 'arialbd.ttf', 'calibri.ttf', 'consola.ttf'),
      ...files('georgia.ttf', 'segoeui.ttf', 'seguiemj.ttf', 'tahoma.ttf', 'times.ttf', 'verdana.ttf'),
      ...kinded('system', 'cambria.ttc'),
    ]),
    dir('INF', [...kinded('system', 'usbport.inf', 'netrtwlanu.inf'), text('setupapi.dev.log', [
      '>>>  [Device Install (Hardware initiated) - USB\\VID_046D&PID_C52B\\5&2B7E1A&0&3]',
      '>>>  Section start 2026/10/14 03:19:42.117',
      '     dvi: Selected driver installs from section [HID_Inst.NT] in "input.inf".',
      '<<<  Section end 2026/10/14 03:19:43.006',
      '<<<  [Exit status: SUCCESS]',
    ], { kind: 'text', at: '2026-10-14 03:19' })]),
    dir('Logs', [
      dir('CBS', [text('CBS.log', [
        '2026-10-14 03:02:11, Info  CBS    TI: --- Initializing Trusted Installer ---',
        '2026-10-14 03:02:12, Info  CBS    Starting TrustedInstaller initialization.',
        '2026-10-14 03:09:47, Info  CBS    Exec: Processing complete. Session: 31183477_2046113054',
        '2026-10-14 03:12:05, Info  CBS    Reboot required: install pending for KB5066412',
        '2026-10-14 03:14:29, Info  CBS    Ending TrustedInstaller finalization.',
      ], { at: '2026-10-14 03:14', size: 4_812_330 })]),
      dir('DISM', [f('dism.log', { at: '2026-10-14 03:10' })]),
      dir('WindowsUpdate', files('WindowsUpdate.20261014.030215.118.1.etl', 'WindowsUpdate.20261020.091102.402.1.etl')),
    ]),
    dir('SysWOW64', files('kernel32.dll', 'ntdll.dll', 'vcruntime140.dll')),
    dir('System32', [
      dir('config', [
        ...kinded('system', 'DEFAULT', 'SAM', 'SECURITY', 'SOFTWARE', 'SYSTEM'),
        dir('RegBack', []),
      ]),
      dir('drivers', [
        dir('etc', [
          text('hosts', [
            '# Copyright (c) 1993-2009 Microsoft Corp.',
            '#',
            '# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.',
            '#',
            '# localhost name resolution is handled within DNS itself.',
            '#\t127.0.0.1       localhost',
            '#\t::1             localhost',
          ], { kind: 'text', size: 824 }),
          f('lmhosts.sam', { kind: 'text', size: 3683 }),
          f('networks', { kind: 'text', size: 407 }),
          f('protocol', { kind: 'text', size: 1358 }),
          f('services', { kind: 'text', size: 17635 }),
        ]),
        ...files('acpi.sys', 'disk.sys', 'USBXHCI.SYS'),
        ...patched('ntfs.sys', 'tcpip.sys'),
      ]),
      dir('en-US', files('cmd.exe.mui', 'notepad.exe.mui', 'shell32.dll.mui')),
      dir('WindowsPowerShell', [dir('v1.0', files('powershell.exe', 'powershell_ise.exe'))]),
      ...files('advapi32.dll', 'combase.dll', 'gdi32.dll', 'hal.dll'),
      ...files('kernel32.dll', 'ole32.dll', 'shell32.dll', 'user32.dll'),
      ...patched('kernelbase.dll', 'ntdll.dll', 'ntoskrnl.exe'),
      ...files('cmd.exe', 'csrss.exe', 'dwm.exe', 'lsass.exe'),
      ...files('msiexec.exe', 'notepad.exe', 'rundll32.exe', 'services.exe', 'smss.exe', 'svchost.exe', 'taskmgr.exe'),
      ...files('wininit.exe', 'winlogon.exe'),
    ]),
    dir('Temp', [
      f('~DF3A1C2B.tmp', { at: '2026-10-20 09:11', size: 16_384 }),
      f('MpSigStub.log', { at: '2026-10-23 06:40' }),
      f('msedge_installer.log', { at: '2026-10-16 02:05' }),
    ]),
    dir('Web', [
      dir('Screen', [
        photo('img100.jpg', 'A calm lock-screen landscape of rolling green hills under a pale morning mist, with a single winding road.', ['#7fa36b', '#c9d8c0', '#4d6a43', '#eef2ea']),
      ]),
      dir('Wallpaper', [
        dir('Windows', [
          photo('img0.jpg', 'An abstract bloom of translucent blue petals swirling out of a deep navy background, softly glowing at the centre.', ['#0a2a66', '#1f6fd1', '#7cc4ff', '#e6f3ff']),
          photo('img19.jpg', 'A dark-mode abstract wallpaper of folded ribbons of light in midnight blue and violet.', ['#0b1026', '#2b2d7a', '#6a5acd', '#b9b4ff']),
        ]),
      ]),
    ]),
    ...files('bfsvc.exe', 'explorer.exe', 'HelpPane.exe', 'notepad.exe', 'regedit.exe', 'splwow64.exe'),
    f('system.ini', { size: 219 }),
    f('win.ini', { size: 92 }),
    f('WindowsUpdate.log', { at: '2026-10-20 09:12', size: 276 }),
  ],
  INSTALLED,
)

export const programFiles: SeedFolder = dir(
  'Program Files',
  [
    dir('7-Zip', [...files('7z.dll', '7z.exe', '7zFM.exe', '7zG.exe', '7-zip.chm'), f('License.txt', { size: 4_212 }), f('readme.txt', { size: 1_958 })]),
    dir('Adobe', [
      dir('Acrobat DC', [dir('Acrobat', [...files('Acrobat.dll', 'Acrobat.exe'), dir('AcroCEF', files('AcroCEF.exe'))])]),
    ]),
    dir('Audacity', files('Audacity.exe', 'lib-audio-devices.dll')),
    dir('Common Files', [
      dir('microsoft shared', [
        dir('ClickToRun', files('OfficeClickToRun.exe')),
        dir('ink', files('TabTip.exe')),
      ]),
      dir('System', [dir('ado', files('msado15.dll'))]),
    ]),
    dir('Git', [dir('bin', files('git.exe', 'bash.exe')), dir('cmd', files('git.exe')), ...files('git-bash.exe')]),
    dir('Google', [
      dir('Chrome', [
        dir('Application', [
          dir('155.0.7610.88', [...files('chrome.dll', 'chrome_elf.dll'), dir('Locales', files('en-US.pak'))]),
          ...files('chrome.exe', 'chrome_proxy.exe'),
        ]),
      ]),
    ]),
    dir('Microsoft Office', [
      dir('root', [
        dir('Office16', [
          ...files('EXCEL.EXE', 'ONENOTE.EXE', 'OUTLOOK.EXE', 'POWERPNT.EXE', 'WINWORD.EXE'),
          ...files('oart.dll', 'ppcore.dll', 'wwlib.dll'),
        ]),
      ]),
    ]),
    dir('Microsoft OneDrive', files('FileSyncShell64.dll', 'OneDrive.exe')),
    dir('Microsoft VS Code', files('Code.exe')),
    dir('Mozilla Firefox', [...files('firefox.exe', 'mozglue.dll', 'xul.dll'), dir('defaults', [dir('pref', files('channel-prefs.js'))])]),
    dir('nodejs', [...files('node.exe'), ...kinded('executable', 'npm.cmd', 'npx.cmd')]),
    dir('SketchUp', [dir('SketchUp 2026', files('LayOut.exe', 'SketchUp.exe'))]),
    dir('VideoLAN', [dir('VLC', files('libvlc.dll', 'libvlccore.dll', 'vlc.exe'))]),
    dir('Windows Defender', [...files('MpClient.dll', 'NisSrv.exe'), ...patched('MpCmdRun.exe', 'MsMpEng.exe')]),
    dir('Windows NT', [dir('Accessories', files('wordpad.exe'))]),
  ],
  INSTALLED,
)

export const programFilesX86: SeedFolder = dir(
  'Program Files (x86)',
  [
    dir('Common Files', [dir('Adobe', [dir('ARM', [dir('1.0', files('AdobeARM.exe'))])])]),
    dir('Google', [dir('Update', files('GoogleUpdate.exe'))]),
    dir('Internet Explorer', files('iexplore.exe')),
    dir('Microsoft', [dir('Edge', [dir('Application', files('msedge.exe', 'msedge_proxy.exe'))])]),
    dir('Steam', [...files('steam.exe', 'steamclient.dll'), dir('steamapps', kinded('system', 'libraryfolders.vdf'))]),
  ],
  INSTALLED,
)

export const programData: SeedFolder = dir(
  'ProgramData',
  [
    dir('Microsoft', [
      dir('Windows', [
        dir('Start Menu', [
          dir('Programs', [
            ...files('Excel.lnk', 'Firefox.lnk', 'Google Chrome.lnk', 'Outlook.lnk', 'PowerPoint.lnk', 'Word.lnk'),
            dir('7-Zip', files('7-Zip File Manager.lnk')),
          ]),
        ]),
      ]),
      dir('Windows Defender', [dir('Support', [f('MPLog-20261019-091530.log', { since: '2026-10-19 09:15', at: '2026-10-23 06:41' })])]),
    ]),
    dir('Package Cache', [dir('{6F1C2E37-9B1A-4C36-8E1D-0A7F2B4D9C11}', files('VC_redist.x64.exe'))]),
  ],
  INSTALLED,
)
